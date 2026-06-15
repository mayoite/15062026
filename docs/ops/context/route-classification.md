# Live route classification

*Generated: 2026-06-15 — `node scripts/generate-route-classification.mjs`*

Canonical planner surface is **`/planner/**`** (`app/planner/`). Legacy `/oando-planner/**` and `/buddy-planner/**` redirect via `config/build/next.config.js`.

## Canonical planner

- `/planner/features/[slug]` → `app/planner/(marketing)/features/[slug]/page.tsx`
- `/planner/features` → `app/planner/(marketing)/features/page.tsx`
- `/planner/help` → `app/planner/(marketing)/help/page.tsx`
- `/planner` → `app/planner/(marketing)/page.tsx`
- `/planner/canvas` → `app/planner/(workspace)/canvas/page.tsx`
- `/planner/guest` → `app/planner/(workspace)/guest/page.tsx`
- `/planner` → `app/planner/page.tsx`

## Public site (`app/(site)/`)

- `/about` → `app/(site)/about/page.tsx`
- `/access` → `app/(site)/access/page.tsx`
- `/backend-architecture` → `app/(site)/backend-architecture/page.tsx`
- `/brochure` → `app/(site)/brochure/page.tsx`
- `/career` → `app/(site)/career/page.tsx`
- `/catalog` → `app/(site)/catalog/page.tsx`
- `/choose-product` → `app/(site)/choose-product/page.tsx`
- `/compare` → `app/(site)/compare/page.tsx`
- `/contact` → `app/(site)/contact/page.tsx`
- `/dashboard` → `app/(site)/dashboard/page.tsx`
- `/download-brochure` → `app/(site)/download-brochure/page.tsx`
- `/downloads` → `app/(site)/downloads/page.tsx`
- `/gallery` → `app/(site)/gallery/page.tsx`
- `/imprint` → `app/(site)/imprint/page.tsx`
- `/login` → `app/(site)/login/page.tsx`
- `/news` → `app/(site)/news/page.tsx`
- `/` → `app/(site)/page.tsx`
- `/portal/[id]` → `app/(site)/portal/[id]/page.tsx`
- `/portal/guest` → `app/(site)/portal/guest/page.tsx`
- `/portal/guest/view/[id]` → `app/(site)/portal/guest/view/[id]/page.tsx`
- `/portal` → `app/(site)/portal/page.tsx`
- `/portfolio` → `app/(site)/portfolio/page.tsx`
- `/privacy` → `app/(site)/privacy/page.tsx`
- `/products/[category]/[product]` → `app/(site)/products/[category]/[product]/page.tsx`
- `/products/[category]` → `app/(site)/products/[category]/page.tsx`
- `/products/category/[slug]` → `app/(site)/products/category/[slug]/page.tsx`
- `/products` → `app/(site)/products/page.tsx`
- `/projects` → `app/(site)/projects/page.tsx`
- `/quote-cart` → `app/(site)/quote-cart/page.tsx`
- `/refund-and-return-policy` → `app/(site)/refund-and-return-policy/page.tsx`
- `/service` → `app/(site)/service/page.tsx`
- `/showrooms` → `app/(site)/showrooms/page.tsx`
- `/social` → `app/(site)/social/page.tsx`
- `/solutions/[category]` → `app/(site)/solutions/[category]/page.tsx`
- `/solutions` → `app/(site)/solutions/page.tsx`
- `/support-ivr` → `app/(site)/support-ivr/page.tsx`
- `/sustainability` → `app/(site)/sustainability/page.tsx`
- `/templates` → `app/(site)/templates/page.tsx`
- `/terms` → `app/(site)/terms/page.tsx`
- `/tracking` → `app/(site)/tracking/page.tsx`
- … +1 more site routes

## Admin / CRM / Ops

