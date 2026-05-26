#!/usr/bin/env node

import { PipedriveClient } from './pipedrive-client.js';
import { getCurrentDateContext } from './utils/date-context.js';
import { ROUTES, Route } from './routes.js';
import dotenv from 'dotenv';

dotenv.config();

// --- Types ---

interface CliOptions {
  compact: boolean;
  fields: string[];
  limit: number;
  start: number;
  raw: boolean;
}

interface CliResult {
  ok: boolean;
  data?: unknown;
  error?: string;
  meta?: Record<string, unknown>;
}

// --- Helpers ---

function fatal(msg: string, code = 1): never {
  const result: CliResult = { ok: false, error: msg };
  process.stderr.write(JSON.stringify(result) + '\n');
  process.exit(code);
}

function output(result: CliResult, opts: CliOptions): void {
  let data = result;

  if (opts.fields.length > 0 && result.data) {
    data = { ...result, data: pickFields(result.data, opts.fields) };
  }

  if (opts.compact) {
    data = JSON.parse(JSON.stringify(data, (_key, value) => {
      if (value === null || value === undefined) return undefined;
      if (value === '') return undefined;
      if (Array.isArray(value) && value.length === 0) return undefined;
      return value;
    }));
  }

  process.stdout.write(JSON.stringify(data, null, opts.raw ? 0 : 2) + '\n');
}

function pickFields(data: unknown, fields: string[]): unknown {
  if (Array.isArray(data)) {
    return data.map(item => pickFields(item, fields));
  }
  if (data && typeof data === 'object') {
    const picked: Record<string, unknown> = {};
    for (const field of fields) {
      if (field in (data as Record<string, unknown>)) {
        picked[field] = (data as Record<string, unknown>)[field];
      }
    }
    return picked;
  }
  return data;
}

function parseArgs(argv: string[]): { command: string; subcommand: string; positionals: string[]; args: Record<string, string>; opts: CliOptions } {
  const command = argv[0] || 'help';
  const singleCommands = new Set(['help', 'context', 'overview', '--help', '-h']);
  const isSingle = singleCommands.has(command);
  const subcommand = isSingle ? 'list' : (argv[1] || 'list');
  const args: Record<string, string> = {};
  const positionals: string[] = [];
  const opts: CliOptions = {
    compact: false,
    fields: [],
    limit: 20,
    start: 0,
    raw: false,
  };

  let i = isSingle ? 1 : 2;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === '--compact' || arg === '-c') {
      opts.compact = true;
    } else if (arg === '--raw' || arg === '-r') {
      opts.raw = true;
    } else if ((arg === '--fields' || arg === '-f') && argv[i + 1]) {
      opts.fields = argv[++i].split(',').map(f => f.trim());
    } else if ((arg === '--limit' || arg === '-l') && argv[i + 1]) {
      opts.limit = parseInt(argv[++i], 10);
    } else if ((arg === '--start' || arg === '-s') && argv[i + 1]) {
      opts.start = parseInt(argv[++i], 10);
    } else if (arg.startsWith('--') && argv[i + 1] && !argv[i + 1].startsWith('--')) {
      args[arg.slice(2)] = argv[++i];
    } else if (arg.startsWith('--')) {
      args[arg.slice(2)] = 'true';
    } else {
      positionals.push(arg);
    }
    i++;
  }

  return { command, subcommand, positionals, args, opts };
}

// --- Generic route executor ---

