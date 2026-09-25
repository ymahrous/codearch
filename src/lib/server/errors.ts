export type ErrorCode =
  "invalid_input" | "not_found" | "private" | "empty" | "too_large" | "timeout" | "unsupported" | "upstream" | "rate_limited" | "internal";

const STATUS: Record<ErrorCode, number> = {
  invalid_input: 400,
  not_found: 404,
  private: 403,
  empty: 422,
  too_large: 413,
  timeout: 504,
  unsupported: 422,
  upstream: 502,
  rate_limited: 429,
  internal: 500,
};

/** An error that is safe to show to users, with an HTTP status. */
export class AppError extends Error {
  readonly status: number;
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.status = STATUS[code];
  }
}
