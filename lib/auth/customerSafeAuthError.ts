const TEMPORARY_AUTH_ERROR =
  "Sign-in is temporarily unavailable. Please try again or contact support.";

const INVALID_CREDENTIALS_ERROR = "Email or password is incorrect.";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}

export function getCustomerSafeAuthError(error: unknown): string {
  const message = getErrorMessage(error).toLowerCase();

  if (
    message.includes("invalid credentials") ||
    message.includes("invalid email") ||
    message.includes("user_invalid_credentials")
  ) {
    return INVALID_CREDENTIALS_ERROR;
  }

  return TEMPORARY_AUTH_ERROR;
}
