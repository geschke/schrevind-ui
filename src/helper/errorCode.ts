export type ErrorWithCode = Error & {
  code?: string;
  status?: number;
  backendMessage?: string;
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
