import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const searchTools: Tool[] = [
  {
    name: 'search_items',
    description: 'Search across multiple item types in Pipedrive',
    inputSchema: {
      type: 'object',
      properties: {
        term: {
          type: 'string',
          description: 'Search term',
        },
        item_types: {
          type: 'string',
          description: 'Comma-separated item types to search (deal, person, organization, product, lead, file)',
        },
        fields: {
          type: 'string',
          description: 'Comma-separated fields to search in',
        },
        search_for_related_items: {
          type: 'boolean',
          description: 'Include related items in search',
        },
        exact_match: {
          type: 'boolean',
          description: 'Use exact match',
        },
        include_fields: {
          type: 'string',
          description: 'Comma-separated fields to include in results',
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