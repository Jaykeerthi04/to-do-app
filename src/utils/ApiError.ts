// Error with an HTTP status code, handled centrally by the error middleware.
export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}
