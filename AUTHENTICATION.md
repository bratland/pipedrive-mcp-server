# MCP Server Authentication

This document describes the multi-user authentication system for the Pipedrive MCP server.

## Overview

The authenticated MCP server allows multiple users to access their own Pipedrive data using individual API tokens. Each user gets a unique Bearer token that maps to their specific Pipedrive API token.

## Architecture

- **Bearer Token**: Each user has a unique Bearer token for authentication
- **Pipedrive API Token**: Maps 1:1 with Bearer token for Pipedrive API access
- **Rate Limiting**: 100 requests per minute per user
- **Admin Interface**: User management via admin API

## Environment Configuration

### User Configuration
Users are configured via environment variables:
```bash
MCP_USER_1=bearer_token_1:pipedrive_api_token_1:John Doe:john@example.com
MCP_USER_2=bearer_token_2:pipedrive_api_token_2:Jane Smith:jane@example.com
```

### Admin Configuration
```bash
MCP_ADMIN_TOKEN=your_secure_admin_token_here
```

## Authentication Flow

### 1. MCP Client Authentication
```bash
curl -X POST https://your-server/mcp \
  -H "Authorization: Bearer mcp_your_bearer_token_here" \
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

### 2. Error Responses
- **401 Unauthorized**: Missing or invalid Bearer token
- **429 Rate Limited**: Too many requests (100/minute limit)
- **403 Forbidden**: Admin endpoint without valid admin token

## Admin API

### Create User
```bash
curl -X POST https://your-server/admin/users \
  -H "Authorization: Bearer your_admin_token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com", 
    "pipedriveApiToken": "9316cc38f384f6122c92771b2ef7e823831b9bfa"
  }'
```

Response:
```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid-here",
    "bearerToken": "mcp_generated_token_here",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2025-09-10T06:30:00.000Z"
  }
}
```

### List Users
```bash
curl -X GET https://your-server/admin/users \
  -H "Authorization: Bearer your_admin_token"
```

Response:
```json
{
  "users": [
    {
      "id": "uuid-1",
      "bearerToken": "mcp_token_1",
      "pipedriveApiToken": "***9bfa",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2025-09-10T06:30:00.000Z",
      "lastUsed": "2025-09-10T08:15:00.000Z"
    }
  ],
  "stats": {
    "totalUsers": 1,
    "activeToday": 1,
    "averageAge": 0.5
  }
}
```

### Revoke User
```bash
curl -X DELETE https://your-server/admin/users/mcp_token_to_revoke \
  -H "Authorization: Bearer your_admin_token"
```

## Rate Limiting

Each authenticated user is limited to:
- **100 requests per minute**
- Rate limit headers included in responses:
  - `X-RateLimit-Limit: 100`
  - `X-RateLimit-Remaining: 95`
  - `X-RateLimit-Reset: 2025-09-10T08:31:00.000Z`

## Security Features

### Bearer Token Security
- Tokens generated using crypto.randomBytes(32)
- Format: `mcp_` + 64 character hex string
- Tokens are not stored in logs

### API Token Validation
- Validates Pipedrive API token format (40 character hex)
- API tokens masked in admin responses (shows only last 4 characters)

### Admin Security
- Separate admin token required for user management
- Admin endpoints protected by middleware
- No access to user data without proper admin token

## Deployment Configuration

### Environment Variables
```bash
# Admin token
MCP_ADMIN_TOKEN=your_secure_admin_token

# Users (format: bearer:pipedrive:name:email)
MCP_USER_JOHN=mcp_abc123:9316cc38f384f6122c92771b2ef7e823831b9bfa:John Doe:john@example.com
MCP_USER_JANE=mcp_def456:1234567890abcdef1234567890abcdef12345678:Jane Smith:jane@example.com

# Server config
PORT=8080
NODE_ENV=production
```

### Google Cloud Run
```bash
gcloud run services update pipedrive-mcp-server \
  --region europe-north1 \
  --set-env-vars "MCP_ADMIN_TOKEN=your_admin_token,MCP_USER_1=token:api:name:email"
```

## Usage Examples

### Initialize Session
```bash
curl -X POST https://your-server/mcp \
  -H "Authorization: Bearer mcp_your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {"protocolVersion": "2025-06-18", "capabilities": {}}
  }'
```

### Get User's Deals
```bash
curl -X POST https://your-server/mcp \
  -H "Authorization: Bearer mcp_your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "get_deals",
      "arguments": {"limit": 10}
    }
  }'
```

## Migration from Single-User

To migrate from the single-user version:

1. **Update Dockerfile**:
   ```dockerfile
   CMD ["node", "dist/mcp-auth-server.js"]
   ```

2. **Configure Environment**:
   ```bash
   MCP_ADMIN_TOKEN=your_admin_token
   MCP_USER_1=bearer_token:existing_pipedrive_token:User Name:user@email.com
   ```

3. **Update Clients**: Add `Authorization: Bearer <token>` header to all requests

## Monitoring

The health endpoint provides user statistics:
```bash
curl https://your-server/health
```

Response:
```json
{
  "status": "healthy",
  "service": "pipedrive-mcp-server", 
  "authenticated": true,
  "userStats": {
    "totalUsers": 5,
    "activeToday": 3,
    "averageAge": 2.5
  }
}
```

## Security Best Practices

1. **Use HTTPS** in production
2. **Rotate admin tokens** regularly
3. **Monitor rate limits** and unusual activity
4. **Revoke unused Bearer tokens**
5. **Use environment variables** for sensitive data
6. **Enable request logging** for audit trails