async function executeRoute(
  client: PipedriveClient,
  route: Route,
  positionals: string[],
  args: Record<string, string>,
  opts: CliOptions,
): Promise<CliResult> {
  let path = route.path;

  // Resolve :id in path
  if (path.includes(':id')) {
    const id = args.id || positionals[0];
    if (route.requireId && !id) {
      fatal(`Missing required ID. Usage: pipedrive <command> <subcommand> <id>`);
    }
    if (id) {
      path = path.replace(':id', id);
    }
  }

  // Build params/body from remaining args (exclude internal keys)
  const skipKeys = new Set(['id', 'token', 'full', '_positional']);
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(args)) {
    if (!skipKeys.has(k)) {
      params[k] = v;
    }
  }

  // Handle search term
  if (route.requireTerm) {
    const term = args.term || positionals[0];
    if (!term) fatal(`Missing required search term.`);
    if (route.searchParam) {
      params[route.searchParam] = term;
    }
  }

  // Inject pagination
  if (route.paginatable) {
    if (!params.start) params.start = String(opts.start);
    if (!params.limit) params.limit = String(opts.limit);
  }

  let result;
  switch (route.method) {
    case 'GET':
      result = await client.get(path, Object.keys(params).length > 0 ? params : undefined);
      break;
    case 'POST':
      result = await client.post(path, route.bodyFromArgs ? parseBody(params) : undefined);
      break;
    case 'PUT':
      result = await client.put(path, route.bodyFromArgs ? parseBody(params) : undefined);
      break;
    case 'PATCH':
      result = await client.patch(path, route.bodyFromArgs ? parseBody(params) : undefined);
      break;
    case 'DELETE':
      result = await client.deleteRequest(path);
      break;
  }

  if (!result.success) {
    return { ok: false, error: result.error || result.error_info };
  }

  const meta: Record<string, unknown> = {};
  if (result.additional_data?.pagination) {
    meta.total = result.additional_data.pagination.start + (Array.isArray(result.data) ? result.data.length : 1);
    meta.has_more = result.additional_data.pagination.more_items_in_collection;
  }

  return { ok: true, data: result.data, meta: Object.keys(meta).length > 0 ? meta : undefined };
}

function parseBody(params: Record<string, string>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    // Try to parse JSON values (for arrays, objects, booleans, numbers)
    if (v === 'true') { body[k] = true; continue; }
    if (v === 'false') { body[k] = false; continue; }
    const num = Number(v);
    if (!isNaN(num) && v.trim() !== '') { body[k] = num; continue; }
    if ((v.startsWith('[') || v.startsWith('{')) && v.length > 1) {
      try { body[k] = JSON.parse(v); continue; } catch { /* use as string */ }
    }
    body[k] = v;
  }
  return body;
}

// --- Special handlers ---

function handleContext(): CliResult {
  return { ok: true, data: getCurrentDateContext() };
}

async function handleOverview(client: PipedriveClient, args: Record<string, string>): Promise<CliResult> {
  const user_id = args.user_id || args.user ? Number(args.user_id || args.user) : undefined;
  const result = await client.getOverview({
    include_recent_deals: true,
    include_recent_activities: true,
    user_id,
  });
  if (!result.success) return { ok: false, error: result.error };
  return { ok: true, data: result.data };
}

async function handleDealQuarter(client: PipedriveClient, args: Record<string, string>, positionals: string[]): Promise<CliResult> {
  const quarter = (args.quarter || positionals[0] || 'current') as any;
  const year = args.year ? Number(args.year) : undefined;
  const user_id = args.user_id || args.user ? Number(args.user_id || args.user) : undefined;
  const result = await client.getQuarterSummary(quarter, year, user_id);
  if (!result.success) return { ok: false, error: result.error };
  return { ok: true, data: result.data };
}

// --- Help ---

