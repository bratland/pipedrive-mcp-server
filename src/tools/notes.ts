import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const noteTools: Tool[] = [
  {
    name: 'get_notes',
    description: 'Get a list of notes from Pipedrive',
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
        deal_id: {
          type: 'number',
          description: 'Filter by deal ID',
        },
        person_id: {
          type: 'number',
          description: 'Filter by person ID',
        },
        org_id: {
          type: 'number',
          description: 'Filter by organization ID',
        },
        pinned_to_deal_flag: {
          type: 'number',
          enum: [0, 1],
          description: 'Filter by pinned to deal flag',
        },
        pinned_to_person_flag: {
          type: 'number',
          enum: [0, 1],
          description: 'Filter by pinned to person flag',
        },
        pinned_to_organization_flag: {
          type: 'number',
          enum: [0, 1],
          description: 'Filter by pinned to organization flag',
        },
      },
    },
  },
  {
    name: 'get_note',
    description: 'Get a specific note by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'Note ID',
        },
      },
      required: ['id'],
    },
  },
];