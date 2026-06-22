'use client';

import React from 'react';
import { Users, Building2, MousePointerClick } from 'lucide-react';

const METRICS = [
  {
    value: '1,248',
    label: 'Total Active Users',
    icon: Users,
    tone: 'blue',
  },
  {
    value: '156',
    label: 'Workspaces Created',
    icon: Building2,
    tone: 'green',
  },
  {
    value: '8,409',
    label: 'Daily Interactions',
    icon: MousePointerClick,
    tone: 'amber',
  },
] as const;

export function AdminDashboard() {
  return (
    <section className="shell-admin-dashboard">
      <div className="shell-admin-dashboard__content">
        <div>
          <h2 className="shell-admin-page-title">Platform Overview</h2>
          <p className="shell-admin-page-copy">
            Manage global system settings, users, and resources.
          </p>
        </div>

        <div className="shell-admin-stat-grid">
          {METRICS.map((metric) => {
            const Icon = metric.icon;
            return (
              <article key={metric.label} className="shell-admin-stat-card">
                <div
                  className={`shell-admin-stat-card__icon shell-admin-stat-card__icon--${metric.tone}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="shell-admin-stat-card__value">{metric.value}</div>
                  <div className="shell-admin-stat-card__label">{metric.label}</div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
