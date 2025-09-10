import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const activityTools: Tool[] = [
  {
    name: 'get_activities',
    description: 'Get a list of activities from Pipedrive',
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
        user_id: {
          type: 'number',
          description: 'Filter by user ID',
        },
        filter_id: {
          type: 'number',
          description: 'Predefined filter ID',
        },
        type: {
          type: 'string',
          description: 'Filter by activity type',
        },
        done: {
          type: 'number',
          enum: [0, 1],
          description: 'Filter by completion status (0: not done, 1: done)',
        },
      },
    },
  },
  {
    name: 'get_activity',
    description: 'Get a specific activity by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'Activity ID',
        },
      },
      required: ['id'],
    },
  },
];