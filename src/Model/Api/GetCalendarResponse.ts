import { RequestUrlResponse } from 'obsidian';
import { log } from '../../Logger';
import { ApiErrorResponse } from "./ValidateResponse";

export interface ApiGetCalendarResponseData {
  data: {
    calendar: {
      url: string;
      updatedAt: string;
      vaultName: string;
    };
  } | null;
  message: string;
}

export class ApiGetCalendarResponse {
  url: string | null;
  updatedAt: string | null;
  vaultName: string | null;
  message: string;
  found: boolean;

  constructor(data: ApiGetCalendarResponseData) {
    log('ApiGetCalendarResponse:', data);
    
    if (data.data?.calendar) {
      this.url = data.data.calendar.url;
      this.updatedAt = data.data.calendar.updatedAt;
      this.vaultName = data.data.calendar.vaultName;
      this.found = true;
    } else {
      this.url = null;
      this.updatedAt = null;
      this.vaultName = null;
      this.found = false;
    }
    
    this.message = data.message;
  }

  static fromJson(json: string): ApiGetCalendarResponse | ApiErrorResponse {
    const data = JSON.parse(json);

    try {
      return new ApiGetCalendarResponse(data);
    } catch (error) {
      console.error('Failed to parse ApiGetCalendarResponse:', error);
      return new ApiErrorResponse(data);
    }
  }

  static fromResponse(response: RequestUrlResponse): ApiGetCalendarResponse {
    return new ApiGetCalendarResponse(response.json);
  }
}