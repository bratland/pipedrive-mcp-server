export interface Route {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  idParam?: string;
  idType?: 'string';
  requireId?: boolean;
  requireTerm?: boolean;
  searchParam?: string;
  bodyFromArgs?: boolean;
  paginatable?: boolean;
  subResourceId?: string;
}

export const ROUTES: Record<string, Record<string, Route>> = {
  deals: {
    list:               { method: 'GET', path: '/deals', paginatable: true },
    get:                { method: 'GET', path: '/deals/:id', requireId: true },
    create:             { method: 'POST', path: '/deals', bodyFromArgs: true },
    update:             { method: 'PUT', path: '/deals/:id', requireId: true, bodyFromArgs: true },
    delete:             { method: 'DELETE', path: '/deals/:id', requireId: true },
    search:             { method: 'GET', path: '/deals/search', requireTerm: true, searchParam: 'term', paginatable: true },
    merge:              { method: 'PUT', path: '/deals/:id/merge', requireId: true, bodyFromArgs: true },
    duplicate:          { method: 'POST', path: '/deals/:id/duplicate', requireId: true },
    followers:          { method: 'GET', path: '/deals/:id/followers', requireId: true },
    'add-follower':     { method: 'POST', path: '/deals/:id/followers', requireId: true, bodyFromArgs: true },
    'remove-follower':  { method: 'DELETE', path: '/deals/:id/followers/:sub_id', requireId: true, subResourceId: 'follower_id' },
    participants:       { method: 'GET', path: '/deals/:id/participants', requireId: true, paginatable: true },
    'add-participant':  { method: 'POST', path: '/deals/:id/participants', requireId: true, bodyFromArgs: true },
    'remove-participant': { method: 'DELETE', path: '/deals/:id/participants/:sub_id', requireId: true, subResourceId: 'deal_participant_id' },
    products:           { method: 'GET', path: '/deals/:id/products', requireId: true, paginatable: true },
    'add-product':      { method: 'POST', path: '/deals/:id/products', requireId: true, bodyFromArgs: true },
    'update-product':   { method: 'PUT', path: '/deals/:id/products/:sub_id', requireId: true, bodyFromArgs: true, subResourceId: 'deal_product_id' },
    'remove-product':   { method: 'DELETE', path: '/deals/:id/products/:sub_id', requireId: true, subResourceId: 'deal_product_id' },
    activities:         { method: 'GET', path: '/deals/:id/activities', requireId: true, paginatable: true },
    flow:               { method: 'GET', path: '/deals/:id/flow', requireId: true, paginatable: true },
    files:              { method: 'GET', path: '/deals/:id/files', requireId: true, paginatable: true },
    mail:               { method: 'GET', path: '/deals/:id/mailMessages', requireId: true, paginatable: true },
  },

  persons: {
    list:               { method: 'GET', path: '/persons', paginatable: true },
    get:                { method: 'GET', path: '/persons/:id', requireId: true },
    create:             { method: 'POST', path: '/persons', bodyFromArgs: true },
    update:             { method: 'PUT', path: '/persons/:id', requireId: true, bodyFromArgs: true },
    delete:             { method: 'DELETE', path: '/persons/:id', requireId: true },
    search:             { method: 'GET', path: '/persons/search', requireTerm: true, searchParam: 'term', paginatable: true },
    merge:              { method: 'PUT', path: '/persons/:id/merge', requireId: true, bodyFromArgs: true },
    deals:              { method: 'GET', path: '/persons/:id/deals', requireId: true, paginatable: true },
    activities:         { method: 'GET', path: '/persons/:id/activities', requireId: true, paginatable: true },
    flow:               { method: 'GET', path: '/persons/:id/flow', requireId: true, paginatable: true },
    files:              { method: 'GET', path: '/persons/:id/files', requireId: true, paginatable: true },
    followers:          { method: 'GET', path: '/persons/:id/followers', requireId: true },
    'add-follower':     { method: 'POST', path: '/persons/:id/followers', requireId: true, bodyFromArgs: true },
    'remove-follower':  { method: 'DELETE', path: '/persons/:id/followers/:sub_id', requireId: true, subResourceId: 'follower_id' },
  },

  orgs: {
    list:               { method: 'GET', path: '/organizations', paginatable: true },
    get:                { method: 'GET', path: '/organizations/:id', requireId: true },
    create:             { method: 'POST', path: '/organizations', bodyFromArgs: true },
    update:             { method: 'PUT', path: '/organizations/:id', requireId: true, bodyFromArgs: true },
    delete:             { method: 'DELETE', path: '/organizations/:id', requireId: true },
    search:             { method: 'GET', path: '/organizations/search', requireTerm: true, searchParam: 'term', paginatable: true },
    merge:              { method: 'PUT', path: '/organizations/:id/merge', requireId: true, bodyFromArgs: true },
    deals:              { method: 'GET', path: '/organizations/:id/deals', requireId: true, paginatable: true },
    persons:            { method: 'GET', path: '/organizations/:id/persons', requireId: true, paginatable: true },
    activities:         { method: 'GET', path: '/organizations/:id/activities', requireId: true, paginatable: true },
    flow:               { method: 'GET', path: '/organizations/:id/flow', requireId: true, paginatable: true },
    files:              { method: 'GET', path: '/organizations/:id/files', requireId: true, paginatable: true },
    followers:          { method: 'GET', path: '/organizations/:id/followers', requireId: true },
    'add-follower':     { method: 'POST', path: '/organizations/:id/followers', requireId: true, bodyFromArgs: true },
    'remove-follower':  { method: 'DELETE', path: '/organizations/:id/followers/:sub_id', requireId: true, subResourceId: 'follower_id' },
  },

  activities: {
    list:   { method: 'GET', path: '/activities', paginatable: true },
    get:    { method: 'GET', path: '/activities/:id', requireId: true },
    create: { method: 'POST', path: '/activities', bodyFromArgs: true },
    update: { method: 'PUT', path: '/activities/:id', requireId: true, bodyFromArgs: true },
    delete: { method: 'DELETE', path: '/activities/:id', requireId: true },
  },

  'activity-types': {
    list:   { method: 'GET', path: '/activityTypes' },
    create: { method: 'POST', path: '/activityTypes', bodyFromArgs: true },
    update: { method: 'PUT', path: '/activityTypes/:id', requireId: true, bodyFromArgs: true },
    delete: { method: 'DELETE', path: '/activityTypes/:id', requireId: true },
  },

  notes: {
    list:   { method: 'GET', path: '/notes', paginatable: true },
    get:    { method: 'GET', path: '/notes/:id', requireId: true },
    create: { method: 'POST', path: '/notes', bodyFromArgs: true },
    update: { method: 'PUT', path: '/notes/:id', requireId: true, bodyFromArgs: true },
    delete: { method: 'DELETE', path: '/notes/:id', requireId: true },
  },

  leads: {
    list:   { method: 'GET', path: '/leads', paginatable: true },
    get:    { method: 'GET', path: '/leads/:id', requireId: true, idType: 'string' },
    create: { method: 'POST', path: '/leads', bodyFromArgs: true },
    update: { method: 'PATCH', path: '/leads/:id', requireId: true, idType: 'string', bodyFromArgs: true },
    delete: { method: 'DELETE', path: '/leads/:id', requireId: true, idType: 'string' },
    search: { method: 'GET', path: '/leads/search', requireTerm: true, searchParam: 'term', paginatable: true },
  },

  'lead-labels': {
    list:   { method: 'GET', path: '/leadLabels' },
    create: { method: 'POST', path: '/leadLabels', bodyFromArgs: true },
    update: { method: 'PATCH', path: '/leadLabels/:id', requireId: true, idType: 'string', bodyFromArgs: true },
    delete: { method: 'DELETE', path: '/leadLabels/:id', requireId: true, idType: 'string' },
  },

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

  pipelines: {
    list:               { method: 'GET', path: '/pipelines' },
    get:                { method: 'GET', path: '/pipelines/:id', requireId: true },
    create:             { method: 'POST', path: '/pipelines', bodyFromArgs: true },
    update:             { method: 'PUT', path: '/pipelines/:id', requireId: true, bodyFromArgs: true },
    delete:             { method: 'DELETE', path: '/pipelines/:id', requireId: true },
    deals:              { method: 'GET', path: '/pipelines/:id/deals', requireId: true, paginatable: true },
    'movement-stats':   { method: 'GET', path: '/pipelines/:id/movement_statistics', requireId: true },
    'conversion-stats': { method: 'GET', path: '/pipelines/:id/conversion_statistics', requireId: true },
  },

  stages: {
    list:   { method: 'GET', path: '/stages', paginatable: true },
    get:    { method: 'GET', path: '/stages/:id', requireId: true },
    create: { method: 'POST', path: '/stages', bodyFromArgs: true },
    update: { method: 'PUT', path: '/stages/:id', requireId: true, bodyFromArgs: true },
    delete: { method: 'DELETE', path: '/stages/:id', requireId: true },
    deals:  { method: 'GET', path: '/stages/:id/deals', requireId: true, paginatable: true },
  },

  users: {
    list:        { method: 'GET', path: '/users', paginatable: true },
    get:         { method: 'GET', path: '/users/:id', requireId: true },
    me:          { method: 'GET', path: '/users/me' },
    permissions: { method: 'GET', path: '/users/:id/permissions', requireId: true },
    roles:       { method: 'GET', path: '/users/:id/roleAssignments', requireId: true },
    settings:    { method: 'GET', path: '/users/:id/roleSettings', requireId: true },
  },

  goals: {
    list:    { method: 'GET', path: '/goals/find' },
    get:     { method: 'GET', path: '/goals/:id/results', requireId: true, idType: 'string' },
    create:  { method: 'POST', path: '/goals', bodyFromArgs: true },
    update:  { method: 'PUT', path: '/goals/:id', requireId: true, idType: 'string', bodyFromArgs: true },
    delete:  { method: 'DELETE', path: '/goals/:id', requireId: true, idType: 'string' },
  },

  files: {
    list:   { method: 'GET', path: '/files', paginatable: true },
    get:    { method: 'GET', path: '/files/:id', requireId: true },
    delete: { method: 'DELETE', path: '/files/:id', requireId: true },
    'create-remote': { method: 'POST', path: '/files/remote', bodyFromArgs: true },
    'link-remote':   { method: 'POST', path: '/files/remoteLink', bodyFromArgs: true },
  },

  filters: {
    list:   { method: 'GET', path: '/filters' },
    get:    { method: 'GET', path: '/filters/:id', requireId: true },
    create: { method: 'POST', path: '/filters', bodyFromArgs: true },
    update: { method: 'PUT', path: '/filters/:id', requireId: true, bodyFromArgs: true },
    delete: { method: 'DELETE', path: '/filters/:id', requireId: true },
  },

  webhooks: {
    list:   { method: 'GET', path: '/webhooks' },
    create: { method: 'POST', path: '/webhooks', bodyFromArgs: true },
    delete: { method: 'DELETE', path: '/webhooks/:id', requireId: true },
  },

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

  currencies: {
    list: { method: 'GET', path: '/currencies' },
  },

  roles: {
    list:        { method: 'GET', path: '/roles', paginatable: true },
    get:         { method: 'GET', path: '/roles/:id', requireId: true },
    create:      { method: 'POST', path: '/roles', bodyFromArgs: true },
    update:      { method: 'PUT', path: '/roles/:id', requireId: true, bodyFromArgs: true },
    delete:      { method: 'DELETE', path: '/roles/:id', requireId: true },
    assignments: { method: 'GET', path: '/roles/:id/assignments', requireId: true, paginatable: true },
    settings:    { method: 'GET', path: '/roles/:id/settings', requireId: true },
  },

  teams: {
    list:          { method: 'GET', path: '/legacyTeams' },
    get:           { method: 'GET', path: '/legacyTeams/:id', requireId: true },
    create:        { method: 'POST', path: '/legacyTeams', bodyFromArgs: true },
    update:        { method: 'PUT', path: '/legacyTeams/:id', requireId: true, bodyFromArgs: true },
    users:         { method: 'GET', path: '/legacyTeams/:id/users', requireId: true },
    'add-user':    { method: 'POST', path: '/legacyTeams/:id/users', requireId: true, bodyFromArgs: true },
    'remove-user': { method: 'DELETE', path: '/legacyTeams/:id/users', requireId: true, bodyFromArgs: true },
  },

  mail: {
    list:     { method: 'GET', path: '/mailbox/mailThreads', paginatable: true },
    get:      { method: 'GET', path: '/mailbox/mailThreads/:id', requireId: true },
    messages: { method: 'GET', path: '/mailbox/mailThreads/:id/mailMessages', requireId: true },
    update:   { method: 'PUT', path: '/mailbox/mailThreads/:id', requireId: true, bodyFromArgs: true },
    delete:   { method: 'DELETE', path: '/mailbox/mailThreads/:id', requireId: true },
    message:  { method: 'GET', path: '/mailbox/mailMessages/:id', requireId: true },
  },

  subscriptions: {
    get:        { method: 'GET', path: '/subscriptions/:id', requireId: true },
    'for-deal': { method: 'GET', path: '/subscriptions/find/:id', requireId: true },
    payments:   { method: 'GET', path: '/subscriptions/:id/payments', requireId: true },
    cancel:     { method: 'DELETE', path: '/subscriptions/:id', requireId: true },
    'create-recurring':    { method: 'POST', path: '/subscriptions/recurring', bodyFromArgs: true },
    'update-recurring':    { method: 'PUT', path: '/subscriptions/recurring/:id', requireId: true, bodyFromArgs: true },
    'create-installment':  { method: 'POST', path: '/subscriptions/installment', bodyFromArgs: true },
    'update-installment':  { method: 'PUT', path: '/subscriptions/installment/:id', requireId: true, bodyFromArgs: true },
  },

  'call-logs': {
    list:   { method: 'GET', path: '/callLogs', paginatable: true },
    get:    { method: 'GET', path: '/callLogs/:id', requireId: true, idType: 'string' },
    create: { method: 'POST', path: '/callLogs', bodyFromArgs: true },
    delete: { method: 'DELETE', path: '/callLogs/:id', requireId: true, idType: 'string' },
  },

  recents: {
    list: { method: 'GET', path: '/recents', paginatable: true },
  },

  search: {
    items:      { method: 'GET', path: '/itemSearch', requireTerm: true, searchParam: 'term', paginatable: true },
    'by-field': { method: 'GET', path: '/itemSearch/field', requireTerm: true, searchParam: 'term', paginatable: true },
  },
};

