export class InvalidUserException extends Error {
  constructor(message: string = "Invalid user") {
    super(message);
    this.name = "InvalidUserException";

    // This is necessary for extending Error in TypeScript
    Object.setPrototypeOf(this, InvalidUserException.prototype);
  }

  static fromResponse(response: any): InvalidUserException {
    // Extract message from response if available
    const message = response?.json?.message || "Invalid user";
    return new InvalidUserException(message);
  }
}