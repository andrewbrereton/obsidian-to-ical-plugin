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
  // Returned when the API status string is empty or doesn't match any of the
  // known Stripe statuses above. Preserves the original string in rawStatus
  // so it's still diagnosable from the UI / debug log without misreporting
  // the user as CANCELED.
  UNKNOWN = 'unknown',
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
  rawStatus: string;
  expiresAt: Date | null;
  message: string;

  constructor(data: ApiValidateResponseData) {
    log('ApiValidateResponseData:', data);
    this.rawStatus = data.data.subscription.status ?? '';
    this.status = this.parseStatus(this.rawStatus);
    this.expiresAt = data.data.subscription.expiresAt ? new Date(data.data.subscription.expiresAt) : null;
    this.message = data.message;
  }

  private parseStatus(status: string): SubscriptionStatus {
    const normalizedStatus = (status ?? '').toLowerCase();

    // Match against a known status. Stripe may introduce new statuses, and the
    // API may return values from a non-Stripe billing source — those land in
    // UNKNOWN rather than getting silently coerced to CANCELED.
    if (Object.values(SubscriptionStatus).includes(normalizedStatus as SubscriptionStatus)
      && normalizedStatus !== SubscriptionStatus.UNKNOWN) {
      return normalizedStatus as SubscriptionStatus;
    }

    log(`Unrecognized subscription status:`, status);
    return SubscriptionStatus.UNKNOWN;
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
