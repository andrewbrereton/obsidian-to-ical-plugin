export class NoActiveSubscriptionException extends Error {
  constructor(message: string = "No active subscription") {
    super(message);
    this.name = "NoActiveSubscriptionException";

    // This is necessary for extending Error in TypeScript
    Object.setPrototypeOf(this, NoActiveSubscriptionException.prototype);
  }

  static fromResponse(response: any): NoActiveSubscriptionException {
    // Extract message from response if available
    const message = response?.json?.message || "No active subscription";
    return new NoActiveSubscriptionException(message);
  }
}