export class ApiKeyMissingException extends Error {
  constructor(message: string = "Secret Key is required") {
    super(message);
    this.name = "ApiKeyMissingException";

    // This is necessary for extending Error in TypeScript
    Object.setPrototypeOf(this, ApiKeyMissingException.prototype);
  }

  static fromResponse(response: any): ApiKeyMissingException {
    // Extract message from response if available
    const message = response?.json?.message || "Secret Key is required";
    return new ApiKeyMissingException(message);
  }
}
