"use client";

import Link from "next/link";
import { ADMIN_HUB_CARDS } from "./adminNav";

export default function AdminDashboardPageView() {
  return (
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wide text-soft">Admin backend</p>
        <h1 className="text-2xl font-semibold text-strong">Platform control</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Manage planner plans, toolbar capabilities, catalog sources, analytics, themes, and the live route inventory.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ADMIN_HUB_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-xl border border-soft bg-panel p-5 transition-shadow hover:shadow-sm"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-subtle text-primary">
                <Icon size={18} aria-hidden />
              </div>
              <h2 className="font-medium text-strong">{card.label}</h2>
              <p className="mt-1 text-sm text-muted">{card.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