- `/admin/analytics` → `app/admin/analytics/page.tsx`
- `/admin/buddy-catalog` → `app/admin/buddy-catalog/page.tsx`
- `/admin/catalog` → `app/admin/catalog/page.tsx`
- `/admin/features` → `app/admin/features/page.tsx`
- `/admin` → `app/admin/page.tsx`
- `/admin/planner-catalog` → `app/admin/planner-catalog/page.tsx`
- `/admin/plans/[id]` → `app/admin/plans/[id]/page.tsx`
- `/admin/plans` → `app/admin/plans/page.tsx`
- `/admin/themes` → `app/admin/themes/page.tsx`
- `/crm/clients` → `app/crm/clients/page.tsx`
- `/crm/projects/[id]` → `app/crm/projects/[id]/page.tsx`
- `/crm/projects` → `app/crm/projects/page.tsx`
- `/crm/quotes` → `app/crm/quotes/page.tsx`
- `/ops/customer-queries` → `app/ops/customer-queries/page.tsx`

## API routes

- `/api/admin/analytics` → `app/api/admin/analytics/route.ts`
- `/api/admin/buddy-catalog/[id]` → `app/api/admin/buddy-catalog/[id]/route.ts`
- `/api/admin/buddy-catalog` → `app/api/admin/buddy-catalog/route.ts`
- `/api/admin/catalog/[id]` → `app/api/admin/catalog/[id]/route.ts`
- `/api/admin/catalog` → `app/api/admin/catalog/route.ts`
- `/api/admin/configurator-catalog/[id]` → `app/api/admin/configurator-catalog/[id]/route.ts`
- `/api/admin/features` → `app/api/admin/features/route.ts`
- `/api/admin/planner-catalog` → `app/api/admin/planner-catalog/route.ts`
- `/api/admin/plans/[id]` → `app/api/admin/plans/[id]/route.ts`
- `/api/admin/plans` → `app/api/admin/plans/route.ts`
- `/api/admin/themes/publish` → `app/api/admin/themes/publish/route.ts`
- `/api/ai-advisor` → `app/api/ai-advisor/route.ts`
- `/api/ai-assist` → `app/api/ai-assist/route.ts`
- `/api/ai/advisor` → `app/api/ai/advisor/route.ts`
- `/api/audit` → `app/api/audit/route.ts`
- `/api/business-stats` → `app/api/business-stats/route.ts`
- `/api/categories` → `app/api/categories/route.ts`
- `/api/configurator/smart-wizard` → `app/api/configurator/smart-wizard/route.ts`
- `/api/customer-queries/manage` → `app/api/customer-queries/manage/route.ts`
- `/api/customer-queries` → `app/api/customer-queries/route.ts`
- `/api/dev-tools/lighthouse` → `app/api/dev-tools/lighthouse/route.ts`
- `/api/filter` → `app/api/filter/route.ts`
- `/api/generate-alt` → `app/api/generate-alt/route.ts`
- `/api/nav-categories` → `app/api/nav-categories/route.ts`
- `/api/nav-search` → `app/api/nav-search/route.ts`
- `/api/planner/ai-advisor` → `app/api/planner/ai-advisor/route.ts`
- `/api/plans/[id]` → `app/api/plans/[id]/route.ts`
- `/api/plans` → `app/api/plans/route.ts`
- `/api/products/filter` → `app/api/products/filter/route.ts`
- `/api/products` → `app/api/products/route.ts`
- … +4 more API routes

## Legacy redirects (301)

- `/oando-planner` → `/planner/`
- `/oando-planner/canvas` → `/planner/canvas/`
- `/oando-planner/guest` → `/planner/guest/`
- `/buddy-planner` → `/planner/canvas/`
- `/buddy-planner/guest` → `/planner/guest/`
- `/buddy-planner/editor` → `/planner/canvas/`
- `/buddy-planner/:path*` → `/planner/canvas/`

See also: `project/route-contract.json`, `proxy.ts`, `docs/Handover.md`.
