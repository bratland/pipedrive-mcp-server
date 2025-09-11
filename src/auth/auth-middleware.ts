import { Request, Response, NextFunction } from 'express';
import { UserManager, User } from './user-manager.js';

// Extend Express Request interface to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export class AuthMiddleware {
  constructor(private userManager: UserManager) {}

  public authenticate = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log(`AUTH ERROR: Missing Authorization header from ${req.ip}`);
      console.log(`  Headers: ${JSON.stringify(req.headers, null, 2)}`);
      res.status(401).json({
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: {
          code: -32001,
          message: 'Unauthorized',
          data: 'Missing Authorization header'
        }
      });
      return;
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.log(`AUTH ERROR: Invalid Authorization header format from ${req.ip}`);
      console.log(`  Received: "${authHeader}"`);
      console.log(`  Expected format: "Bearer <token>"`);
      res.status(401).json({
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: {
          code: -32001,
          message: 'Unauthorized',
          data: 'Invalid Authorization header format. Use: Bearer <token>'
        }
      });
      return;
    }

    const bearerToken = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!bearerToken) {
      res.status(401).json({
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: {
          code: -32001,
          message: 'Unauthorized',
          data: 'Missing bearer token'
        }
      });
      return;
    }

    const user = this.userManager.authenticateUser(bearerToken);
    
    if (!user) {
      console.log(`AUTH ERROR: Invalid bearer token from ${req.ip}`);
      console.log(`  Token: ${bearerToken.substring(0, 20)}...${bearerToken.substring(bearerToken.length - 4)}`);
      console.log(`  Available tokens count: ${Object.keys(this.userManager.listUsers()).length}`);
      res.status(401).json({
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: {
          code: -32001,
          message: 'Unauthorized',
          data: 'Invalid bearer token'
        }
      });
      return;
    }

    // Attach user to request for use in route handlers
    console.log(`AUTH SUCCESS: User ${user.name} (${user.id}) authenticated from ${req.ip}`);
    req.user = user;
    next();
  };

  public requireAuth = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(500).json({
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: {
          code: -32603,
          message: 'Internal error',
          data: 'Authentication middleware not properly configured'
        }
      });
      return;
    }
    next();
  };

  public optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const bearerToken = authHeader.substring(7);
      if (bearerToken) {
        const user = this.userManager.authenticateUser(bearerToken);
        if (user) {
          req.user = user;
        }
      }
    }
    
    next();
  };

  public adminAuth = (req: Request, res: Response, next: NextFunction): void => {
    const adminToken = process.env.MCP_ADMIN_TOKEN;
    
    if (!adminToken) {
      res.status(500).json({
        error: 'Admin authentication not configured'
      });
      return;
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Missing or invalid Authorization header'
      });
      return;
    }

    const token = authHeader.substring(7);
    
    if (token !== adminToken) {
      res.status(403).json({
        error: 'Insufficient permissions'
      });
      return;
    }
    
    next();
  };
}

// Utility function to extract bearer token from request
export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// Rate limiting per user
export class UserRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) { // 100 requests per minute
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    
    // Clean up old entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [userId, data] of this.requests.entries()) {
        if (now > data.resetTime) {
          this.requests.delete(userId);
        }
      }
    }, 5 * 60 * 1000);
  }

  public checkLimit(userId: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const userData = this.requests.get(userId);
    
    if (!userData || now > userData.resetTime) {
      // First request or window expired
      this.requests.set(userId, {
        count: 1,
        resetTime: now + this.windowMs
      });
      
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: now + this.windowMs
      };
    }
    
    if (userData.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: userData.resetTime
      };
    }
    
    userData.count++;
    
    return {
      allowed: true,
      remaining: this.maxRequests - userData.count,
      resetTime: userData.resetTime
    };
  }
}

// Rate limiting middleware
export function createRateLimitMiddleware(rateLimiter: UserRateLimiter) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      // No authenticated user - apply default rate limiting by IP
      next();
      return;
    }

    const result = rateLimiter.checkLimit(req.user.id);
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
    });
    
    if (!result.allowed) {
      res.status(429).json({
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: {
          code: -32000,
          message: 'Rate limit exceeded',
          data: `Too many requests. Limit resets at ${new Date(result.resetTime).toISOString()}`
        }
      });
      return;
    }
    
    next();
  };
}