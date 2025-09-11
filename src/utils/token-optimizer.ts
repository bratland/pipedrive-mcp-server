/**
 * Token optimizer utilities to reduce response sizes and prevent token limits
 */

export interface TokenLimits {
  maxTokensPerResponse: number;
  estimatedCharactersPerToken: number;
}

export const DEFAULT_LIMITS: TokenLimits = {
  maxTokensPerResponse: 150000, // Safe margin under 200k limit
  estimatedCharactersPerToken: 4, // Conservative estimate
};

/**
 * Estimate token count from text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / DEFAULT_LIMITS.estimatedCharactersPerToken);
}

/**
 * Summarize large arrays by showing sample items + count
 */
export function summarizeArray<T>(
  items: T[], 
  maxItems: number = 5,
  totalCount?: number
): {
  sample: T[];
  total_count: number;
  showing_first: number;
  truncated: boolean;
} {
  const actualCount = totalCount || items.length;
  return {
    sample: items.slice(0, maxItems),
    total_count: actualCount,
    showing_first: Math.min(maxItems, items.length),
    truncated: items.length > maxItems
  };
}

/**
 * Create essential summary of deal data
 */
export function summarizeDeal(deal: any): any {
  return {
    id: deal.id,
    title: deal.title,
    value: deal.value,
    currency: deal.currency,
    status: deal.status,
    stage_id: deal.stage_id,
    user_id: deal.user_id,
    person_id: deal.person_id,
    org_id: deal.org_id,
    add_time: deal.add_time,
    update_time: deal.update_time,
    // Remove heavy fields like custom fields, activities, etc.
  };
}

/**
 * Create essential summary of person data
 */
export function summarizePerson(person: any): any {
  return {
    id: person.id,
    name: person.name,
    first_name: person.first_name,
    last_name: person.last_name,
    org_id: person.org_id,
    org_name: person.org_name,
    email: person.email?.[0]?.value, // Just primary email
    phone: person.phone?.[0]?.value, // Just primary phone
    owner_id: person.owner_id,
    add_time: person.add_time,
    update_time: person.update_time,
  };
}

/**
 * Create essential summary of organization data
 */
export function summarizeOrganization(org: any): any {
  return {
    id: org.id,
    name: org.name,
    owner_id: org.owner_id,
    people_count: org.people_count,
    open_deals_count: org.open_deals_count,
    closed_deals_count: org.closed_deals_count,
    add_time: org.add_time,
    update_time: org.update_time,
  };
}

/**
 * Create essential summary of activity data
 */
export function summarizeActivity(activity: any): any {
  return {
    id: activity.id,
    type: activity.type,
    subject: activity.subject,
    done: activity.done,
    due_date: activity.due_date,
    user_id: activity.user_id,
    deal_id: activity.deal_id,
    person_id: activity.person_id,
    org_id: activity.org_id,
    add_time: activity.add_time,
  };
}

/**
 * Create essential summary of user data
 */
export function summarizeUser(user: any): any {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    active_flag: user.active_flag,
    is_admin: user.is_admin,
    role_id: user.role_id,
    timezone_name: user.timezone_name,
    company_id: user.company_id,
    last_login: user.last_login,
  };
}

/**
 * Process API response to optimize for token usage
 */
export function optimizeResponse(
  data: any, 
  type: 'deals' | 'persons' | 'organizations' | 'activities' | 'users' | 'notes',
  options: {
    maxItems?: number;
    summarizeItems?: boolean;
    includeMetadata?: boolean;
  } = {}
): any {
  const { maxItems = 10, summarizeItems = true, includeMetadata = true } = options;
  
  if (!data || !data.success) {
    return data;
  }

  let items = Array.isArray(data.data) ? data.data : [data.data];
  let summarizedItems = items;

  // Apply item-specific summarization
  if (summarizeItems && items.length > 0) {
    switch (type) {
      case 'deals':
        summarizedItems = items.map(summarizeDeal);
        break;
      case 'persons':
        summarizedItems = items.map(summarizePerson);
        break;
      case 'organizations':
        summarizedItems = items.map(summarizeOrganization);
        break;
      case 'activities':
        summarizedItems = items.map(summarizeActivity);
        break;
      case 'users':
        summarizedItems = items.map(summarizeUser);
        break;
      case 'notes':
        // Keep notes mostly intact as they're usually important
        summarizedItems = items.map((note: any) => ({
          id: note.id,
          content: note.content?.substring(0, 500) + (note.content?.length > 500 ? '...' : ''), // Truncate long notes
          user_id: note.user_id,
          deal_id: note.deal_id,
          person_id: note.person_id,
          org_id: note.org_id,
          add_time: note.add_time,
        }));
        break;
    }
  }

  // Handle array truncation if too many items
  if (items.length > maxItems) {
    const summary = summarizeArray(summarizedItems, maxItems, items.length);
    
    return {
      success: true,
      data: summary.sample,
      meta: {
        total_count: summary.total_count,
        showing_first: summary.showing_first,
        truncated: summary.truncated,
        optimization_applied: true,
        optimization_reason: `Showing first ${maxItems} items to stay within token limits`,
        full_data_available: true,
      },
      additional_data: includeMetadata ? data.additional_data : undefined,
    };
  }

  // Return optimized but not truncated data
  return {
    success: true,
    data: Array.isArray(data.data) ? summarizedItems : summarizedItems[0],
    meta: {
      total_count: items.length,
      optimization_applied: summarizeItems,
      optimization_reason: summarizeItems ? 'Removed heavy fields to reduce token usage' : undefined,
    },
    additional_data: includeMetadata ? data.additional_data : undefined,
  };
}

/**
 * Check if response would exceed token limits and suggest optimization
 */
export function checkTokenLimits(responseText: string): {
  estimatedTokens: number;
  exceedsLimit: boolean;
  suggestion?: string;
} {
  const estimated = estimateTokens(responseText);
  const exceedsLimit = estimated > DEFAULT_LIMITS.maxTokensPerResponse;
  
  return {
    estimatedTokens: estimated,
    exceedsLimit,
    suggestion: exceedsLimit 
      ? 'Consider using pagination (lower limit), summarization, or specific filters to reduce data size'
      : undefined
  };
}