ROUTES['contacts'] = ROUTES['persons'];
ROUTES['organizations'] = ROUTES['orgs'];

export function generateToolDescription(): string {
  const lines: string[] = [
    'Interact with Pipedrive CRM. Specify resource and action.',
    '',
    'RESOURCES AND ACTIONS:',
  ];

  for (const [resource, actions] of Object.entries(ROUTES)) {
    if (resource === 'contacts' || resource === 'organizations') continue;
    lines.push(`  ${resource}: ${Object.keys(actions).join(', ')}`);
  }

  lines.push('');
  lines.push('PATTERNS:');
  lines.push('  list: paginated array. Params: start, limit, status, filter_id, user_id, sort');
  lines.push('  get: requires id. Returns single item.');
  lines.push('  create: pass fields in params. See REQUIRED FIELDS below.');
  lines.push('  update: requires id + fields to change in params.');
  lines.push('  delete: requires id.');
  lines.push('  search: requires term in params. Params: term, limit, start');
  lines.push('  Sub-resources (followers, activities, files, flow): requires parent id.');
  lines.push('  add-*/remove-*: write sub-resources. Requires parent id + relevant params.');
  lines.push('');
  lines.push('REQUIRED FIELDS FOR CREATE:');
  lines.push('  deals: title. Optional: value, currency, person_id, org_id, pipeline_id, stage_id, status, expected_close_date, probability');
  lines.push('  persons: name. Optional: email, phone, org_id, owner_id, visible_to');
  lines.push('  orgs: name. Optional: owner_id, visible_to, address');
  lines.push('  activities: subject, type. Optional: due_date, due_time, duration, deal_id, person_id, org_id, note');
  lines.push('  notes: content + one of deal_id/person_id/org_id/lead_id');
  lines.push('  leads: title. Optional: person_id, organization_id, value, currency, expected_close_date');
  lines.push('  products: name. Optional: code, unit, tax, prices');
  lines.push('  pipelines: name. Optional: deal_probability, order_nr');
  lines.push('  stages: name, pipeline_id. Optional: deal_probability, order_nr');
  lines.push('  filters: name, conditions, type (deals/persons/orgs/products/activities)');
  lines.push('  webhooks: subscription_url, event_action, event_object');
  lines.push('');
  lines.push('ID TYPES: leads, lead-labels, goals, call-logs use string (UUID) IDs. All others use numeric IDs.');
  lines.push('ALIASES: contacts = persons, organizations = orgs');

  return lines.join('\n');
}
