import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const dealTools: Tool[] = [
  {
    name: 'get_deals',
    description: 'Get a list of deals from Pipedrive',
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
        status: {
          type: 'string',
          enum: ['all_not_deleted', 'open', 'won', 'lost', 'deleted'],
          description: 'Filter by deal status',
        },
        filter_id: {
          type: 'number',
          description: 'Predefined filter ID',
        },
        user_id: {
          type: 'number',
          description: 'Filter by user ID',
        },
        person_id: {
          type: 'number',
          description: 'Filter by person ID',
        },
        org_id: {
          type: 'number',
          description: 'Filter by organization ID',
        },
      },
    },
  },
  {
    name: 'get_deal',
    description: 'Get a specific deal by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'Deal ID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'search_deals',
    description: 'Search for deals',
    inputSchema: {
      type: 'object',
      properties: {
        term: {
          type: 'string',
          description: 'Search term',
        },
        fields: {
          type: 'string',
          description: 'Comma-separated fields to search in',
        },
        exact_match: {
          type: 'boolean',
          description: 'Use exact match',
        },
        person_id: {
          type: 'number',
          description: 'Filter by person ID',
        },
        org_id: {
          type: 'number',
          description: 'Filter by organization ID',
        },
        start: {
          type: 'number',
          description: 'Pagination start',
        },
        limit: {
          type: 'number',
          description: 'Number of items to return',
        },
      },
      required: ['term'],
    },
  },
];