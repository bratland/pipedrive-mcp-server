# Pipedrive MCP Server

A Model Context Protocol (MCP) server that connects to the Pipedrive API v2, exposing Pipedrive CRM data to LLM applications like Claude.

## Features

- **Read-only access** to Pipedrive data
- **Full entity support** including:
  - Deals
  - Persons (Contacts)
  - Organizations
  - Pipelines & Stages
  - Activities
  - Notes
- **Search capabilities** across all entity types
- **Custom fields support** - All fields including custom fields are exposed
- **Predefined prompts** for common operations

## Prerequisites

- Node.js (v16 or higher)
- A Pipedrive account with API access
- Pipedrive API token

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pipedrive-mcp-server.git
cd pipedrive-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

4. Add your Pipedrive API token to the `.env` file:
```
PIPEDRIVE_API_TOKEN=your_pipedrive_api_token_here
```

5. Build the project:
```bash
npm run build
```

## Getting Your Pipedrive API Token

1. Log in to your Pipedrive account
2. Go to Personal Settings → API
3. Copy your personal API token

## Usage

### Development Mode

Run the server with auto-reload for development:
```bash
npm run dev
```

### Production Mode

Build and run the compiled server:
```bash
npm run build
npm start
```

### Configuring with Claude Desktop

Add the following to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "pipedrive": {
      "command": "node",
      "args": ["/path/to/pipedrive-mcp-server/dist/index.js"],
      "env": {
        "PIPEDRIVE_API_TOKEN": "your_pipedrive_api_token_here"
      }
    }
  }
}
```

## Available Tools

### Deals
- `get_deals` - List deals with filtering options
- `get_deal` - Get a specific deal by ID
- `search_deals` - Search for deals by term

### Persons (Contacts)
- `get_persons` - List persons with filtering options
- `get_person` - Get a specific person by ID
- `search_persons` - Search for persons by name

### Organizations
- `get_organizations` - List organizations
- `get_organization` - Get a specific organization by ID
- `search_organizations` - Search for organizations

### Pipelines & Stages
- `get_pipelines` - List all pipelines
- `get_pipeline` - Get a specific pipeline
- `get_stages` - List pipeline stages
- `get_stage` - Get a specific stage

### Activities
- `get_activities` - List activities with filtering
- `get_activity` - Get a specific activity

### Notes
- `get_notes` - List notes with filtering
- `get_note` - Get a specific note

### Search
- `search_items` - Search across multiple item types

## Predefined Prompts

The server includes several predefined prompts for common operations:

- `list_all_deals` - List all deals with their details
- `search_person` - Search for a person by name
- `get_organization_deals` - Get all deals for a specific organization
- `pipeline_overview` - Get overview of all pipelines and their stages

## Development

### Commands

```bash
npm run dev        # Run with auto-reload for development
npm run build      # Build TypeScript to JavaScript
npm run start      # Run the compiled server
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript type checking
npm test           # Run tests (when implemented)
```

### Project Structure

```
pipedrive-mcp-server/
├── src/
│   ├── index.ts           # Main MCP server entry point
│   ├── pipedrive-client.ts # Pipedrive API client
│   └── tools/             # Individual tool implementations
│       ├── deals.ts
│       ├── persons.ts
│       ├── organizations.ts
│       ├── pipelines.ts
│       ├── activities.ts
│       ├── notes.ts
│       └── search.ts
├── dist/                  # Compiled JavaScript output
├── package.json
├── tsconfig.json
├── .eslintrc.json
└── .env.example
```

## API Rate Limits

The Pipedrive API has rate limits. The server handles API responses appropriately, but be mindful of:
- Default rate limit: 80 requests per 2 seconds
- Consider implementing caching for frequently accessed data
- Use pagination parameters to limit data transfer

## Error Handling

The server provides detailed error messages including:
- API authentication failures
- Network errors
- Invalid parameters
- Rate limit exceeded warnings

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
- Create an issue on GitHub
- Check Pipedrive API documentation: https://developers.pipedrive.com/docs/api/v1

## Acknowledgments

- Built for use with [Claude Desktop](https://claude.ai)
- Uses the [Model Context Protocol](https://modelcontextprotocol.io)
- Integrates with [Pipedrive CRM](https://www.pipedrive.com)