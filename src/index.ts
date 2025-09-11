#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { PipedriveClient } from './pipedrive-client.js';
import { dealTools } from './tools/deals.js';
import { personTools } from './tools/persons.js';
import { organizationTools } from './tools/organizations.js';
import { pipelineTools } from './tools/pipelines.js';
import { activityTools } from './tools/activities.js';
import { noteTools } from './tools/notes.js';
import { searchTools } from './tools/search.js';
import { userTools } from './tools/users.js';
import { optimizedTools } from './tools/optimized.js';
import { quarterlyTools } from './tools/quarterly.js';
import { optimizeResponse } from './utils/token-optimizer.js';
import { addDateContextToResponse } from './utils/date-context.js';
import dotenv from 'dotenv';

dotenv.config();

const server = new Server(
  {
    name: 'pipedrive-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

const apiToken = process.env.PIPEDRIVE_API_TOKEN;
if (!apiToken) {
  console.error('Error: PIPEDRIVE_API_TOKEN environment variable is not set');
  process.exit(1);
}

const client = new PipedriveClient({ apiToken });

const allTools = [
  ...dealTools,
  ...personTools,
  ...organizationTools,
  ...pipelineTools,
  ...activityTools,
  ...noteTools,
  ...searchTools,
  ...userTools,
  ...optimizedTools,
  ...quarterlyTools,
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

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: allTools,
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_deals': {
        const result = await client.getDeals(args as any);
        const withContext = addDateContextToResponse(result);
        return { content: [{ type: 'text', text: JSON.stringify(withContext, null, 2) }] };
      }
      
      case 'get_deal': {
        const { id } = args as { id: number };
        const result = await client.getDeal(id);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      
      case 'search_deals': {
        const { term, ...params } = args as any;
        const result = await client.searchDeals(term, params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      
      case 'get_persons': {
        const result = await client.getPersons(args as any);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      
      case 'get_person': {
        const { id } = args as { id: number };
        const result = await client.getPerson(id);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      
      case 'search_persons': {
        const { term, ...params } = args as any;
        const result = await client.searchPersons(term, params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      
      case 'get_organizations': {
        const result = await client.getOrganizations(args as any);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      
      case 'get_organization': {
        const { id } = args as { id: number };
        const result = await client.getOrganization(id);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      
      case 'search_organizations': {
        const { term, ...params } = args as any;
        const result = await client.searchOrganizations(term, params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      
      case 'get_pipelines': {
        const result = await client.getPipelines();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      
      case 'get_pipeline': {
        const { id } = args as { id: number };
        const result = await client.getPipeline(id);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      
      case 'get_stages': {
        const { pipeline_id } = args as { pipeline_id?: number };
        const result = await client.getStages(pipeline_id);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      
      case 'get_stage': {
        const { id } = args as { id: number };
        const result = await client.getStage(id);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      
      case 'get_activities': {
        const result = await client.getActivities(args as any);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      
      case 'get_activity': {
        const { id } = args as { id: number };
        const result = await client.getActivity(id);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      
      case 'get_notes': {
        const result = await client.getNotes(args as any);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      
      case 'get_note': {
        const { id } = args as { id: number };
        const result = await client.getNote(id);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      
      case 'search_items': {
        const { term, ...params } = args as any;
        const result = await client.searchItems(term, params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      
      case 'get_users': {
        const result = await client.getUsers(args as any);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      
      case 'get_user': {
        const { id } = args as { id: number };
        const result = await client.getUser(id);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      
      case 'get_current_user': {
        const result = await client.getCurrentUser();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      
      // Optimized tools for token management
      case 'get_deals_summary': {
        const result = await client.getDealsOptimized(args as any);
        const optimized = optimizeResponse(result, 'deals', { maxItems: 20, summarizeItems: true });
        return { content: [{ type: 'text', text: JSON.stringify(optimized, null, 2) }] };
      }
      
      case 'get_persons_summary': {
        const result = await client.getPersonsOptimized(args as any);
        const optimized = optimizeResponse(result, 'persons', { maxItems: 20, summarizeItems: true });
        return { content: [{ type: 'text', text: JSON.stringify(optimized, null, 2) }] };
      }
      
      case 'get_organizations_summary': {
        const result = await client.getOrganizationsOptimized(args as any);
        const optimized = optimizeResponse(result, 'organizations', { maxItems: 20, summarizeItems: true });
        return { content: [{ type: 'text', text: JSON.stringify(optimized, null, 2) }] };
      }
      
      case 'get_activities_summary': {
        const result = await client.getActivitiesOptimized(args as any);
        const optimized = optimizeResponse(result, 'activities', { maxItems: 20, summarizeItems: true });
        return { content: [{ type: 'text', text: JSON.stringify(optimized, null, 2) }] };
      }
      
      case 'get_overview': {
        const result = await client.getOverview(args as any);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      
      case 'search_summarized': {
        const { term, ...params } = args as any;
        const result = await client.searchItemsOptimized(term, params);
        const optimized = optimizeResponse(result, 'deals', { maxItems: 10, summarizeItems: true });
        return { content: [{ type: 'text', text: JSON.stringify(optimized, null, 2) }] };
      }
      
      // Quarterly tools with date context
      case 'get_current_quarter_deals': {
        const result = await client.getCurrentQuarterDeals(args as any);
        const withContext = addDateContextToResponse(result);
        return { content: [{ type: 'text', text: JSON.stringify(withContext, null, 2) }] };
      }
      
      case 'get_quarter_summary': {
        const { quarter = 'current', year, user_id } = args as any;
        const result = await client.getQuarterSummary(quarter, year, user_id);
        const withContext = addDateContextToResponse(result);
        return { content: [{ type: 'text', text: JSON.stringify(withContext, null, 2) }] };
      }
      
      case 'get_quarterly_progress': {
        // This is an alias for get_quarter_summary with current quarter
        const user_id = args?.user_id ? Number(args.user_id) : undefined;
        const result = await client.getQuarterSummary('current', undefined, user_id);
        const withContext = addDateContextToResponse(result);
        return { content: [{ type: 'text', text: JSON.stringify(withContext, null, 2) }] };
      }
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
    };
  }
});

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return { prompts };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case 'list_all_deals':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'List all deals with their current status, value, and associated contacts',
            },
          },
        ],
      };
      
    case 'search_person':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Search for a person named "${args?.name || ''}" and show their contact information and associated deals`,
            },
          },
        ],
      };
      
    case 'get_organization_deals':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Get all deals associated with organization ID ${args?.org_id || ''} including their status and value`,
            },
          },
        ],
      };
      
    case 'pipeline_overview':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'Provide an overview of all pipelines and their stages, including deal counts per stage',
            },
          },
        ],
      };
      
    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Pipedrive MCP server running');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});