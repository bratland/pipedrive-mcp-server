# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Pipedrive MCP (Model Context Protocol) server that provides integration with Pipedrive CRM API. The MCP server allows AI assistants to interact with Pipedrive data including deals, contacts, organizations, activities, and more.

## Development Commands

### Initial Setup
```bash
npm install
```

### Development
```bash
npm run dev        # Run with auto-reload for development
npm run build      # Build TypeScript to JavaScript
npm run start      # Run the compiled server
```

### CLI (AI Agent Optimized)
```bash
npm run cli -- <command> [subcommand] [options]   # Run CLI via npm
npx tsx src/cli.ts <command> [subcommand] [options] # Run directly
pipedrive <command> [subcommand] [options]          # After npm link
```

### Testing & Quality
```bash
npm test           # Run tests
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript type checking
```

## Architecture

### MCP Server Structure
- **src/index.ts** - Main MCP server entry point, handles tool registration and request routing
- **src/cli.ts** - CLI entry point optimized for AI agents (JSON output, compact mode, field selection)
- **src/pipedrive-client.ts** - Pipedrive API client wrapper with authentication and request handling
- **src/tools/** - Individual tool implementations for different Pipedrive resources
  - deals.ts - Deal management operations
  - persons.ts - Person/contact operations  
  - organizations.ts - Organization/company operations
  - activities.ts - Activity and task management
  - notes.ts - Note operations
  - search.ts - Search across entities
  - pipelines.ts - Pipeline and stage operations
  - users.ts - User/salesperson operations
  - optimized.ts - Token-optimized tool variants
  - quarterly.ts - Quarter-based analysis tools
- **src/utils/** - Shared utilities
  - token-optimizer.ts - Response summarization for token efficiency
  - date-context.ts - Date/quarter context helpers

### Key Design Patterns
1. **Tool-based Architecture**: Each Pipedrive resource type has its own tool module
2. **Error Handling**: Consistent error responses with Pipedrive API error details
3. **Authentication**: API key-based authentication passed via environment or config
4. **Pagination**: Handle Pipedrive's pagination for list operations
5. **Rate Limiting**: Respect Pipedrive API rate limits

## Pipedrive API Integration Notes

### Authentication
- Uses API token authentication (passed as `api_token` parameter)
- Token should be stored securely and never committed

### Common Operations Pattern
```typescript
// List resources with pagination
GET /api/v1/{resource}?api_token={token}&start={offset}&limit={limit}

// Get single resource
GET /api/v1/{resource}/{id}?api_token={token}

// Create resource
POST /api/v1/{resource}?api_token={token}

// Update resource  
PUT /api/v1/{resource}/{id}?api_token={token}

// Delete resource
DELETE /api/v1/{resource}/{id}?api_token={token}
```

### Important Pipedrive Concepts
- **Deals**: Sales opportunities with stages, values, and probabilities
- **Persons**: Individual contacts linked to deals and organizations
- **Organizations**: Companies that persons belong to
- **Activities**: Tasks, meetings, calls linked to deals/persons
- **Custom Fields**: Pipedrive allows custom fields on all major entities
- **Pipelines**: Deal workflows with multiple stages

## MCP Server Configuration

The server should be configured in Claude Desktop's config file:
```json
{
  "mcpServers": {
    "pipedrive": {
      "command": "node",
      "args": ["path/to/pipedrive-mcp/dist/index.js"],
      "env": {
        "PIPEDRIVE_API_TOKEN": "your_api_token_here"
      }
    }
  }
}
```

## CLI Usage (AI Agent Reference)

The CLI outputs structured JSON to stdout, errors to stderr. Designed for piping and programmatic use.

### Resources (28 commands, 159 subcommands)
```
deals           list|get|create|update|delete|search|merge|duplicate|followers|participants|products|activities|flow|files|mail|quarter
persons         list|get|create|update|delete|search|merge|deals|activities|flow|files|followers
orgs            list|get|create|update|delete|search|merge|deals|persons|activities|flow|files|followers
activities      list|get|create|update|delete
activity-types  list|create|update|delete
notes           list|get|create|update|delete
leads           list|get|create|update|delete|search
lead-labels     list|create|update|delete
products        list|get|create|update|delete|search|deals|files|followers
pipelines       list|get|create|update|delete|deals|movement-stats|conversion-stats
stages          list|get|create|update|delete|deals
users           list|get|me|permissions|roles|settings
goals           list|get|create|update|delete
files           list|get|delete
filters         list|get|create|update|delete
webhooks        list|create|delete
deal-fields     list|get|create|update|delete
person-fields   list|get|create|update|delete
org-fields      list|get|create|update|delete
product-fields  list|get|create|update|delete
currencies      list
roles           list|get|create|update|delete|assignments|settings
teams           list|get|create|update|users
mail            list|get|messages|update|delete|message
subscriptions   get|for-deal|payments|cancel
call-logs       list|get|create|delete
recents         list
search          items|by-field
```

### Usage Pattern
```bash
pipedrive <resource> <subcommand> [<id>] [--key value ...] [flags]
pipedrive deals list --status open -c -l 10
pipedrive deals get 123 -f id,title,value
pipedrive deals create --title "New Deal" --value 5000 --currency SEK
pipedrive deals update 123 --status won
pipedrive orgs deals 42 --status open
pipedrive search "Acme" --item_types deal,organization
pipedrive overview --user 5
pipedrive context
```

### Global Flags
- `--compact, -c` — Strip null/empty fields (saves tokens)
- `--fields, -f` — Comma-separated field list: `-f id,title,value`
- `--limit, -l` — Max items (default: 20)
- `--start, -s` — Pagination offset (default: 0)
- `--raw, -r` — Single-line JSON (no pretty-print)
- `--full` — Return all fields, skip summarization
- `--token` — Pipedrive API token override

### Authentication Resolution Order
1. `--token` flag
2. `PIPEDRIVE_API_TOKEN` environment variable
3. First `MCP_USER_*` environment variable (extracts Pipedrive token from `bearer:pipedrive_token:name:email` format)

### Output Format
```json
{"ok": true, "data": [...], "meta": {"total": 42, "has_more": true}}
{"ok": false, "error": "description"}
```

## Error Handling

- Always validate API token presence before making requests
- Return structured error responses with Pipedrive error details
- Handle rate limiting with appropriate retry logic
- Validate required fields based on Pipedrive's API requirements

## Type Safety

Use TypeScript interfaces for:
- Pipedrive API responses
- MCP tool inputs/outputs  
- Configuration objects
- Custom field definitions