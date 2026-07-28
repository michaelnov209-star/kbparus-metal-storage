export type SmtpFailureCode =
  | "smtp-auth-failed"
  | "smtp-connection-failed"
  | "smtp-envelope-rejected"
  | "smtp-message-rejected"
  | "smtp-send-failed";

type SmtpErrorLike = {
  code?: unknown;
  command?: unknown;
  responseCode?: unknown;
};

function asSmtpError(error: unknown): SmtpErrorLike {
  return error && typeof error === "object" ? (error as SmtpErrorLike) : {};
}

export function normalizeSmtpFailure(error: unknown): SmtpFailureCode {
  const code = asSmtpError(error).code;
  const normalized = typeof code === "string" ? code.toUpperCase() : "";

  if (normalized === "EAUTH") return "smtp-auth-failed";
  if (
    normalized === "ESOCKET" ||
    normalized === "ETIMEDOUT" ||
    normalized === "ECONNECTION" ||
    normalized === "ECONNREFUSED" ||
    normalized === "ENOTFOUND"
  ) {
    return "smtp-connection-failed";
  }
  if (normalized === "EENVELOPE") return "smtp-envelope-rejected";
  if (normalized === "EMESSAGE") return "smtp-message-rejected";
  return "smtp-send-failed";
}

export function smtpErrorLogDetails(error: unknown) {
  const source = asSmtpError(error);
  return {
    code: typeof source.code === "string" ? source.code : "unknown",
    command: typeof source.command === "string" ? source.command : undefined,
    responseCode:
      typeof source.responseCode === "number" ? source.responseCode : undefined
  };
}
