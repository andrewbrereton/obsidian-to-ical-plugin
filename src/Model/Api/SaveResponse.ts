import { RequestUrlResponse } from 'obsidian';
import { log } from '../../Logger';
import { ApiErrorResponse } from "./ValidateResponse";

export interface ApiSaveResponseData {
  data: {
    calendar: {
      url: string;
      updatedAt: string;
    };
  };
  message: string;
}

export class ApiSaveResponse {
  url: string;
  updatedAt: string;
  message: string;

  constructor(data: ApiSaveResponseData) {
    log('ApiSaveResponse:', data);
    this.url = data.data.calendar.url;
    this.updatedAt = data.data.calendar.updatedAt;
    this.message = data.message;
  }

  // getUrl(): string {
  //   return this.status === SubscriptionStatus.ACTIVE;
  // }
  //
  // isTokenValid(): boolean {
  //   return this.valid;
  // }

  static fromJson(json: string): ApiSaveResponse|ApiErrorResponse {
    const data = JSON.parse(json);

    try {
      return new ApiSaveResponse(data);
    } catch (error) {
      console.error('Failed to parse ApiValidateResponse:', error);
      return new ApiErrorResponse(data);
    }
  }

  static fromResponse(response: RequestUrlResponse): ApiSaveResponse {
    return new ApiSaveResponse(response.json);
  }
}
