"use client";

import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { buildWhatsAppHref, SITE_CONTACT, toTelHref } from "@/lib/site-data/contact";
import { HOMEPAGE_CLOSING_CTA_CONTENT } from "@/lib/site-data/homepage";

export function HomeClosingCta() {
  const { actions, description, kicker, titleLead, titleAccent } =
    HOMEPAGE_CLOSING_CTA_CONTENT;

  return (
    <section className="home-section--white border-t border-theme-soft pt-8 pb-0 md:pt-10">
      <div className="home-shell-xl">
        <RouteCtaBand
          kicker={kicker}
          title={
            <>
              {titleLead}{" "}
              <span className="text-accent-italic-on-dark">{titleAccent}</span>
            </>
          }
          description={description}
          actions={[
            {
              href: actions.primary.href,
              label: actions.primary.label,
              variant: "primary",
            },
            {
              href: buildWhatsAppHref(actions.whatsapp.message),
              label: actions.whatsapp.label,
            },
            {
              href: toTelHref(SITE_CONTACT.supportPhone),
              label: actions.phone.label,
            },
          ]}
        />
      </div>
    </section>
  );
}
