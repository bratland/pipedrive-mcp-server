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

### Testing & Quality
```bash
npm test           # Run tests
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript type checking
```

## Architecture

### MCP Server Structure
- **src/index.ts** - Main MCP server entry point, handles tool registration and request routing
- **src/pipedrive-client.ts** - Pipedrive API client wrapper with authentication and request handling
- **src/tools/** - Individual tool implementations for different Pipedrive resources
  - deals.ts - Deal management operations
  - contacts.ts - Person/contact operations  
  - organizations.ts - Organization/company operations
  - activities.ts - Activity and task management
  - notes.ts - Note operations
  - search.ts - Search across entities

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