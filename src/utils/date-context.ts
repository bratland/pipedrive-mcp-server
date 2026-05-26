/**
 * Date context utilities for MCP server responses
 */

const TZ = 'Europe/Stockholm';

function stockholmNow(): { year: number; month: number; date: string } {
  const fmt = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  const parts = fmt.formatToParts(new Date());
  const year = Number(parts.find(p => p.type === 'year')!.value);
  const month = Number(parts.find(p => p.type === 'month')!.value);
  const day = parts.find(p => p.type === 'day')!.value;
  const date = `${year}-${String(month).padStart(2, '0')}-${day}`;
  return { year, month, date };
}

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
  const { year, month, date } = stockholmNow();

  const q = month <= 3 ? 1 : month <= 6 ? 2 : month <= 9 ? 3 : 4;
  const currentQuarter = `Q${q}`;

  const quarterInfo = {
    q1: { start: `${year}-01-01`, end: `${year}-03-31` },
    q2: { start: `${year}-04-01`, end: `${year}-06-30` },
    q3: { start: `${year}-07-01`, end: `${year}-09-30` },
    q4: { start: `${year}-10-01`, end: `${year}-12-31` },
  };

  const currentQuarterKey = currentQuarter.toLowerCase() as 'q1' | 'q2' | 'q3' | 'q4';

  return {
    current_date: date,
    current_quarter: `${currentQuarter} ${year}`,
    current_year: year,
    quarter_info: quarterInfo,
    current_quarter_dates: quarterInfo[currentQuarterKey],
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
  const currentYear = year || stockholmNow().year;
  
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