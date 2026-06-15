export const CONSENT_COOKIE = "oando_cookie_consent";

export function hasConsentChoice(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .some((part) => part.startsWith(`${CONSENT_COOKIE}=`));
}
