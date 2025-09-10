import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const pipelineTools: Tool[] = [
  {
    name: 'get_pipelines',
    description: 'Get all pipelines',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_pipeline',
    description: 'Get a specific pipeline by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'Pipeline ID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_stages',
    description: 'Get pipeline stages',
    inputSchema: {
      type: 'object',
      properties: {
        pipeline_id: {
          type: 'number',
          description: 'Filter stages by pipeline ID',
        },
      },
    },
  },
  {
    name: 'get_stage',
    description: 'Get a specific stage by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'Stage ID',
        },
      },
      required: ['id'],
    },
  },
];