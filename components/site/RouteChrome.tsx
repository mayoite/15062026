"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { FooterLogoMarquee } from "@/components/site/FooterLogoMarquee";
import { CookieConsentBar } from "@/components/site/CookieConsentBar";
import DynamicBotWrapper from "@/features/site-assistant/DynamicBotWrapper";
import { WhatsAppCTA } from "@/components/ui/WhatsAppCTA";

export function RouteChrome({
  position,
}: {
  position: "top" | "bottom";
}) {
  const pathname = usePathname();
  const isPlannerMarketingRoute = pathname === "/oando-planner";
  const isBuddyMarketingRoute = pathname === "/buddy-planner";
  const isBackendArchitectureRoute =
    pathname === "/backend-architecture" || pathname?.startsWith("/backend-architecture/");
  const isLoginRoute =
    pathname === "/login" ||
    pathname?.startsWith("/login/") ||
    pathname === "/oando-planner/login" ||
    pathname?.startsWith("/oando-planner/login/") ||
    pathname === "/buddy-planner/login" ||
    pathname?.startsWith("/buddy-planner/login/");
  const isCADRoute =
    pathname === "/planner/canvas" || pathname?.startsWith("/planner/canvas/") ||
    pathname === "/planner/guest" || pathname?.startsWith("/planner/guest/") ||
    pathname === "/oando-planner/canvas" || pathname?.startsWith("/oando-planner/canvas/") ||
    pathname === "/planners" || pathname?.startsWith("/planners/") ||
    pathname === "/planner-blueprint" || pathname?.startsWith("/planner-blueprint/") ||
    pathname === "/planner1" || pathname?.startsWith("/planner1/") ||
    pathname === "/planner-lab" || pathname?.startsWith("/planner-lab/") ||
    pathname === "/draw" || pathname?.startsWith("/draw/") ||
    pathname === "/buddy-planner/editor" || pathname?.startsWith("/buddy-planner/editor/") ||
    pathname?.startsWith("/buddy-planner/t/");
  const isWorkspaceRoute =
    pathname === "/access" || pathname?.startsWith("/access/") ||
    pathname === "/choose-product" || pathname?.startsWith("/choose-product/") ||
    ((!isPlannerMarketingRoute) && (pathname === "/oando-planner" || pathname?.startsWith("/oando-planner/"))) ||
    ((!isBuddyMarketingRoute) && (pathname === "/buddy-planner" || pathname?.startsWith("/buddy-planner/"))) ||
    pathname === "/dashboard" || pathname?.startsWith("/dashboard/") ||
    isLoginRoute ||
    pathname === "/portal" || pathname?.startsWith("/portal/") ||
    pathname === "/admin" || pathname?.startsWith("/admin/") ||
    isBackendArchitectureRoute ||
    false;

  if (position === "top") {
    if (isCADRoute || isWorkspaceRoute) {
      return null;
    }

    return <SiteHeader />;
  }

  if (isLoginRoute) {
    return (
      <>
        <DynamicBotWrapper />
        <WhatsAppCTA />
      </>
    );
  }

  if (isCADRoute || isWorkspaceRoute) {
    return null;
  }

  return (
    <>
      <FooterLogoMarquee />
      <SiteFooter />
      <CookieConsentBar />
      <DynamicBotWrapper />
      <WhatsAppCTA />
    </>
  );
}
