import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const quarterlyTools: Tool[] = [
  {
    name: 'get_current_quarter_deals',
    description: 'Get deals for the current quarter with date context (automatically uses correct quarter based on today\'s date)',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['all_not_deleted', 'open', 'won', 'lost'],
          description: 'Filter by deal status (default: all_not_deleted)',
        },
        user_id: {
          type: 'number',
          description: 'Filter by specific user/salesperson',
        },
        limit: {
          type: 'number',
          description: 'Max number of deals to return (default: 50)',
        },
      },
    },
  },
  {
    name: 'get_quarter_summary',
    description: 'Get comprehensive quarterly summary with key metrics and current quarter context',
    inputSchema: {
      type: 'object',
      properties: {
        quarter: {
          type: 'string',
          enum: ['Q1', 'Q2', 'Q3', 'Q4', 'current'],
          description: 'Which quarter to analyze (default: current)',
        },
        year: {
          type: 'number',
          description: 'Year for the quarter (default: current year)',
        },
        user_id: {
          type: 'number',
          description: 'Filter by specific user (optional)',
        },
      },
    },
  },
  {
    name: 'get_quarterly_progress',
    description: 'Get progress tracking for current quarter with forecasting data and date awareness',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: {
          type: 'number',
          description: 'Filter by specific user (optional)',
        },
        include_forecast: {
          type: 'boolean',
          description: 'Include deal probability-based forecasting (default: true)',
        },
      },
    },
  },
];