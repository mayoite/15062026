# 01 — Site & Ops Portal Implementation Plan

*Revised: 2026-06-10 — Consolidated, flat architecture, genuine verification, expanded scope.*

## Goal
Establish a blazing fast, highly converting public marketing surface for `oando.co.in`, seamlessly connected to a secure, internal "Mission Control" Ops Portal. Both surfaces must feel premium, enterprise-grade, and trust-inspiring.

## 1. Technical Architecture

### Frontend (Public & Internal)
- **Framework:** Next.js (App Router).
- **Styling:** Tailwind CSS v4 + Vanilla CSS for modular components.
- **Architecture:** Flat repository structure. `apps/packages` monorepo patterns are explicitly rejected. All features live under `features/`.

### Backend & Infrastructure
- **Identity & Sessions:** Appwrite (handles all user auth, roles, and messaging).
- **Ops Database (Profiles/Plans):** DigitalOcean Managed Postgres + Drizzle ORM.
- **Product Catalog Database:** Supabase Postgres (Hosts the legacy catalog data for the showroom and planners).
- **Blob Storage:** Cloudflare R2 (product images, downloads, static assets).
- **Email/Messaging:** Appwrite Messaging (routes to SMTP; no direct Resend/SendGrid application code).

## 2. Expanded Feature Scope

### A. Public Marketing Site (`features/site/`)
1. **Premium Homepage:** Hero section, dynamic product carousels, and clear CTAs to "Start Planning".
2. **Product Showroom:** Fast-loading SSR pages showcasing specific furniture lines.
3. **Template Gallery:** Browse pre-made workspace layouts that open directly in the planner.
4. **Unified AI Copilot:** The same AI used in the planner is embedded on the main site with slight modifications. It acts as an intelligent sales assistant, guiding users through product selection and instantly generating starter floorplans.
5. **Performance:** Sub-second LCP. Strict caching via Next.js and Cloudflare.
6. **SEO:** Built-in metadata, OpenGraph tags, semantic HTML5, and automatic XML sitemaps.

### B. Ops Portal / Dashboard (`features/ops-portal/`)
1. **Purpose:** Internal "Mission Control" for Oando staff.
2. **Role-Based Access (RBAC):** Strict admin role guards verified against Appwrite identity.
3. **Live Metrics:** Real-time dashboard showing active users, generated plans, and total BOQ value.
4. **Plan Management:** View and export user-generated plans and BOQs.
5. **System Health:** Monitoring DigitalOcean and Appwrite status from within the dashboard.

## 3. Implementation Checklist

### Milestone 1: Routing & Authentication
- [ ] Implement Appwrite session initialization and SSR cookies.
- [ ] Scaffold public marketing routes (`/`, `/products`, `/about`, `/templates`).
- [ ] Create strict middleware to secure `/ops/*` routes behind Admin role guards.
- [ ] Build the Admin Login flow.

### Milestone 2: Design System Integration
- [ ] Apply global Tailwind v4 tokens (colors, typography).
- [ ] Build reusable UI components (Buttons, Modals, Carousels).
- [ ] Add smooth micro-animations and "glassmorphism" accents to the Homepage.
- [ ] Integrate Cloudflare R2 for optimized image delivery.

### Milestone 3: Ops Portal (Phase 1)
- [ ] Scaffold the Dashboard layout (Sidebar, Header, Metric Cards).
- [ ] Connect Drizzle ORM to fetch read-only data (Recent Plans, Active Users).
- [ ] Build the "Plan Viewer" allowing staff to inspect user designs.
- [ ] Implement System Health status indicators.

### Milestone 4: Verification & SEO
- [ ] Ensure 0 TypeScript errors and 0 ESLint errors across `features/site` and `features/ops-portal`.
- [ ] Implement dynamic SEO tags and OpenGraph image generation.
- [ ] Write Playwright smoke tests for the Homepage load and Ops portal restricted access.
- [ ] Verify Mobile Responsiveness across all public pages.

## 4. Operational Rules
- **No CDNs:** Third-party assets will be downloaded and hosted locally or on Google/Cloudflare R2.
- **Truth Logs:** All failures, skips, and blockers must be written to `Failures.md`. Handover state goes to `Handover.md`.
