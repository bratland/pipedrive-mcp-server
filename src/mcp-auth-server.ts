import express, { Request, Response } from 'express';
import { PipedriveClient } from './pipedrive-client.js';
import { dealTools } from './tools/deals.js';
import { personTools } from './tools/persons.js';
import { organizationTools } from './tools/organizations.js';
import { pipelineTools } from './tools/pipelines.js';
import { activityTools } from './tools/activities.js';
import { noteTools } from './tools/notes.js';
import { searchTools } from './tools/search.js';
import { UserManager } from './auth/user-manager.js';
import { AuthMiddleware, UserRateLimiter, createRateLimitMiddleware } from './auth/auth-middleware.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const userAgent = req.headers['user-agent'] || 'unknown';
  const authHeader = req.headers.authorization;
  
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  console.log(`  User-Agent: ${userAgent}`);
  console.log(`  Authorization: ${authHeader ? `${authHeader.substring(0, 20)}...` : 'MISSING'}`);
  console.log(`  Content-Type: ${req.headers['content-type'] || 'none'}`);
  console.log(`  Body: ${JSON.stringify(req.body).substring(0, 200)}...`);
  
  // Log response
  const originalSend = res.send;
  res.send = function(body) {
    console.log(`[${timestamp}] Response ${res.statusCode} ${res.statusMessage}`);
    if (res.statusCode >= 400) {
      console.log(`  Error Response: ${typeof body === 'string' ? body.substring(0, 500) : JSON.stringify(body).substring(0, 500)}`);
    }
    return originalSend.call(this, body);
  };
  
  next();
});

const PORT = process.env.PORT || 8080;

// Initialize authentication system
const userManager = new UserManager();
const authMiddleware = new AuthMiddleware(userManager);
const rateLimiter = new UserRateLimiter();
const rateLimitMiddleware = createRateLimitMiddleware(rateLimiter);

// Track user session state (which users have initialized) - allowing multiple sessions per user
const userSessions = new Map<string, Set<string>>();

// Server capabilities and state
const serverCapabilities = {
  tools: {},
  prompts: {},
};

// Combine all tools
const allTools = [
  ...dealTools,
  ...personTools,
  ...organizationTools,
  ...pipelineTools,
  ...activityTools,
  ...noteTools,
  ...searchTools,
];

const prompts = [
  {
    name: 'list_all_deals',
    description: 'List all deals with their details',
    arguments: [],
  },
  {
    name: 'search_person',
    description: 'Search for a person by name',
    arguments: [
      {
        name: 'name',
        description: 'Name of the person to search for',
        required: true,
      },
    ],
  },
  {
    name: 'get_organization_deals',
    description: 'Get all deals for a specific organization',
    arguments: [
      {
        name: 'org_id',
        description: 'Organization ID',
        required: true,
      },
    ],
  },
  {
    name: 'pipeline_overview',
    description: 'Get overview of all pipelines and their stages',
    arguments: [],
  },
];

// Health check endpoint (no auth required)
app.get('/health', (_req: Request, res: Response) => {
  const stats = userManager.getUserStats();
  res.json({ 
    status: 'healthy', 
    service: 'pipedrive-mcp-server',
    authenticated: true,
    userStats: stats
  });
});

// Root endpoint (no auth required)
app.get('/', (_req: Request, res: Response) => {
  const stats = userManager.getUserStats();
  res.json({
    name: 'Pipedrive MCP Server (Authenticated)',
    version: '1.0.0',
    description: 'MCP-compliant server with multi-user authentication for Pipedrive API integration',
    specification: 'https://modelcontextprotocol.io/specification/2025-06-18',
    endpoints: ['/mcp', '/admin'],
    authentication: 'Bearer token required',
    tools: allTools.length,
    prompts: prompts.length,
    userStats: stats
  });
});

// Admin endpoints for user management
app.post('/admin/users', authMiddleware.adminAuth, (req: Request, res: Response) => {
  const { name, email, pipedriveApiToken } = req.body;
  
  if (!name || !email || !pipedriveApiToken) {
    return res.status(400).json({
      error: 'Missing required fields: name, email, pipedriveApiToken'
    });
  }
  
  if (!UserManager.isValidPipedriveToken(pipedriveApiToken)) {
    return res.status(400).json({
      error: 'Invalid Pipedrive API token format'
    });
  }
  
  const user = userManager.createUser(name, email, pipedriveApiToken);
  
  res.json({
    message: 'User created successfully',
    user: {
      id: user.id,
      bearerToken: user.bearerToken,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    }
  });
});

