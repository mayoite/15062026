import Link from "next/link";
import { OneAndOnlyLogo } from "@/components/ui/Logo";
import {
  buildMailtoHref,
  SITE_CONTACT,
  toTelHref,
} from "@/data/site/contact";
import { SITE_FOOTER_NAV, SITE_SOCIAL_LINKS } from "@/lib/siteNav";

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M23.5 6.2a3.1 3.1 0 0 0-2.2-2.2C19.4 3.5 12 3.5 12 3.5s-7.4 0-9.3.5A3.1 3.1 0 0 0 .5 6.2 32 32 0 0 0 0 12a32 32 0 0 0 .5 5.8 3.1 3.1 0 0 0 2.2 2.2c1.9.5 9.3.5 9.3.5s7.4 0 9.3-.5a3.1 3.1 0 0 0 2.2-2.2A32 32 0 0 0 24 12a32 32 0 0 0-.5-5.8zM9.6 15.5V8.5L15.8 12 9.6 15.5z" />
    </svg>
  );
}

const SOCIAL_ICON_MAP: Record<string, () => React.JSX.Element> = {
  facebook: FacebookIcon,
  youtube: YouTubeIcon,
};

const footerInteractiveClass =
  "rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer w-full surface-inverse text-inverse">
      <div className="shell-container py-12 md:py-14">
        <div className="site-footer__columns">
          <div className="flex flex-col gap-5">
            <Link href="/" prefetch={false} className={`site-footer__link ${footerInteractiveClass} block`}>
              <OneAndOnlyLogo variant="orange" className="h-10" />
            </Link>

            <address className="site-footer__address typ-body-sm whitespace-pre-line not-italic">
              {SITE_CONTACT.regionLine}
            </address>

            <div className="site-footer__meta typ-body-sm space-y-4">
              <div>
                <p className="site-footer__heading typ-overline mb-1">Sales and support</p>
                <div className="flex flex-col gap-1">
                  <a
                    href={toTelHref(SITE_CONTACT.salesPhone)}
                    className={`site-footer__link ${footerInteractiveClass} block`}
                  >
                    Sales: {SITE_CONTACT.salesPhone}
                  </a>
                  <a
                    href={toTelHref(SITE_CONTACT.supportPhone)}
                    className={`site-footer__link ${footerInteractiveClass} block`}
                  >
                    Support: {SITE_CONTACT.supportPhone}
                  </a>
                </div>
              </div>
              <div>
                <p className="site-footer__heading typ-overline mb-1">Email</p>
                <a href={buildMailtoHref()} className={`site-footer__link ${footerInteractiveClass} block`}>
                  {SITE_CONTACT.salesEmail}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-0.5">
              {SITE_SOCIAL_LINKS.map((social) => {
                const Icon = SOCIAL_ICON_MAP[social.id];
                return (
                  <a
                    key={social.id}
                    href={social.href}
                    aria-label={social.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`site-footer__social ${footerInteractiveClass}`}
                  >
                    {Icon ? <Icon /> : null}
                  </a>
                );
              })}
            </div>
          </div>

          {SITE_FOOTER_NAV.map((col) => (
            <div key={col.heading} className="site-footer__nav-col">
              <p className="site-footer__heading site-footer__nav-heading typ-overline mb-3">{col.heading}</p>
              <ul className="flex flex-col gap-2">
                {col.links.map(({ href, label }) => (
                  <li key={`${href}-${label}`}>
                    <Link href={href} prefetch={false} className={`site-footer__link ${footerInteractiveClass} typ-body-sm`}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="site-footer__divider mt-2 border-t">
        <div className="site-footer__legal-row typ-body-sm shell-container flex flex-col items-center justify-between gap-3 py-5 sm:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:justify-start">
            <Link href="/refund-and-return-policy" prefetch={false} className={`site-footer__legal ${footerInteractiveClass}`}>
              Refund Policy
            </Link>
            <Link href="/privacy" prefetch={false} className={`site-footer__legal ${footerInteractiveClass}`}>
              Privacy Policy
            </Link>
            <Link href="/terms" prefetch={false} className={`site-footer__legal ${footerInteractiveClass}`}>
              Terms
            </Link>
          </div>
          <div>&copy; {currentYear} One&Only. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}
