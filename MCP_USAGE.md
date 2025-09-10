# MCP Endpoint Usage Guide

The Pipedrive MCP server provides a single `/mcp` endpoint that handles all MCP protocol requests.

## Endpoint

**URL**: `POST /mcp`
**Content-Type**: `application/json`

## Request Format

All requests should follow the JSON-RPC style format:

```json
{
  "method": "method_name",
  "params": {
    // method-specific parameters
  }
}
```

## Available Methods

### 1. List Tools

Get all available tools:

```bash
curl -X POST https://your-service-url/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}'
```

### 2. List Prompts

Get all available prompts:

```bash
curl -X POST https://your-service-url/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "prompts/list"}'
```

### 3. Get Prompt

Get a specific prompt:

```bash
curl -X POST https://your-service-url/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "prompts/get",
    "params": {
      "name": "list_all_deals"
    }
  }'
```

### 4. Call Tools

Execute tool functions:

#### Get Deals
```bash
curl -X POST https://your-service-url/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "get_deals",
      "arguments": {
        "limit": 10,
        "status": "open"
      }
    }
  }'
```

#### Search Persons
```bash
curl -X POST https://your-service-url/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "search_persons",
      "arguments": {
        "term": "John Smith"
      }
    }
  }'
```

#### Get Pipelines
```bash
curl -X POST https://your-service-url/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "get_pipelines"
    }
  }'
```

## Response Format

### Success Response
```json
{
  "result": {
    // method-specific result data
  }
}
```

### Error Response
```json
{
  "error": {
    "code": -32600,
    "message": "Invalid Request",
    "data": "Additional error details"
  }
}
```

## Error Codes

- `-32600`: Invalid Request
- `-32601`: Method not found
- `-32602`: Invalid params
- `-32603`: Internal error

## Available Tools

1. **Deals**: `get_deals`, `get_deal`, `search_deals`
2. **Persons**: `get_persons`, `get_person`, `search_persons`
3. **Organizations**: `get_organizations`, `get_organization`, `search_organizations`
4. **Pipelines**: `get_pipelines`, `get_pipeline`
5. **Stages**: `get_stages`, `get_stage`
6. **Activities**: `get_activities`, `get_activity`
7. **Notes**: `get_notes`, `get_note`
8. **Search**: `search_items`

## Available Prompts

1. **list_all_deals**: List all deals with their details
2. **search_person**: Search for a person by name
3. **get_organization_deals**: Get all deals for a specific organization
4. **pipeline_overview**: Get overview of all pipelines and their stages

## Examples

### Complete Example: Search and Get Deal Details

```bash
# 1. Search for deals containing "software"
curl -X POST https://your-service-url/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "search_deals",
      "arguments": {
        "term": "software"
      }
    }
  }'

# 2. Get specific deal details (assuming deal ID 123)
curl -X POST https://your-service-url/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "get_deal",
      "arguments": {
        "id": 123
      }
    }
  }'
```

### Organization Workflow

```bash
# 1. Search for organizations
curl -X POST https://your-service-url/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "search_organizations",
      "arguments": {
        "term": "Acme Corp"
      }
    }
  }'

# 2. Get deals for the organization
curl -X POST https://your-service-url/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "get_deals",
      "arguments": {
        "org_id": 456
      }
    }
  }'
```

## Health Check

For basic connectivity testing:

```bash
curl https://your-service-url/health
```

## Authentication

The server requires a Pipedrive API token to be set as an environment variable. No additional authentication is needed for the MCP endpoint calls.