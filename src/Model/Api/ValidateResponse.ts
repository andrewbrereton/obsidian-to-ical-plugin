import { RequestUrlResponse } from 'obsidian';
import { log } from '../../Logger';

// Taken from: https://docs.stripe.com/api/subscriptions/object#subscription_object-status
export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  PAST_DUE = 'past_due',
  PAUSED = 'paused',
  TRIALING = 'trialing',
  UNPAID = 'unpaid',
}

export interface ApiErrorResponseData {
  error: boolean;
  message: string;
  code: number;
}

export class ApiErrorResponse {
  error: string;
  message: string;
  code: number;

  constructor(data: ApiErrorResponseData) {
    log('ApiErrorResponse:', data);
    this.error = data.error.toString();
    this.message = data.message.toString();
    this.code = data.code;
  }
}

export interface ApiValidateResponseData {
  data: {
    subscription: {
      status: string;
      expiresAt: string;
    }
  };
  message: string;
}

export class ApiValidateResponse {
  status: SubscriptionStatus;
  expiresAt: Date | null;
  message: string;

  constructor(data: ApiValidateResponseData) {
    log('ApiValidateResponseData:', data);
    // Convert string status to enum and validate
    this.status = this.parseStatus(data.data.subscription.status);
    this.expiresAt = data.data.subscription.expiresAt ? new Date(data.data.subscription.expiresAt) : null;
    this.message = data.message;
  }

  private parseStatus(status: string): SubscriptionStatus {
    const normalizedStatus = status.toLowerCase();

    // Check if it's a valid status
    if (Object.values(SubscriptionStatus).includes(normalizedStatus as SubscriptionStatus)) {
      return normalizedStatus as SubscriptionStatus;
    }

    // Default to CANCELED if not recognized
    log(`Unrecognized subscription status:`, status);
    return SubscriptionStatus.CANCELED;
  }

  isSubscriptionActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE;
  }

  // isTokenValid(): boolean {
  //   return this.valid;
  // }

  static fromJson(json: string): ApiValidateResponse|ApiErrorResponse {
    const data = JSON.parse(json);

    try {
      return new ApiValidateResponse(data);
    } catch (error) {
      console.error('Failed to parse ApiValidateResponse:', error);
      return new ApiErrorResponse(data);
    }
  }

  static fromResponse(response: RequestUrlResponse): ApiValidateResponse {
    return new ApiValidateResponse(response.json);
  }
}
