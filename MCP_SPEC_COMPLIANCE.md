# MCP Specification Compliance

This document confirms that the Pipedrive MCP server is fully compliant with the Model Context Protocol specification (2025-06-18).

## ✅ Specification Requirements Met

### 1. JSON-RPC 2.0 Format
- ✅ All messages include `"jsonrpc": "2.0"`
- ✅ All messages include proper `id` field for request/response correlation
- ✅ Proper error response format with standard error codes

### 2. Required Methods
- ✅ `initialize` - Server initialization handshake
- ✅ `tools/list` - Lists all available tools
- ✅ `tools/call` - Executes tool functions
- ✅ `prompts/list` - Lists available prompts
- ✅ `prompts/get` - Retrieves specific prompts

### 3. Protocol Flow
- ✅ Requires `initialize` before other operations
- ✅ Proper capability negotiation
- ✅ Server info exchange

### 4. Error Handling
- ✅ Standard JSON-RPC error codes:
  - `-32600` Invalid Request
  - `-32601` Method not found  
  - `-32602` Invalid params
  - `-32603` Internal error
  - `-32002` Server not initialized

### 5. Tool Execution Format
- ✅ Proper `content` array with `type` and `text`
- ✅ `isError` flag for execution status
- ✅ Structured tool parameter validation

## 🚀 Deployed Server

**URL**: `https://pipedrive-mcp-server-152020070805.europe-north1.run.app/mcp`
**Region**: europe-north1 (Finland - Nordic)
**Specification**: https://modelcontextprotocol.io/specification/2025-06-18

## 📋 Example Usage

### Initialization
```bash
curl -X POST https://pipedrive-mcp-server-152020070805.europe-north1.run.app/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize", 
    "params": {
      "protocolVersion": "2025-06-18",
      "capabilities": {}
    }
  }'
```

### List Tools
```bash
curl -X POST https://pipedrive-mcp-server-152020070805.europe-north1.run.app/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list"
  }'
```

### Execute Tool
```bash
curl -X POST https://pipedrive-mcp-server-152020070805.europe-north1.run.app/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "get_deals",
      "arguments": {
        "limit": 10
      }
    }
  }'
```

## 📊 Available Tools (18 total)

1. **Deals**: get_deals, get_deal, search_deals
2. **Persons**: get_persons, get_person, search_persons  
3. **Organizations**: get_organizations, get_organization, search_organizations
4. **Pipelines**: get_pipelines, get_pipeline
5. **Stages**: get_stages, get_stage
6. **Activities**: get_activities, get_activity
7. **Notes**: get_notes, get_note
8. **Search**: search_items

## 📝 Available Prompts (4 total)

1. **list_all_deals**: List all deals with their details
2. **search_person**: Search for a person by name
3. **get_organization_deals**: Get all deals for a specific organization
4. **pipeline_overview**: Get overview of all pipelines and their stages

## ✅ Validation Results

- ✅ **Initialize**: Server properly negotiates capabilities
- ✅ **Tools List**: Returns 18 properly formatted tools
- ✅ **Tool Execution**: Successfully calls Pipedrive API
- ✅ **Error Handling**: Proper JSON-RPC error responses
- ✅ **Protocol Version**: Supports specification 2025-06-18

The server is now fully compliant with the MCP specification and ready for production use!