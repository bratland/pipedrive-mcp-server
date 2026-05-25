#!/usr/bin/env node

import { PipedriveClient } from './pipedrive-client.js';
import { getCurrentDateContext } from './utils/date-context.js';
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

// --- Generic route table ---
// Maps "command subcommand" to { method, path, idParam?, bodyKeys? }
// path supports :id placeholder replaced by positional arg or --id

interface Route {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  idParam?: string; // name of the ID param in the path (default: 'id')
  idType?: 'string'; // if set, ID is kept as string (UUID leads etc.)
  requireId?: boolean; // if true, positional arg or --id is required
  requireTerm?: boolean; // if true, --term or positional is required
  searchParam?: string; // query param name for search term
  bodyFromArgs?: boolean; // if true, remaining --args become POST/PUT body
  paginatable?: boolean; // if true, inject start/limit from opts
  subResourceId?: string; // second ID in path, e.g. /deals/:id/followers/:follower_id
}

const ROUTES: Record<string, Record<string, Route>> = {
  // === Deals ===
  deals: {
    list:         { method: 'GET', path: '/deals', paginatable: true },
    get:          { method: 'GET', path: '/deals/:id', requireId: true },
    create:       { method: 'POST', path: '/deals', bodyFromArgs: true },
    update:       { method: 'PUT', path: '/deals/:id', requireId: true, bodyFromArgs: true },
    delete:       { method: 'DELETE', path: '/deals/:id', requireId: true },
    search:       { method: 'GET', path: '/deals/search', requireTerm: true, searchParam: 'term', paginatable: true },
    merge:        { method: 'PUT', path: '/deals/:id/merge', requireId: true, bodyFromArgs: true },
    duplicate:    { method: 'POST', path: '/deals/:id/duplicate', requireId: true },
    followers:    { method: 'GET', path: '/deals/:id/followers', requireId: true },
    participants: { method: 'GET', path: '/deals/:id/participants', requireId: true, paginatable: true },
    products:     { method: 'GET', path: '/deals/:id/products', requireId: true, paginatable: true },
    activities:   { method: 'GET', path: '/deals/:id/activities', requireId: true, paginatable: true },
    flow:         { method: 'GET', path: '/deals/:id/flow', requireId: true, paginatable: true },
    files:        { method: 'GET', path: '/deals/:id/files', requireId: true, paginatable: true },
    mail:         { method: 'GET', path: '/deals/:id/mailMessages', requireId: true, paginatable: true },
    // quarter is handled specially below
  },

  // === Persons ===
  persons: {
    list:       { method: 'GET', path: '/persons', paginatable: true },
    get:        { method: 'GET', path: '/persons/:id', requireId: true },
    create:     { method: 'POST', path: '/persons', bodyFromArgs: true },
    update:     { method: 'PUT', path: '/persons/:id', requireId: true, bodyFromArgs: true },
    delete:     { method: 'DELETE', path: '/persons/:id', requireId: true },
    search:     { method: 'GET', path: '/persons/search', requireTerm: true, searchParam: 'term', paginatable: true },
    merge:      { method: 'PUT', path: '/persons/:id/merge', requireId: true, bodyFromArgs: true },
    deals:      { method: 'GET', path: '/persons/:id/deals', requireId: true, paginatable: true },
    activities: { method: 'GET', path: '/persons/:id/activities', requireId: true, paginatable: true },
    flow:       { method: 'GET', path: '/persons/:id/flow', requireId: true, paginatable: true },
    files:      { method: 'GET', path: '/persons/:id/files', requireId: true, paginatable: true },
    followers:  { method: 'GET', path: '/persons/:id/followers', requireId: true },
  },

  // === Organizations ===
  orgs: {
    list:       { method: 'GET', path: '/organizations', paginatable: true },
    get:        { method: 'GET', path: '/organizations/:id', requireId: true },
    create:     { method: 'POST', path: '/organizations', bodyFromArgs: true },
    update:     { method: 'PUT', path: '/organizations/:id', requireId: true, bodyFromArgs: true },
    delete:     { method: 'DELETE', path: '/organizations/:id', requireId: true },
    search:     { method: 'GET', path: '/organizations/search', requireTerm: true, searchParam: 'term', paginatable: true },
    merge:      { method: 'PUT', path: '/organizations/:id/merge', requireId: true, bodyFromArgs: true },
    deals:      { method: 'GET', path: '/organizations/:id/deals', requireId: true, paginatable: true },
    persons:    { method: 'GET', path: '/organizations/:id/persons', requireId: true, paginatable: true },
    activities: { method: 'GET', path: '/organizations/:id/activities', requireId: true, paginatable: true },
    flow:       { method: 'GET', path: '/organizations/:id/flow', requireId: true, paginatable: true },
    files:      { method: 'GET', path: '/organizations/:id/files', requireId: true, paginatable: true },
    followers:  { method: 'GET', path: '/organizations/:id/followers', requireId: true },
  },

  // === Activities ===
  activities: {
    list:   { method: 'GET', path: '/activities', paginatable: true },
    get:    { method: 'GET', path: '/activities/:id', requireId: true },
    create: { method: 'POST', path: '/activities', bodyFromArgs: true },
    update: { method: 'PUT', path: '/activities/:id', requireId: true, bodyFromArgs: true },
    delete: { method: 'DELETE', path: '/activities/:id', requireId: true },
  },

  // === Activity Types ===
  'activity-types': {
    list:   { method: 'GET', path: '/activityTypes' },
    create: { method: 'POST', path: '/activityTypes', bodyFromArgs: true },
    update: { method: 'PUT', path: '/activityTypes/:id', requireId: true, bodyFromArgs: true },
    delete: { method: 'DELETE', path: '/activityTypes/:id', requireId: true },
  },

  // === Notes ===
  notes: {
    list:   { method: 'GET', path: '/notes', paginatable: true },
    get:    { method: 'GET', path: '/notes/:id', requireId: true },
    create: { method: 'POST', path: '/notes', bodyFromArgs: true },
    update: { method: 'PUT', path: '/notes/:id', requireId: true, bodyFromArgs: true },
    delete: { method: 'DELETE', path: '/notes/:id', requireId: true },
  },

  // === Leads ===
  leads: {
    list:   { method: 'GET', path: '/leads', paginatable: true },
    get:    { method: 'GET', path: '/leads/:id', requireId: true, idType: 'string' },
    create: { method: 'POST', path: '/leads', bodyFromArgs: true },
    update: { method: 'PATCH', path: '/leads/:id', requireId: true, idType: 'string', bodyFromArgs: true },
    delete: { method: 'DELETE', path: '/leads/:id', requireId: true, idType: 'string' },
    search: { method: 'GET', path: '/leads/search', requireTerm: true, searchParam: 'term', paginatable: true },
  },

  // === Lead Labels ===
  'lead-labels': {
    list:   { method: 'GET', path: '/leadLabels' },
    create: { method: 'POST', path: '/leadLabels', bodyFromArgs: true },
    update: { method: 'PATCH', path: '/leadLabels/:id', requireId: true, idType: 'string', bodyFromArgs: true },
    delete: { method: 'DELETE', path: '/leadLabels/:id', requireId: true, idType: 'string' },
  },

  // === Products ===
  products: {
    list:      { method: 'GET', path: '/products', paginatable: true },
    get:       { method: 'GET', path: '/products/:id', requireId: true },
    create:    { method: 'POST', path: '/products', bodyFromArgs: true },
    update:    { method: 'PUT', path: '/products/:id', requireId: true, bodyFromArgs: true },
    delete:    { method: 'DELETE', path: '/products/:id', requireId: true },
    search:    { method: 'GET', path: '/products/search', requireTerm: true, searchParam: 'term', paginatable: true },
    deals:     { method: 'GET', path: '/products/:id/deals', requireId: true, paginatable: true },
    files:     { method: 'GET', path: '/products/:id/files', requireId: true, paginatable: true },
    followers: { method: 'GET', path: '/products/:id/followers', requireId: true },
  },

  // === Pipelines ===
  pipelines: {
    list:                 { method: 'GET', path: '/pipelines' },
    get:                  { method: 'GET', path: '/pipelines/:id', requireId: true },
    create:               { method: 'POST', path: '/pipelines', bodyFromArgs: true },
    update:               { method: 'PUT', path: '/pipelines/:id', requireId: true, bodyFromArgs: true },
    delete:               { method: 'DELETE', path: '/pipelines/:id', requireId: true },
    deals:                { method: 'GET', path: '/pipelines/:id/deals', requireId: true, paginatable: true },
    'movement-stats':     { method: 'GET', path: '/pipelines/:id/movement_statistics', requireId: true },
    'conversion-stats':   { method: 'GET', path: '/pipelines/:id/conversion_statistics', requireId: true },
  },

  // === Stages ===
  stages: {
    list:   { method: 'GET', path: '/stages', paginatable: true },
    get:    { method: 'GET', path: '/stages/:id', requireId: true },
    create: { method: 'POST', path: '/stages', bodyFromArgs: true },
    update: { method: 'PUT', path: '/stages/:id', requireId: true, bodyFromArgs: true },
    delete: { method: 'DELETE', path: '/stages/:id', requireId: true },
    deals:  { method: 'GET', path: '/stages/:id/deals', requireId: true, paginatable: true },
  },

  // === Users ===
  users: {
    list:        { method: 'GET', path: '/users', paginatable: true },
    get:         { method: 'GET', path: '/users/:id', requireId: true },
    me:          { method: 'GET', path: '/users/me' },
    permissions: { method: 'GET', path: '/users/:id/permissions', requireId: true },
    roles:       { method: 'GET', path: '/users/:id/roleAssignments', requireId: true },
    settings:    { method: 'GET', path: '/users/:id/roleSettings', requireId: true },
  },

  // === Goals ===
  goals: {
    list:    { method: 'GET', path: '/goals/find' },
    get:     { method: 'GET', path: '/goals/:id/results', requireId: true, idType: 'string' },
    create:  { method: 'POST', path: '/goals', bodyFromArgs: true },
    update:  { method: 'PUT', path: '/goals/:id', requireId: true, idType: 'string', bodyFromArgs: true },
    delete:  { method: 'DELETE', path: '/goals/:id', requireId: true, idType: 'string' },
  },

  // === Files ===
  files: {
    list:   { method: 'GET', path: '/files', paginatable: true },
    get:    { method: 'GET', path: '/files/:id', requireId: true },
    delete: { method: 'DELETE', path: '/files/:id', requireId: true },
  },

  // === Filters ===
  filters: {
    list:   { method: 'GET', path: '/filters' },
    get:    { method: 'GET', path: '/filters/:id', requireId: true },
    create: { method: 'POST', path: '/filters', bodyFromArgs: true },
    update: { method: 'PUT', path: '/filters/:id', requireId: true, bodyFromArgs: true },
    delete: { method: 'DELETE', path: '/filters/:id', requireId: true },
  },

  // === Webhooks ===
  webhooks: {
    list:   { method: 'GET', path: '/webhooks' },
    create: { method: 'POST', path: '/webhooks', bodyFromArgs: true },
    delete: { method: 'DELETE', path: '/webhooks/:id', requireId: true },
  },

  // === Custom Fields ===
  'deal-fields': {
    list:   { method: 'GET', path: '/dealFields', paginatable: true },
    get:    { method: 'GET', path: '/dealFields/:id', requireId: true },
    create: { method: 'POST', path: '/dealFields', bodyFromArgs: true },
    update: { method: 'PUT', path: '/dealFields/:id', requireId: true, bodyFromArgs: true },
    delete: { method: 'DELETE', path: '/dealFields/:id', requireId: true },
  },
  'person-fields': {
    list:   { method: 'GET', path: '/personFields', paginatable: true },
    get:    { method: 'GET', path: '/personFields/:id', requireId: true },
    create: { method: 'POST', path: '/personFields', bodyFromArgs: true },
    update: { method: 'PUT', path: '/personFields/:id', requireId: true, bodyFromArgs: true },
    delete: { method: 'DELETE', path: '/personFields/:id', requireId: true },
  },
  'org-fields': {
    list:   { method: 'GET', path: '/organizationFields', paginatable: true },
    get:    { method: 'GET', path: '/organizationFields/:id', requireId: true },
    create: { method: 'POST', path: '/organizationFields', bodyFromArgs: true },
    update: { method: 'PUT', path: '/organizationFields/:id', requireId: true, bodyFromArgs: true },
    delete: { method: 'DELETE', path: '/organizationFields/:id', requireId: true },
  },
  'product-fields': {
    list:   { method: 'GET', path: '/productFields', paginatable: true },
    get:    { method: 'GET', path: '/productFields/:id', requireId: true },
    create: { method: 'POST', path: '/productFields', bodyFromArgs: true },
    update: { method: 'PUT', path: '/productFields/:id', requireId: true, bodyFromArgs: true },
    delete: { method: 'DELETE', path: '/productFields/:id', requireId: true },
  },

  // === Currencies ===
  currencies: {
    list: { method: 'GET', path: '/currencies' },
  },

  // === Roles ===
  roles: {
    list:        { method: 'GET', path: '/roles', paginatable: true },
    get:         { method: 'GET', path: '/roles/:id', requireId: true },
    create:      { method: 'POST', path: '/roles', bodyFromArgs: true },
    update:      { method: 'PUT', path: '/roles/:id', requireId: true, bodyFromArgs: true },
    delete:      { method: 'DELETE', path: '/roles/:id', requireId: true },
    assignments: { method: 'GET', path: '/roles/:id/assignments', requireId: true, paginatable: true },
    settings:    { method: 'GET', path: '/roles/:id/settings', requireId: true },
  },

  // === Teams ===
  teams: {
    list:   { method: 'GET', path: '/legacyTeams' },
    get:    { method: 'GET', path: '/legacyTeams/:id', requireId: true },
    create: { method: 'POST', path: '/legacyTeams', bodyFromArgs: true },
    update: { method: 'PUT', path: '/legacyTeams/:id', requireId: true, bodyFromArgs: true },
    users:  { method: 'GET', path: '/legacyTeams/:id/users', requireId: true },
  },

  // === Mail ===
  mail: {
    list:     { method: 'GET', path: '/mailbox/mailThreads', paginatable: true },
    get:      { method: 'GET', path: '/mailbox/mailThreads/:id', requireId: true },
    messages: { method: 'GET', path: '/mailbox/mailThreads/:id/mailMessages', requireId: true },
    update:   { method: 'PUT', path: '/mailbox/mailThreads/:id', requireId: true, bodyFromArgs: true },
    delete:   { method: 'DELETE', path: '/mailbox/mailThreads/:id', requireId: true },
    message:  { method: 'GET', path: '/mailbox/mailMessages/:id', requireId: true },
  },

  // === Subscriptions ===
  subscriptions: {
    get:      { method: 'GET', path: '/subscriptions/:id', requireId: true },
    'for-deal': { method: 'GET', path: '/subscriptions/find/:id', requireId: true },
    payments: { method: 'GET', path: '/subscriptions/:id/payments', requireId: true },
    cancel:   { method: 'DELETE', path: '/subscriptions/:id', requireId: true },
  },

  // === Call Logs ===
  'call-logs': {
    list:   { method: 'GET', path: '/callLogs', paginatable: true },
    get:    { method: 'GET', path: '/callLogs/:id', requireId: true, idType: 'string' },
    create: { method: 'POST', path: '/callLogs', bodyFromArgs: true },
    delete: { method: 'DELETE', path: '/callLogs/:id', requireId: true, idType: 'string' },
  },

  // === Recents ===
  recents: {
    list: { method: 'GET', path: '/recents', paginatable: true },
  },

  // === Search ===
  search: {
    items:    { method: 'GET', path: '/itemSearch', requireTerm: true, searchParam: 'term', paginatable: true },
    'by-field': { method: 'GET', path: '/itemSearch/field', requireTerm: true, searchParam: 'term', paginatable: true },
  },
};

// Aliases
ROUTES['contacts'] = ROUTES['persons'];
ROUTES['organizations'] = ROUTES['orgs'];

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
