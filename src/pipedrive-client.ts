import axios, { AxiosInstance, AxiosError } from 'axios';

export interface PipedriveConfig {
  apiToken: string;
  baseUrl?: string;
}

export interface PipedriveResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  error_info?: string;
  additional_data?: {
    pagination?: {
      start: number;
      limit: number;
      more_items_in_collection: boolean;
      next_start?: number;
    };
  };
}

export interface Deal {
  id: number;
  title: string;
  value?: number;
  currency?: string;
  user_id?: number;
  person_id?: number;
  org_id?: number;
  stage_id?: number;
  status?: string;
  probability?: number;
  lost_reason?: string;
  visible_to?: string;
  add_time?: string;
  update_time?: string;
  stage_change_time?: string;
  active?: boolean;
  deleted?: boolean;
  expected_close_date?: string;
  close_time?: string;
  pipeline_id?: number;
  won_time?: string;
  lost_time?: string;
  products_count?: number;
  files_count?: number;
  notes_count?: number;
  followers_count?: number;
  email_messages_count?: number;
  activities_count?: number;
  done_activities_count?: number;
  undone_activities_count?: number;
  [key: string]: any;
}

export interface Person {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  org_id?: number;
  org_name?: string;
  email?: Array<{ value: string; primary: boolean; label: string }>;
  phone?: Array<{ value: string; primary: boolean; label: string }>;
  visible_to?: string;
  add_time?: string;
  update_time?: string;
  active_flag?: boolean;
  owner_id?: number;
  label?: number;
  picture_id?: number;
  [key: string]: any;
}

export interface Organization {
  id: number;
  name: string;
  owner_id?: number;
  visible_to?: string;
  add_time?: string;
  update_time?: string;
  active_flag?: boolean;
  address?: string;
  cc_email?: string;
  label?: number;
  [key: string]: any;
}

export interface Pipeline {
  id: number;
  name: string;
  url_title?: string;
  order_nr?: number;
  active?: boolean;
  deal_probability?: boolean;
  add_time?: string;
  update_time?: string;
  selected?: boolean;
  [key: string]: any;
}

export interface Stage {
  id: number;
  order_nr: number;
  name: string;
  active_flag: boolean;
  deal_probability?: number;
  pipeline_id: number;
  pipeline_name?: string;
  add_time?: string;
  update_time?: string;
  [key: string]: any;
}

export interface Activity {
  id: number;
  company_id?: number;
  user_id?: number;
  done?: boolean;
  type: string;
  reference_type?: string;
  reference_id?: number;
  due_date?: string;
  due_time?: string;
  duration?: string;
  add_time?: string;
  marked_as_done_time?: string;
  last_notification_time?: string;
  last_notification_user_id?: number;
  notification_language_id?: number;
  subject?: string;
  public_description?: string;
  org_id?: number;
  person_id?: number;
  deal_id?: number;
  active_flag?: boolean;
  update_time?: string;
  update_user_id?: number;
  source_timezone?: string;
  [key: string]: any;
}

export interface Note {
  id: number;
  user_id?: number;
  deal_id?: number;
  person_id?: number;
  org_id?: number;
  content: string;
  add_time?: string;
  update_time?: string;
  active_flag?: boolean;
  pinned_to_deal_flag?: boolean;
  pinned_to_person_flag?: boolean;
  pinned_to_organization_flag?: boolean;
  [key: string]: any;
}

export interface User {
  id: number;
  name: string;
  email: string;
  active_flag: boolean;
  is_admin?: number;
  role_id?: number;
  timezone_name?: string;
  timezone_offset?: string;
  locale?: string;
  lang?: number;
  created?: string;
  modified?: string;
  default_currency?: string;
  phone?: string;
  company_id?: number;
  company_name?: string;
  company_domain?: string;
  [key: string]: any;
}

export interface SearchResult {
  result_score?: number;
  item: {
    id: number;
    type: string;
    title?: string;
    name?: string;
    value?: number;
    currency?: string;
    status?: string;
    visible_to?: string;
    owner?: {
      id: number;
    };
    person?: {
      id: number;
      name: string;
    };
    organization?: {
      id: number;
      name: string;
    };
    custom_fields?: string[];
    notes?: string[];
    [key: string]: any;
  };
}

export class PipedriveClient {
  private client: AxiosInstance;
  private apiToken: string;

