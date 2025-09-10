import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const personTools: Tool[] = [
  {
    name: 'get_persons',
    description: 'Get a list of persons from Pipedrive',
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
        first_char: {
          type: 'string',
          description: 'Filter by first letter of name',
        },
      },
    },
  },
  {
    name: 'get_person',
    description: 'Get a specific person by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'Person ID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'search_persons',
    description: 'Search for persons',
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