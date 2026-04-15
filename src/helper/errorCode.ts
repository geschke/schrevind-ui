export type ErrorWithCode = Error & {
  code?: string;
  status?: number;
  backendMessage?: string;
  fieldErrors?: Record<string, string>;
  backendData?: unknown;
};

export function getErrorCode(error: unknown): string {
  const err = error as ErrorWithCode;

  if (typeof err?.code === "string" && err.code.trim() !== "") {
    return err.code;
  }

  if (typeof err?.message === "string" && err.message.trim() !== "") {
    return err.message;
  }

  return "UNKNOWN_ERROR";
}

export function getBackendFieldErrors(error: unknown): Record<string, string> {
  const err = error as ErrorWithCode;

  if (err?.fieldErrors && typeof err.fieldErrors === "object") {
    return err.fieldErrors;
  }

  return {};
}
