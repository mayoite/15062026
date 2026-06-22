"use client";

import Link from "next/link";
import { ArrowRight, ClipboardList, Package, Settings } from "lucide-react";
import { ADMIN_HUB_SECTIONS } from "./adminNav";

const QUICK_LINKS = [
  {
    href: "/admin/catalog",
    label: "Edit catalog",
    copy: "Dimensions, visibility, mesh types",
    icon: Package,
  },
  {
    href: "/admin/plans",
    label: "Review plans",
    copy: "Saved layouts and guest sessions",
    icon: ClipboardList,
  },
  {
    href: "/admin/settings",
    label: "Canvas & flags",
    copy: "Bounds, feature toggles, env reference",
    icon: Settings,
  },
] as const;

export default function AdminDashboardPageView() {
  return (
    <div className="admin-page shell-admin-dashboard">
      <section className="admin-hero" aria-labelledby="admin-hero-title">
        <div className="admin-hero__inner">
          <div className="admin-hero__copy">
            <p className="admin-page__eyebrow admin-hero__eyebrow">Admin backend</p>
            <h1 id="admin-hero-title" className="admin-hero__title">
              Platform control
            </h1>
            <p className="admin-hero__lead">
              Manage planner sessions, catalog products, feature flags, themes, and the live route inventory from one
              console.
            </p>
          </div>
          <div className="admin-hero__quick" aria-label="Quick actions">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href} className="admin-quick-link">
                  <span className="admin-quick-link__icon" aria-hidden>
                    <Icon size={16} />
                  </span>
                  <span>
                    <span className="admin-quick-link__label">{link.label}</span>
                    <span className="admin-quick-link__copy">{link.copy}</span>
                  </span>
                  <ArrowRight size={15} className="admin-quick-link__arrow" aria-hidden />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {ADMIN_HUB_SECTIONS.map((section) => (
        <section key={section.title} className="admin-hub-section" aria-labelledby={`hub-${section.title}`}>
          <header className="admin-hub-section__header">
            <h2 id={`hub-${section.title}`} className="admin-hub-section__title">
              {section.title}
            </h2>
          </header>
          <div className="admin-grid-cards">
            {section.items.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.href} href={card.href} className="shell-admin-card">
                  <span className="shell-admin-card__icon" aria-hidden>
                    <Icon size={18} />
                  </span>
                  <h3 className="shell-admin-card__title">{card.label}</h3>
                  <p className="shell-admin-card__desc">{card.description}</p>
                  <span className="shell-admin-card__cta">
                    Open
                    <ArrowRight size={14} aria-hidden />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
