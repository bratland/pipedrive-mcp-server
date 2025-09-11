import crypto from 'crypto';

export interface User {
  id: string;
  bearerToken: string;
  pipedriveApiToken: string;
  name?: string;
  email?: string;
  createdAt: Date;
  lastUsed?: Date;
}

export interface UserStore {
  [bearerToken: string]: {
    id: string;
    pipedriveApiToken: string;
    name?: string;
    email?: string;
    createdAt: Date;
    lastUsed?: Date;
  };
}

export class UserManager {
  private users: UserStore = {};
  
  constructor() {
    this.loadUsers();
  }

  private loadUsers(): void {
    // Load users from environment variables or external storage
    // Format: USER_<ID>=bearer_token:pipedrive_api_token:name:email
    const userEnvs = Object.keys(process.env).filter(key => key.startsWith('MCP_USER_'));
    
    for (const envKey of userEnvs) {
      const envValue = process.env[envKey];
      if (!envValue) continue;
      
      const [bearerToken, pipedriveApiToken, name = '', email = ''] = envValue.split(':');
      if (!bearerToken || !pipedriveApiToken) {
        console.warn(`Invalid user configuration in ${envKey}`);
        continue;
      }
      
      const userId = envKey.replace('MCP_USER_', '');
      this.users[bearerToken] = {
        id: userId,
        pipedriveApiToken,
        name: name || undefined,
        email: email || undefined,
        createdAt: new Date(),
      };
    }
    
    console.log(`Loaded ${Object.keys(this.users).length} authenticated users`);
  }

  public authenticateUser(bearerToken: string): User | null {
    const user = this.users[bearerToken];
    if (!user) {
      return null;
    }
    
    // Update last used timestamp
    user.lastUsed = new Date();
    
    return {
      id: user.id,
      bearerToken,
      pipedriveApiToken: user.pipedriveApiToken,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      lastUsed: user.lastUsed,
    };
  }

  public createUser(name: string, email: string, pipedriveApiToken: string): User {
    const bearerToken = this.generateBearerToken();
    const userId = crypto.randomUUID();
    
    const user: User = {
      id: userId,
      bearerToken,
      pipedriveApiToken,
      name,
      email,
      createdAt: new Date(),
    };
    
    this.users[bearerToken] = {
      id: userId,
      pipedriveApiToken,
      name,
      email,
      createdAt: user.createdAt,
    };
    
    console.log(`Created new user: ${userId} (${name})`);
    return user;
  }

  public revokeUser(bearerToken: string): boolean {
    if (!this.users[bearerToken]) {
      return false;
    }
    
    const user = this.users[bearerToken];
    delete this.users[bearerToken];
    console.log(`Revoked user: ${user.id} (${user.name || 'Unknown'})`);
    return true;
  }

  public listUsers(): User[] {
    return Object.entries(this.users).map(([bearerToken, user]) => ({
      id: user.id,
      bearerToken,
      pipedriveApiToken: '***' + user.pipedriveApiToken.slice(-4), // Masked for security
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      lastUsed: user.lastUsed,
    }));
  }

  public getUserStats() {
    const users = Object.values(this.users);
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return {
      totalUsers: users.length,
      activeToday: users.filter(u => u.lastUsed && u.lastUsed > oneDayAgo).length,
      averageAge: users.length > 0 
        ? users.reduce((sum, u) => sum + (now.getTime() - u.createdAt.getTime()), 0) / users.length / (1000 * 60 * 60 * 24)
        : 0,
    };
  }

  private generateBearerToken(): string {
    // Generate a secure random bearer token
    return 'mcp_' + crypto.randomBytes(32).toString('hex');
  }

  // Utility method to validate Pipedrive API token format
  public static isValidPipedriveToken(token: string): boolean {
    // Pipedrive API tokens are typically 40 character hex strings
    return /^[a-f0-9]{40}$/i.test(token);
  }
}