function showHelp(): CliResult {
  const commandList: Record<string, string[]> = {};
  for (const [cmd, subs] of Object.entries(ROUTES)) {
    if (cmd === 'contacts' || cmd === 'organizations') continue; // aliases
    commandList[cmd] = Object.keys(subs);
  }

  return {
    ok: true,
    data: {
      name: 'pipedrive-cli',
      version: '2.0.0',
      description: 'Pipedrive CLI optimized for AI agents. JSON output, compact mode, field selection.',
      usage: 'pipedrive <command> <subcommand> [<id>] [--key value ...] [options]',
      commands: commandList,
      special_commands: {
        'deals quarter':    'Quarter summary [--quarter Q1-Q4|current] [--year]',
        'search items <q>': 'Search across all entities [--item_types deal,person,organization]',
        'overview':         'CRM overview (recent deals + activities) [--user <id>]',
        'context':          'Current date/quarter context',
        'help':             'Show this help',
      },
      global_options: {
        '--compact, -c':  'Strip null/empty fields (saves tokens)',
        '--fields, -f':   'Comma-separated field list (e.g. -f id,title,value)',
        '--limit, -l':    'Max items to return (default: 20)',
        '--start, -s':    'Pagination offset (default: 0)',
        '--raw, -r':      'Single-line JSON (no pretty-print)',
        '--full':         'Return all fields (skip summarization)',
        '--token':        'Pipedrive API token override',
      },
      write_operations: 'Use create/update/delete subcommands with --key value pairs. E.g: pipedrive deals create --title "New Deal" --value 5000',
      environment: {
        PIPEDRIVE_API_TOKEN: 'Required. Your Pipedrive API token.',
      },
      aliases: { contacts: 'persons', organizations: 'orgs' },
      examples: [
        'pipedrive deals list --status open -c -l 10',
        'pipedrive deals get 123 -f id,title,value,status',
        'pipedrive deals create --title "New Deal" --value 5000 --currency SEK',
        'pipedrive deals update 123 --status won',
        'pipedrive deals quarter --quarter Q2 --year 2026',
        'pipedrive persons search "John" --compact',
        'pipedrive orgs deals 42 --status open',
        'pipedrive leads list --archived_status not_archived',
        'pipedrive pipelines deals 1 --stage_id 3',
        'pipedrive stages deals 5 -l 50',
        'pipedrive search items "Acme" --item_types deal,organization',
        'pipedrive activities create --subject "Follow up" --type call --deal_id 123',
        'pipedrive notes create --content "Meeting notes..." --deal_id 123',
        'pipedrive users me -c',
        'pipedrive recents list --since_timestamp "2026-04-01 00:00:00"',
        'pipedrive deal-fields list -c',
        'pipedrive overview --user 5',
      ],
    },
  };
}

// --- Main ---

async function main(): Promise<void> {
  const rawArgs = process.argv.slice(2);
  const { command, subcommand, positionals, args, opts } = parseArgs(rawArgs);

  if (command === 'help' || command === '--help' || command === '-h') {
    output(showHelp(), opts);
    return;
  }

  if (command === 'context') {
    output(handleContext(), opts);
    return;
  }

  // Resolve API token
  let apiToken = args.token || process.env.PIPEDRIVE_API_TOKEN;
  if (!apiToken) {
    const userEnv = Object.keys(process.env).find(k => k.startsWith('MCP_USER_'));
    if (userEnv && process.env[userEnv]) {
      const parts = process.env[userEnv]!.split(':');
      apiToken = parts[1];
    }
  }
  if (!apiToken) {
    fatal('No API token found. Set PIPEDRIVE_API_TOKEN, use --token, or configure MCP_USER_* env vars.');
  }

  const client = new PipedriveClient({ apiToken });
  let result: CliResult;

  // Special handlers
  if (command === 'overview') {
    result = await handleOverview(client, args);
    output(result, opts);
    if (!result.ok) process.exit(1);
    return;
  }

  if (command === 'deals' && subcommand === 'quarter') {
    result = await handleDealQuarter(client, args, positionals);
    output(result, opts);
    if (!result.ok) process.exit(1);
    return;
  }

  // Route table lookup
  const commandRoutes = ROUTES[command];
  if (!commandRoutes) {
    const available = Object.keys(ROUTES).filter(k => k !== 'contacts' && k !== 'organizations').join(', ');
    fatal(`Unknown command: ${command}. Available: ${available}`);
  }

  // For "search" command, treat subcommand position as term if not a known sub
  let actualSub = subcommand;
  if (command === 'search' && !commandRoutes[subcommand]) {
    // "pipedrive search Acme" → treat "Acme" as term, default to "items"
    positionals.unshift(subcommand);
    actualSub = 'items';
  }

  const route = commandRoutes[actualSub];
  if (!route) {
    const subs = Object.keys(commandRoutes).join(', ');
    fatal(`Unknown subcommand: ${actualSub}. Available for ${command}: ${subs}`);
  }

  result = await executeRoute(client, route, positionals, args, opts);
  output(result, opts);
  if (!result.ok) process.exit(1);
}

main().catch((err) => {
  fatal(err.message || 'Unexpected error');
});
