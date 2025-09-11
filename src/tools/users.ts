import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const userTools: Tool[] = [
  {
    name: 'get_users',
    description: 'Get all users (salespersons) from Pipedrive',
    inputSchema: {
      type: 'object',
      properties: {
        start: {
          type: 'number',
          description: 'Pagination start (default: 0)',
        },
        limit: {
          type: 'number',
          description: 'Number of items to return (default: 100, max: 500)',
        },
      },
    },
  },
  {
    name: 'get_user',
    description: 'Get details of a specific user by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The ID of the user to retrieve',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_current_user',
    description: 'Get details of the current authenticated user',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

export async function handleUserTool(toolName: string, client: any, args: any) {
  switch (toolName) {
    case 'get_users':
      return handleGetUsers(client, args);
    case 'get_user':
      return handleGetUser(client, args);
    case 'get_current_user':
      return handleGetCurrentUser(client, args);
    default:
      throw new Error(`Unknown user tool: ${toolName}`);
  }
}

async function handleGetUsers(client: any, args: any) {
  try {
    const { start = 0, limit = 100 } = args;
    
    const params = new URLSearchParams({
      start: start.toString(),
      limit: Math.min(limit, 500).toString(),
    });

    const response = await client.makeRequest(`/users?${params}`);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error getting users: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleGetUser(client: any, args: any) {
  try {
    const { id } = args;
    
    if (!id) {
      throw new Error('User ID is required');
    }

    const response = await client.makeRequest(`/users/${id}`);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error getting user: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleGetCurrentUser(client: any, args: any) {
  try {
    const response = await client.makeRequest('/users/me');
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error getting current user: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}