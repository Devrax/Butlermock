/**
 * Raised for problems with the caller's input (unparsable source, nothing to
 * mock, unknown root name, ...) as opposed to unexpected internal failures.
 * The HTTP layer maps it to a 400 response.
 */
export class MockInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MockInputError";
  }
}
