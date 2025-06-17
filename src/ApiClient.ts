import {requestUrl, TFile} from 'obsidian';
import {ApiValidateResponse} from './Model/Api/ValidateResponse';
import {ApiSaveResponse} from './Model/Api/SaveResponse';
import {ApiGetCalendarResponse} from './Model/Api/GetCalendarResponse';
import {ApiKeyMissingException} from './Model/Exception/ApiKeyMissingException';
import {InvalidUserException} from './Model/Exception/InvalidUserException';
import {NoActiveSubscriptionException} from './Model/Exception/NoActiveSubscriptionException';
import {ValidationCache} from './ValidationCache';
import {log} from './Logger';

export class ApiClient {
  vaultName: string;
  secretKey: string;
  apiBaseUrl: string = 'http://localhost/api';
  // apiBaseUrl: string = 'https://obsidian-ical.com/api';
  private validationCache: ValidationCache;

  constructor(vaultName: string, secretKey: string) {
    this.vaultName = vaultName;
    this.secretKey = secretKey;
    this.validationCache = ValidationCache.getInstance();
  }

  isActive(forceRefresh: boolean = false): Promise<ApiValidateResponse> {
    // Check cache first unless force refresh is requested
    if (!forceRefresh) {
      const cachedResponse = this.validationCache.getCachedResponse(this.secretKey);
      if (cachedResponse) {
        log('Using cached validation response');
        return Promise.resolve(cachedResponse);
      }
    }

    log('Making fresh validation request to API');

    const response = requestUrl({
      url: `${this.apiBaseUrl}/validate`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.secretKey}`,
      },
    })
      .then(response => {
        const validationResponse = ApiValidateResponse.fromResponse(response);
        // Cache the successful response
        this.validationCache.setCachedResponse(this.secretKey, validationResponse);
        return validationResponse;
      })
      .catch(error => {
        // Clear cache on error to prevent using stale data
        this.validationCache.clearCache(this.secretKey);
        return this.handleApiError(error);
      });

    log('response:', response);

    return response;
  }

  async save(calendar: string) {
    // Check if we have a valid cached subscription before attempting to save
    const cachedValidation = this.validationCache.getCachedResponse(this.secretKey);
    if (cachedValidation && !cachedValidation.isSubscriptionActive()) {
      log('Skipping save - cached validation shows inactive subscription');
      throw new NoActiveSubscriptionException('No active subscription (cached)');
    }

    const response = await requestUrl({
      url: `${this.apiBaseUrl}/save`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.secretKey}`,
      },
      body: JSON.stringify({
        vaultName: this.vaultName,
      calendar,
      })
    })
      .then(response => ApiSaveResponse.fromResponse(response))
      .catch(error => {
        // Clear cache on error to prevent using stale data
        this.validationCache.clearCache(this.secretKey);
        return this.handleApiError(error);
      });

    log('/api/save response:', response);

    return response;
  }

  /**
   * Check if validation is cached and still valid
   */
  isValidationCached(): boolean {
    return this.validationCache.isCacheValid(this.secretKey);
  }

  /**
   * Get cached validation response if available
   */
  getCachedValidation(): ApiValidateResponse | null {
    return this.validationCache.getCachedResponse(this.secretKey);
  }

  /**
   * Clear validation cache for current secret key
   */
  clearValidationCache(): void {
    this.validationCache.clearCache(this.secretKey);
  }

  /**
   * Get calendar for current vault
   */
  async getCalendar(): Promise<ApiGetCalendarResponse> {
    log('Getting calendar for vault:', this.vaultName);

    const response = await requestUrl({
      url: `${this.apiBaseUrl}/calendar/${encodeURIComponent(this.vaultName)}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.secretKey}`,
      },
    })
      .then(response => ApiGetCalendarResponse.fromResponse(response))
      .catch(error => {
        // Handle 404 as "not found" rather than error
        if (error.status === 404) {
          return new ApiGetCalendarResponse({
            data: null,
            message: 'Calendar not found for this vault'
          });
        }
        return this.handleApiError(error);
      });

    log('/api/calendar response:', response);

    return response;
  }

  private handleApiError(error: any): never {
    // Handle API exceptions based on status code and message
    if (error.status === 400 && error.json?.message) {
      const message = error.json.message;

      if (message === 'Secret Key is required') {
        throw ApiKeyMissingException.fromResponse(error);
      } else if (message === 'Invalid user') {
        throw InvalidUserException.fromResponse(error);
      } else if (message === 'No active subscription') {
        throw NoActiveSubscriptionException.fromResponse(error);
      }
    }
    // Re-throw other errors
    throw error;
  }
}

export function apiClient(vaultName: string, secretKey: string): ApiClient {
  return new ApiClient(vaultName, secretKey);
}
