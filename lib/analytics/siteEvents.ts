type SiteEventPrimitive = string | number | boolean | null;
type SiteEventPayload = Record<string, SiteEventPrimitive>;

declare global {
  interface Window {
    va?: {
      track?: (eventName: string, payload: SiteEventPayload) => void;
    };
  }
}

function emitSiteEvent(eventName: string, payload: SiteEventPayload) {
  if (typeof window === "undefined") return;
  const track = window.va?.track;
  if (typeof track !== "function") return;
  track(eventName, payload);
}

function normalizeHref(href: string): string {
  return href.trim().toLowerCase();
}

function isWhatsAppHref(href: string): boolean {
  const value = normalizeHref(href);
  return value.includes("wa.me") || value.includes("whatsapp");
}

export function trackSiteCtaClick(params: {
  href: string;
  label: string;
  pathname: string;
  surface: string;
}) {
  const href = normalizeHref(params.href);
  let eventName = "site_cta_clicked";

  if (href.startsWith("/downloads") || href.startsWith("/brochure") || href.startsWith("/catalog")) {
    eventName = "resource_desk_clicked";
  } else if (href.startsWith("/planning")) {
    eventName = "planning_cta_clicked";
  } else if (href.startsWith("/contact")) {
    eventName = "contact_cta_clicked";
  } else if (href.startsWith("/compare")) {
    eventName = "compare_cta_clicked";
  } else if (href.startsWith("mailto:")) {
    eventName = "email_contact_clicked";
  } else if (href.startsWith("tel:")) {
    eventName = "phone_contact_clicked";
  } else if (isWhatsAppHref(href)) {
    eventName = "whatsapp_contact_clicked";
  }

  emitSiteEvent(eventName, {
    href: params.href,
    label: params.label,
    pathname: params.pathname,
    surface: params.surface,
  });
}

export function trackPlannerLaunchClicked(params: { pathname: string; surface: string }) {
  emitSiteEvent("planner_launch_clicked", params);
}

export function trackSiteSearchSubmitted(params: {
  pathname: string;
  surface: "header" | "mobile";
  queryLength: number;
  destination: string;
}) {
  emitSiteEvent("site_search_submitted", params);
}

export function trackCompareToggled(params: {
  pathname: string;
  surface: string;
  categoryId: string;
  productId: string;
  nextState: "added" | "removed";
}) {
  emitSiteEvent("compare_toggled", params);
}

export function trackQuoteCartAdded(params: {
  pathname: string;
  surface: string;
  productId: string;
}) {
  emitSiteEvent("quote_cart_added", params);
}

export function trackContactSubmission(params: {
  pathname: string;
  surface: string;
  source: string;
  status: "success" | "error";
}) {
  emitSiteEvent("contact_submission", params);
}
