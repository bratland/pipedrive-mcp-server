/**
 * Date context utilities for MCP server responses
 */

export interface DateContext {
  current_date: string;
  current_quarter: string;
  current_year: number;
  quarter_info: {
    q1: { start: string; end: string; };
    q2: { start: string; end: string; };
    q3: { start: string; end: string; };
    q4: { start: string; end: string; };
  };
  current_quarter_dates: {
    start: string;
    end: string;
  };
}

/**
 * Get current date context information
 */
export function getCurrentDateContext(): DateContext {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // JavaScript months are 0-indexed
  
  // Determine current quarter
  let currentQuarter: string;
  if (month >= 1 && month <= 3) {
    currentQuarter = 'Q1';
  } else if (month >= 4 && month <= 6) {
    currentQuarter = 'Q2';
  } else if (month >= 7 && month <= 9) {
    currentQuarter = 'Q3';
  } else {
    currentQuarter = 'Q4';
  }

  // Define quarter boundaries for current year
  const quarterInfo = {
    q1: { start: `${year}-01-01`, end: `${year}-03-31` },
    q2: { start: `${year}-04-01`, end: `${year}-06-30` },
    q3: { start: `${year}-07-01`, end: `${year}-09-30` },
    q4: { start: `${year}-10-01`, end: `${year}-12-31` },
  };

  // Get current quarter dates
  const currentQuarterKey = currentQuarter.toLowerCase() as 'q1' | 'q2' | 'q3' | 'q4';
  const currentQuarterDates = quarterInfo[currentQuarterKey];

  return {
    current_date: now.toISOString().split('T')[0], // YYYY-MM-DD format
    current_quarter: `${currentQuarter} ${year}`,
    current_year: year,
    quarter_info: quarterInfo,
    current_quarter_dates: currentQuarterDates,
  };
}

/**
 * Add date context to any MCP response
 */
export function addDateContextToResponse(response: any): any {
  const dateContext = getCurrentDateContext();
  
  if (response.additional_data) {
    response.additional_data.date_context = dateContext;
  } else {
    response.additional_data = {
      date_context: dateContext
    };
  }
  
  return response;
}

/**
 * Get date range filter for current quarter
 */
export function getCurrentQuarterDateRange(): { start_date: string; end_date: string } {
  const context = getCurrentDateContext();
  return {
    start_date: context.current_quarter_dates.start,
    end_date: context.current_quarter_dates.end
  };
}

/**
 * Get date range filter for specific quarter
 */
export function getQuarterDateRange(quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4', year?: number): { start_date: string; end_date: string } {
  const currentYear = year || new Date().getFullYear();
  
  const quarters = {
    Q1: { start: `${currentYear}-01-01`, end: `${currentYear}-03-31` },
    Q2: { start: `${currentYear}-04-01`, end: `${currentYear}-06-30` },
    Q3: { start: `${currentYear}-07-01`, end: `${currentYear}-09-30` },
    Q4: { start: `${currentYear}-10-01`, end: `${currentYear}-12-31` },
  };
  
  return {
    start_date: quarters[quarter].start,
    end_date: quarters[quarter].end
  };
}