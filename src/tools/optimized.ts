import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const optimizedTools: Tool[] = [
  {
    name: 'get_deals_summary',
    description: 'Get a summarized list of deals (optimized for token usage) - shows essential fields only',
    inputSchema: {
      type: 'object',
      properties: {
        start: {
          type: 'number',
          description: 'Pagination start (default: 0)',
        },
        limit: {
          type: 'number',
          description: 'Number of items to return (default: 20, max: 50 for summary)',
        },
        status: {
          type: 'string',
          enum: ['all_not_deleted', 'open', 'won', 'lost', 'deleted'],
          description: 'Filter by deal status',
        },
        user_id: {
          type: 'number',
          description: 'Filter by user ID',
        },
      },
    },
  },
  {
    name: 'get_persons_summary', 
    description: 'Get a summarized list of persons (optimized for token usage) - shows essential fields only',
    inputSchema: {
      type: 'object',
      properties: {
        start: {
          type: 'number',
          description: 'Pagination start (default: 0)',
        },
        limit: {
          type: 'number',
          description: 'Number of items to return (default: 20, max: 50 for summary)',
        },
        user_id: {
          type: 'number',
          description: 'Filter by user ID',
        },
      },
    },
  },
  {
    name: 'get_organizations_summary',
    description: 'Get a summarized list of organizations (optimized for token usage) - shows essential fields only',
    inputSchema: {
      type: 'object',
      properties: {
        start: {
          type: 'number',
          description: 'Pagination start (default: 0)',
        },
        limit: {
          type: 'number', 
          description: 'Number of items to return (default: 20, max: 50 for summary)',
        },
        user_id: {
          type: 'number',
          description: 'Filter by user ID',
        },
      },
    },
  },
  {
    name: 'get_activities_summary',
    description: 'Get a summarized list of activities (optimized for token usage) - shows essential fields only',
    inputSchema: {
      type: 'object',
      properties: {
        start: {
          type: 'number',
          description: 'Pagination start (default: 0)',
        },
        limit: {
          type: 'number',
          description: 'Number of items to return (default: 20, max: 50 for summary)',
        },
        user_id: {
          type: 'number',
          description: 'Filter by user ID',
        },
        done: {
          type: 'boolean',
          description: 'Filter by completion status',
        },
      },
    },
  },
  {
    name: 'get_overview',
    description: 'Get a high-level overview with key metrics and recent items (very token-efficient)',
    inputSchema: {
      type: 'object',
      properties: {
        include_recent_deals: {
          type: 'boolean',
          description: 'Include 5 most recent deals (default: true)',
          default: true,
        },
        include_recent_activities: {
          type: 'boolean', 
          description: 'Include 5 most recent activities (default: true)',
          default: true,
        },
        user_id: {
          type: 'number',
          description: 'Filter by specific user (optional)',
        },
      },
    },
  },
  {
    name: 'search_summarized',
    description: 'Search across all Pipedrive items with summarized results (token-optimized)',
    inputSchema: {
      type: 'object',
      properties: {
        term: {
          type: 'string',
          description: 'Search term',
        },
        item_types: {
          type: 'string',
          description: 'Comma-separated list of item types to search (deal,person,organization,product)',
        },
        limit: {
          type: 'number',
          description: 'Number of results to return (default: 10, max: 20 for summary)',
        },
      },
      required: ['term'],
    },
  },
];