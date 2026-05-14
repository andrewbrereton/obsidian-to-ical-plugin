export interface ApiErrorResponse {
  status?: number;
  json?: {
    message?: string;
  };
}

export function isApiErrorResponse(error: unknown): error is ApiErrorResponse {
  return typeof error === 'object' && error !== null;
}