  constructor(config: PipedriveConfig) {
    this.apiToken = config.apiToken;
    const baseUrl = config.baseUrl || 'https://api.pipedrive.com/v1';

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      config.params = {
        ...config.params,
        api_token: this.apiToken,
      };
      return config;
    });
  }

  private async handleRequest<T>(request: Promise<any>): Promise<PipedriveResponse<T>> {
    try {
      const response = await request;
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return {
          success: false,
          error: error.message,
          error_info: error.response?.data?.error || error.response?.statusText,
        };
      }
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  async getDeals(params?: {
    start?: number;
    limit?: number;
    status?: 'all_not_deleted' | 'open' | 'won' | 'lost' | 'deleted';
    filter_id?: number;
    user_id?: number;
    person_id?: number;
    org_id?: number;
  }): Promise<PipedriveResponse<Deal[]>> {
    return this.handleRequest<Deal[]>(
      this.client.get('/deals', { params })
    );
  }

  async getDeal(id: number): Promise<PipedriveResponse<Deal>> {
    return this.handleRequest<Deal>(
      this.client.get(`/deals/${id}`)
    );
  }

  async searchDeals(term: string, params?: {
    fields?: string;
    exact_match?: boolean;
    person_id?: number;
    org_id?: number;
    start?: number;
    limit?: number;
  }): Promise<PipedriveResponse<SearchResult[]>> {
    return this.handleRequest<SearchResult[]>(
      this.client.get('/deals/search', {
        params: { term, ...params }
      })
    );
  }

  async getPersons(params?: {
    start?: number;
    limit?: number;
    user_id?: number;
    filter_id?: number;
    first_char?: string;
  }): Promise<PipedriveResponse<Person[]>> {
    return this.handleRequest<Person[]>(
      this.client.get('/persons', { params })
    );
  }

  async getPerson(id: number): Promise<PipedriveResponse<Person>> {
    return this.handleRequest<Person>(
      this.client.get(`/persons/${id}`)
    );
  }

  async searchPersons(term: string, params?: {
    fields?: string;
    exact_match?: boolean;
    org_id?: number;
    start?: number;
    limit?: number;
  }): Promise<PipedriveResponse<SearchResult[]>> {
    return this.handleRequest<SearchResult[]>(
      this.client.get('/persons/search', {
        params: { term, ...params }
      })
    );
  }

  async getOrganizations(params?: {
    start?: number;
    limit?: number;
    user_id?: number;
    filter_id?: number;
    first_char?: string;
  }): Promise<PipedriveResponse<Organization[]>> {
    return this.handleRequest<Organization[]>(
      this.client.get('/organizations', { params })
    );
  }

  async getOrganization(id: number): Promise<PipedriveResponse<Organization>> {
    return this.handleRequest<Organization>(
      this.client.get(`/organizations/${id}`)
    );
  }

  async searchOrganizations(term: string, params?: {
    fields?: string;
    exact_match?: boolean;
    start?: number;
    limit?: number;
  }): Promise<PipedriveResponse<SearchResult[]>> {
    return this.handleRequest<SearchResult[]>(
      this.client.get('/organizations/search', {
        params: { term, ...params }
      })
    );
  }

  async getPipelines(): Promise<PipedriveResponse<Pipeline[]>> {
    return this.handleRequest<Pipeline[]>(
      this.client.get('/pipelines')
    );
  }

  async getPipeline(id: number): Promise<PipedriveResponse<Pipeline>> {
    return this.handleRequest<Pipeline>(
      this.client.get(`/pipelines/${id}`)
    );
  }

  async getStages(pipeline_id?: number): Promise<PipedriveResponse<Stage[]>> {
    return this.handleRequest<Stage[]>(
      this.client.get('/stages', { params: { pipeline_id } })
    );
  }

  async getStage(id: number): Promise<PipedriveResponse<Stage>> {
    return this.handleRequest<Stage>(
      this.client.get(`/stages/${id}`)
    );
  }

  async getActivities(params?: {
    start?: number;
    limit?: number;
    user_id?: number;
    filter_id?: number;
    type?: string;
    done?: 0 | 1;
  }): Promise<PipedriveResponse<Activity[]>> {
    return this.handleRequest<Activity[]>(
      this.client.get('/activities', { params })
    );
  }

  async getActivity(id: number): Promise<PipedriveResponse<Activity>> {
    return this.handleRequest<Activity>(
      this.client.get(`/activities/${id}`)
    );
  }

  async getNotes(params?: {
    start?: number;
    limit?: number;
    user_id?: number;
    deal_id?: number;
    person_id?: number;
    org_id?: number;
    pinned_to_deal_flag?: 0 | 1;
    pinned_to_person_flag?: 0 | 1;
    pinned_to_organization_flag?: 0 | 1;
  }): Promise<PipedriveResponse<Note[]>> {
    return this.handleRequest<Note[]>(
      this.client.get('/notes', { params })
    );
  }

  async getNote(id: number): Promise<PipedriveResponse<Note>> {
    return this.handleRequest<Note>(
      this.client.get(`/notes/${id}`)
    );
  }

  async searchItems(term: string, params?: {
    item_types?: string;
    fields?: string;
    search_for_related_items?: boolean;
    exact_match?: boolean;
    include_fields?: string;
    start?: number;
    limit?: number;
  }): Promise<PipedriveResponse<SearchResult[]>> {
    return this.handleRequest<SearchResult[]>(
      this.client.get('/itemSearch', {
        params: { term, ...params }
      })
    );
  }

  async getUsers(params?: {
    start?: number;
    limit?: number;
  }): Promise<PipedriveResponse<User[]>> {
    return this.handleRequest<User[]>(
      this.client.get('/users', { params })
    );
  }

  async getUser(id: number): Promise<PipedriveResponse<User>> {
    return this.handleRequest<User>(
      this.client.get(`/users/${id}`)
    );
  }

  async getCurrentUser(): Promise<PipedriveResponse<User>> {
    return this.handleRequest<User>(
      this.client.get('/users/me')
    );
  }

  // Generic method to make raw requests to Pipedrive API
  async makeRequest(path: string, params?: any): Promise<PipedriveResponse<any>> {
    if (path.includes('?')) {
      // Path already has query params, just append api_token
      const separator = path.includes('api_token') ? '&' : '&';
      path += `${separator}api_token=${this.apiToken}`;
    } else if (params) {
      // Use existing params handling
      return this.handleRequest<any>(
        this.client.get(path, { params })
      );
    }
    
    return this.handleRequest<any>(
      this.client.get(path)
    );
  }

  // Token-optimized methods
  async getDealsOptimized(params?: {
    start?: number;
    limit?: number;
    status?: 'all_not_deleted' | 'open' | 'won' | 'lost' | 'deleted';
    user_id?: number;
  }): Promise<PipedriveResponse<any[]>> {
    // Limit to max 50 items for optimization
    const safeParams = {
      ...params,
      limit: Math.min(params?.limit || 20, 50)
    };
    return this.getDeals(safeParams);
  }

  async getPersonsOptimized(params?: {
    start?: number;
    limit?: number;
    user_id?: number;
  }): Promise<PipedriveResponse<any[]>> {
    const safeParams = {
      ...params,
      limit: Math.min(params?.limit || 20, 50)
    };
    return this.getPersons(safeParams);
  }

  async getOrganizationsOptimized(params?: {
    start?: number;
    limit?: number;
    user_id?: number;
  }): Promise<PipedriveResponse<any[]>> {
    const safeParams = {
      ...params,
      limit: Math.min(params?.limit || 20, 50)
    };
    return this.getOrganizations(safeParams);
  }

  async getActivitiesOptimized(params?: {
    start?: number;
    limit?: number;
    user_id?: number;
    done?: boolean;
  }): Promise<PipedriveResponse<any[]>> {
    const { done, ...otherParams } = params || {};
    const safeParams = {
      ...otherParams,
      limit: Math.min(params?.limit || 20, 50),
      done: done !== undefined ? (done ? 1 : 0) as 0 | 1 : undefined
    };
    return this.getActivities(safeParams);
  }

  async getOverview(params?: {
    include_recent_deals?: boolean;
    include_recent_activities?: boolean;
    user_id?: number;
  }): Promise<PipedriveResponse<any>> {
    const { 
      include_recent_deals = true, 
      include_recent_activities = true,
      user_id 
    } = params || {};

    const overview: any = {
      timestamp: new Date().toISOString(),
      user_filter: user_id || null,
    };

    try {
      // Get recent deals (limited to 5)
      if (include_recent_deals) {
        const dealsResponse = await this.getDeals({ 
          limit: 5, 
          user_id,
          status: 'open' 
        });
        overview.recent_deals = {
          count: dealsResponse.additional_data?.pagination?.more_items_in_collection ? '5+' : dealsResponse.data?.length || 0,
          items: dealsResponse.data?.slice(0, 5).map((deal: any) => ({
            id: deal.id,
            title: deal.title,
            value: deal.value,
            currency: deal.currency,
            status: deal.status,
            user_id: deal.user_id,
          })) || []
        };
      }

      // Get recent activities (limited to 5)
      if (include_recent_activities) {
        const activitiesResponse = await this.getActivities({ 
          limit: 5, 
          user_id 
        });
        overview.recent_activities = {
          count: activitiesResponse.additional_data?.pagination?.more_items_in_collection ? '5+' : activitiesResponse.data?.length || 0,
          items: activitiesResponse.data?.slice(0, 5).map((activity: any) => ({
            id: activity.id,
            type: activity.type,
            subject: activity.subject,
            done: activity.done,
            due_date: activity.due_date,
            user_id: activity.user_id,
          })) || []
        };
      }

      return {
        success: true,
        data: overview,
        additional_data: {
          optimization: {
            applied: true,
            note: 'This is a token-optimized overview with limited data'
          }
        }
      } as PipedriveResponse<any>;

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  async searchItemsOptimized(term: string, params?: {
    item_types?: string;
    limit?: number;
  }): Promise<PipedriveResponse<any[]>> {
    const safeParams = {
      ...params,
      limit: Math.min(params?.limit || 10, 20)
    };
    return this.searchItems(term, safeParams);
  }
}