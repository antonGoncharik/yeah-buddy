export type ReviewErrorCode = "NO_KEY" | "EMPTY" | "BUSY" | "GEMINI";

export class ReviewError extends Error {
  readonly code: ReviewErrorCode;

  constructor(code: ReviewErrorCode, message: string) {
    super(message);
    this.name = "ReviewError";
    this.code = code;
  }
}

export function reviewStatus(code: ReviewErrorCode): number {
  switch (code) {
    case "NO_KEY":
      return 503;
    case "EMPTY":
      return 422;
    case "BUSY":
      return 429;
    case "GEMINI":
      return 502;
  }
}
