"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Mail, MessageCircle, Phone, X } from "lucide-react";
import { hasConsentChoice } from "@/lib/consent";
import { trackSiteCtaClick } from "@/lib/analytics/siteEvents";
import { buildMailtoHref, buildWhatsAppHref, SITE_CONTACT, toTelHref } from "@/lib/site-data/contact";
import { routeSuppressesFloatingQuickContact } from '@/features/crm/contactSurfaces';

export function WhatsAppCTA() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const consentSettled = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      const handler = () => onStoreChange();
      window.addEventListener("oando-cookie-consent", handler as EventListener);
      return () => window.removeEventListener("oando-cookie-consent", handler as EventListener);
    },
    () => hasConsentChoice(),
    () => false,
  );

  if (!isHydrated || routeSuppressesFloatingQuickContact(pathname)) return null;

  const fabAnchor = consentSettled
    ? "site-fab-anchor site-fab-anchor--right site-fab-anchor--bottom"
    : "site-fab-anchor site-fab-anchor--right site-fab-anchor--bottom-raised";
  const panelAnchor = consentSettled
    ? "site-fab-anchor site-fab-anchor--right site-fab-anchor--panel"
    : "site-fab-anchor site-fab-anchor--right site-fab-anchor--panel-raised";
  const whatsappHref = buildWhatsAppHref("Hi, I need help with my workspace requirement.");
  const quickActions = [
    {
      href: whatsappHref,
      label: "WhatsApp now",
      detail: "Fastest response",
      icon: MessageCircle,
      external: true,
    },
    {
      href: toTelHref(SITE_CONTACT.supportPhone),
      label: "Call team",
      detail: "Talk to support",
      icon: Phone,
      external: false,
    },
    {
      href: buildMailtoHref("Workspace enquiry"),
      label: "Email us",
      detail: "Send the brief",
      icon: Mail,
      external: false,
    },
  ] as const;

  return (
    <>
      <motion.button
        type="button"
        aria-label="Open WhatsApp quick contact"
        onClick={() => setOpen((prev) => !prev)}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.25 }}
        className={`quick-contact-fab ${fabAnchor} inline-flex h-12 min-w-12 items-center justify-center rounded-full`}
      >
        <span className="quick-contact-fab__icon">
          <MessageCircle className="h-5 w-5" />
        </span>
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className={`quick-contact-panel ${panelAnchor} w-[19rem]`}
          >
            <div className="quick-contact-panel__header">
              <div>
                <p className="quick-contact-panel__title">Quick contact</p>
                <p className="quick-contact-panel__meta">Reach the team directly.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close WhatsApp quick contact"
                className="shell-icon-button rounded-full p-1.5 text-body"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="quick-contact-panel__list">
              {quickActions.map((action) => {
                const Icon = action.icon;
                  return (
                    <a
                      key={action.label}
                    href={action.href}
                      target={action.external ? "_blank" : undefined}
                      rel={action.external ? "noopener noreferrer" : undefined}
                      className="quick-contact-action quick-contact-panel__action"
                      onClick={() =>
                        trackSiteCtaClick({
                          href: action.href,
                          label: action.label,
                          pathname: pathname || "",
                          surface: "quick-contact-panel",
                        })
                      }
                    >
                    <span className="quick-contact-panel__action-icon">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="quick-contact-panel__action-copy">
                      <span className="quick-contact-panel__action-label">{action.label}</span>
                      <span className="quick-contact-panel__action-detail">{action.detail}</span>
                    </span>
                    <ArrowUpRight className="quick-contact-panel__action-arrow h-4 w-4" />
                  </a>
                );
              })}

              <Link
                href="/contact"
                className="quick-contact-panel__footer-link"
                onClick={() => {
                  trackSiteCtaClick({
                    href: "/contact",
                    label: "Open full contact page",
                    pathname: pathname || "",
                    surface: "quick-contact-panel",
                  });
                  setOpen(false);
                }}
              >
                Open full contact page
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