app.get('/admin/users', authMiddleware.adminAuth, (_req: Request, res: Response) => {
  const users = userManager.listUsers();
  const stats = userManager.getUserStats();
  
  res.json({
    users,
    stats
  });
});

app.delete('/admin/users/:token', authMiddleware.adminAuth, (req: Request, res: Response) => {
  const bearerToken = req.params.token;
  const success = userManager.revokeUser(bearerToken);
  
  if (success) {
    res.json({ message: 'User revoked successfully' });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// MCP endpoint with authentication
app.post('/mcp', 
  authMiddleware.authenticate, 
  rateLimitMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { jsonrpc, id, method, params } = req.body;
      const user = req.user!; // We know user exists due to auth middleware

      // Create Pipedrive client with user's API token
      const client = new PipedriveClient({ apiToken: user.pipedriveApiToken });

      // Validate JSON-RPC 2.0 format
      if (jsonrpc !== '2.0') {
        return res.status(400).json({
          jsonrpc: '2.0',
          id: id || null,
          error: {
            code: -32600,
            message: 'Invalid Request',
            data: 'Missing or invalid jsonrpc version. Must be "2.0"'
          }
        });
      }

      if (!method) {
        return res.status(400).json({
          jsonrpc: '2.0',
          id: id || null,
          error: {
            code: -32600,
            message: 'Invalid Request',
            data: 'Missing required "method" field'
          }
        });
      }

      // Check if this specific session has been initialized (using request ID as session identifier)
      const sessionId = id?.toString() || `session-${Date.now()}-${Math.random()}`;
      const userSessionSet = userSessions.get(user.id) || new Set<string>();
      const isInitialized = userSessionSet.has(sessionId);

      switch (method) {
        case 'initialize':
          if (!userSessions.has(user.id)) {
            userSessions.set(user.id, new Set<string>());
          }
          userSessions.get(user.id)!.add(sessionId);
          
          // Support multiple protocol versions for n8n compatibility
          const requestedVersion = params?.protocolVersion || '2025-06-18';
          const supportedVersions = ['2024-11-05', '2025-03-26', '2025-06-18'];
          const responseVersion = supportedVersions.includes(requestedVersion) 
            ? requestedVersion 
            : '2025-06-18';
          
          return res.json({
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: responseVersion,
              capabilities: serverCapabilities,
              serverInfo: {
                name: 'pipedrive-mcp-server',
                version: '1.0.0'
              }
            }
          });

        case 'tools/list':
          // Remove initialization requirement for n8n compatibility

          return res.json({
            jsonrpc: '2.0',
            id,
            result: {
              tools: allTools.map(tool => ({
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema
              }))
            }
          });

        case 'prompts/list':
          // Remove initialization requirement for n8n compatibility

          return res.json({
            jsonrpc: '2.0',
            id,
            result: {
              prompts: prompts.map(prompt => ({
                name: prompt.name,
                description: prompt.description,
                arguments: prompt.arguments
              }))
            }
          });

        case 'prompts/get':
          // Remove initialization requirement for n8n compatibility

          const { name: promptName, arguments: promptArgs } = params || {};
          
          switch (promptName) {
            case 'list_all_deals':
              return res.json({
                jsonrpc: '2.0',
                id,
                result: {
                  messages: [
                    {
                      role: 'user',
                      content: {
                        type: 'text',
                        text: 'List all deals with their current status, value, and associated contacts'
                      }
                    }
                  ]
                }
              });
              
            case 'search_person':
              return res.json({
                jsonrpc: '2.0',
                id,
                result: {
                  messages: [
                    {
                      role: 'user',
                      content: {
                        type: 'text',
                        text: `Search for a person named "${promptArgs?.name || ''}" and show their contact information and associated deals`
                      }
                    }
                  ]
                }
              });
              
            case 'get_organization_deals':
              return res.json({
                jsonrpc: '2.0',
                id,
                result: {
                  messages: [
                    {
                      role: 'user',
                      content: {
                        type: 'text',
                        text: `Get all deals associated with organization ID ${promptArgs?.org_id || ''} including their status and value`
                      }
                    }
                  ]
                }
              });
              
            case 'pipeline_overview':
              return res.json({
                jsonrpc: '2.0',
                id,
                result: {
                  messages: [
                    {
                      role: 'user',
                      content: {
                        type: 'text',
                        text: 'Provide an overview of all pipelines and their stages, including deal counts per stage'
                      }
                    }
                  ]
                }
              });
              
            default:
              return res.status(404).json({
                jsonrpc: '2.0',
                id: id || null,
                error: {
                  code: -32601,
                  message: 'Prompt not found',
                  data: `Prompt "${promptName}" not found`
                }
              });
          }

        case 'tools/call':
          // Remove initialization requirement for n8n compatibility

          const { name: toolName, arguments: toolArgs } = params || {};

          if (!toolName) {
            return res.status(400).json({
              jsonrpc: '2.0',
              id: id || null,
              error: {
                code: -32602,
                message: 'Invalid params',
                data: 'Missing required "name" parameter'
              }
            });
          }

          try {
            let result;
            
            // Execute tool with user's Pipedrive client
            switch (toolName) {
              case 'get_deals':
                result = await client.getDeals(toolArgs);
                break;
                
              case 'get_deal':
                if (!toolArgs?.id) {
                  return res.status(400).json({
                    jsonrpc: '2.0',
                    id: id || null,
                    error: {
                      code: -32602,
                      message: 'Invalid params',
                      data: 'Missing required "id" parameter for get_deal'
                    }
                  });
                }
                result = await client.getDeal(toolArgs.id);
                break;
                
              case 'search_deals':
                if (!toolArgs?.term) {
                  return res.status(400).json({
                    jsonrpc: '2.0',
                    id: id || null,
                    error: {
                      code: -32602,
                      message: 'Invalid params',
                      data: 'Missing required "term" parameter for search_deals'
                    }
                  });
                }
                const { term: dealTerm, ...dealParams } = toolArgs;
                result = await client.searchDeals(dealTerm, dealParams);
                break;
                
              case 'get_persons':
                result = await client.getPersons(toolArgs);
                break;
                
              case 'get_person':
                if (!toolArgs?.id) {
                  return res.status(400).json({
                    jsonrpc: '2.0',
                    id: id || null,
                    error: {
                      code: -32602,
                      message: 'Invalid params',
                      data: 'Missing required "id" parameter for get_person'
                    }
                  });
                }
                result = await client.getPerson(toolArgs.id);
                break;
                
              case 'search_persons':
                if (!toolArgs?.term) {
                  return res.status(400).json({
                    jsonrpc: '2.0',
                    id: id || null,
                    error: {
                      code: -32602,
                      message: 'Invalid params',
                      data: 'Missing required "term" parameter for search_persons'
                    }
                  });
                }
                const { term: personTerm, ...personParams } = toolArgs;
                result = await client.searchPersons(personTerm, personParams);
                break;
                
              case 'get_organizations':
                result = await client.getOrganizations(toolArgs);
                break;
                
              case 'get_organization':
                if (!toolArgs?.id) {
                  return res.status(400).json({
                    jsonrpc: '2.0',
                    id: id || null,
                    error: {
                      code: -32602,
                      message: 'Invalid params',
                      data: 'Missing required "id" parameter for get_organization'
                    }
                  });
                }
                result = await client.getOrganization(toolArgs.id);
                break;
                
              case 'search_organizations':
                if (!toolArgs?.term) {
                  return res.status(400).json({
                    jsonrpc: '2.0',
                    id: id || null,
                    error: {
                      code: -32602,
                      message: 'Invalid params',
                      data: 'Missing required "term" parameter for search_organizations'
                    }
                  });
                }
                const { term: orgTerm, ...orgParams } = toolArgs;
                result = await client.searchOrganizations(orgTerm, orgParams);
                break;
                
              case 'get_pipelines':
                result = await client.getPipelines();
                break;
                
              case 'get_pipeline':
                if (!toolArgs?.id) {
                  return res.status(400).json({
                    jsonrpc: '2.0',
                    id: id || null,
                    error: {
                      code: -32602,
                      message: 'Invalid params',
                      data: 'Missing required "id" parameter for get_pipeline'
                    }
                  });
                }
                result = await client.getPipeline(toolArgs.id);
                break;
                
              case 'get_stages':
                result = await client.getStages(toolArgs?.pipeline_id);
                break;
                
              case 'get_stage':
                if (!toolArgs?.id) {
                  return res.status(400).json({
                    jsonrpc: '2.0',
                    id: id || null,
                    error: {
                      code: -32602,
                      message: 'Invalid params',
                      data: 'Missing required "id" parameter for get_stage'
                    }
                  });
                }
                result = await client.getStage(toolArgs.id);
                break;
                
              case 'get_activities':
                result = await client.getActivities(toolArgs);
                break;
                
              case 'get_activity':
                if (!toolArgs?.id) {
                  return res.status(400).json({
                    jsonrpc: '2.0',
                    id: id || null,
                    error: {
                      code: -32602,
                      message: 'Invalid params',
                      data: 'Missing required "id" parameter for get_activity'
                    }
                  });
                }
                result = await client.getActivity(toolArgs.id);
                break;
                
              case 'get_notes':
                result = await client.getNotes(toolArgs);
                break;
                
              case 'get_note':
                if (!toolArgs?.id) {
                  return res.status(400).json({
                    jsonrpc: '2.0',
                    id: id || null,
                    error: {
                      code: -32602,
                      message: 'Invalid params',
                      data: 'Missing required "id" parameter for get_note'
                    }
                  });
                }
                result = await client.getNote(toolArgs.id);
                break;
                
              case 'search_items':
                if (!toolArgs?.term) {
                  return res.status(400).json({
                    jsonrpc: '2.0',
                    id: id || null,
                    error: {
                      code: -32602,
                      message: 'Invalid params',
                      data: 'Missing required "term" parameter for search_items'
                    }
                  });
                }
                const { term: searchTerm, ...searchParams } = toolArgs;
                result = await client.searchItems(searchTerm, searchParams);
                break;
                
              default:
                return res.status(404).json({
                  jsonrpc: '2.0',
                  id: id || null,
                  error: {
                    code: -32601,
                    message: 'Method not found',
                    data: `Tool "${toolName}" not found`
                  }
                });
            }

            // Check if the Pipedrive API call was successful
            if (result && !result.success) {
              return res.json({
                jsonrpc: '2.0',
                id,
                result: {
                  content: [
                    {
                      type: 'text',
                      text: JSON.stringify(result, null, 2)
                    }
                  ],
                  isError: true
                }
              });
            }

            return res.json({
              jsonrpc: '2.0',
              id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                  }
                ],
                isError: false
              }
            });

          } catch (error) {
            return res.json({
              jsonrpc: '2.0',
              id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: `Error executing tool "${toolName}": ${error instanceof Error ? error.message : 'Unknown error'}`
                  }
                ],
                isError: true
              }
            });
          }

        case 'notifications/initialized':
          // n8n sends this after initialization - just acknowledge
          return res.json({
            jsonrpc: '2.0',
            id,
            result: {}
          });

        default:
          return res.status(404).json({
            jsonrpc: '2.0',
            id: id || null,
            error: {
              code: -32601,
              message: 'Method not found',
              data: `Method "${method}" not supported`
            }
          });
      }

    } catch (error) {
      console.error('MCP endpoint error:', error);
      return res.status(500).json({
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('Server error:', err);
  res.status(500).json({
    jsonrpc: '2.0',
    id: null,
    error: {
      code: -32603,
      message: 'Internal error',
      data: err.message || 'Internal server error'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Authenticated Pipedrive MCP Server running on port ${PORT}`);
  console.log(`MCP endpoint available at: http://localhost:${PORT}/mcp`);
  console.log(`Admin endpoint available at: http://localhost:${PORT}/admin`);
  console.log(`Specification: https://modelcontextprotocol.io/specification/2025-06-18`);
  console.log(`Loaded ${userManager.getUserStats().totalUsers} users`);
});