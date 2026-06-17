# Task 5 — Homepage tests (Agent D)

**Owner:** Agent D  
**Wave:** 1 (parallel with A, B, C) — **Done 2026-06-16** (tests + smoke per sub plan closure)

**Files:** `tests/homepage-data.test.ts`, `tests/site-navigation-smoke.spec.ts`, `components/home/TrustStrip.tsx` (testId hunk only), `tests/accessibility.spec.ts` (optional)

---

## 5.1 Fix `homepage-data.test.ts` drift

### Problem (current)

```ts
// tests/homepage-data.test.ts — drift
import { HOMEPAGE_PLANNER_SUITE_CONTENT, HOMEPAGE_PROJECTS_CONTENT } from "@/data/site/homepage";

it("planner section links to member login and overview", () => { /* not on / */ });

it("collections shows six featured categories", () => {
  expect(HOMEPAGE_COLLECTIONS_CONTENT.items).toHaveLength(6);
  expect(HOMEPAGE_PROJECTS_CONTENT.cards).toHaveLength(3); // Projects.tsx not on /
});
```

- `HOMEPAGE_PLANNER_SUITE_CONTENT` — used on `/planner` (`PlannerSuite.tsx`), not `/`.
- `HOMEPAGE_PROJECTS_CONTENT` — used in `Projects.tsx`, not live homepage; showcase uses `HOMEPAGE_SHOWCASE_CONTENT`.
- Missing: `HOMEPAGE_SHOWCASE_CONTENT`, `HOMEPAGE_PARTNERSHIP_CONTENT`, `HOMEPAGE_CONTACT_CONTENT`.

### Step 1: Update imports

```ts
import {
  HOMEPAGE_HERO_CONTENT,
  HOMEPAGE_HERO_IMAGES,
  HOMEPAGE_COLLECTIONS_CONTENT,
  HOMEPAGE_SHOWCASE_CONTENT,
  HOMEPAGE_PARTNERSHIP_CONTENT,
  HOMEPAGE_CONTACT_CONTENT,
  HOMEPAGE_WHY_CHOOSE_US_CONTENT,
} from "@/data/site/homepage";
```

Remove `HOMEPAGE_PLANNER_SUITE_CONTENT` and `HOMEPAGE_PROJECTS_CONTENT`.

### Step 2: Delete planner-suite test

Remove the entire `it("planner section links to member login and overview", …)` block.

### Step 3: Fix collections test

```ts
it("collections shows six featured categories", () => {
  expect(HOMEPAGE_COLLECTIONS_CONTENT.items).toHaveLength(6);
  expect(HOMEPAGE_COLLECTIONS_CONTENT.catalogCta.href).toBe("/products");
  expect(HOMEPAGE_COLLECTIONS_CONTENT.catalogCta.label).toBe("Browse full catalog");
});
```

### Step 4: Add showcase test

```ts
it("showcase carousel uses three portfolio clients and portfolio CTA", () => {
  expect(HOMEPAGE_SHOWCASE_CONTENT.items).toHaveLength(3);
  expect(HOMEPAGE_SHOWCASE_CONTENT.items.map((item) => item.id)).toEqual([
    "dmrc",
    "titan",
    "tvs",
  ]);
  expect(HOMEPAGE_SHOWCASE_CONTENT.sectionTitleLead).toBe("Delivered for");
  expect(HOMEPAGE_SHOWCASE_CONTENT.sectionTitleAccent).toBe("leading organizations");
  expect(HOMEPAGE_SHOWCASE_CONTENT.browseCta).toEqual({
    label: "View portfolio",
    href: "/portfolio",
  });
});
```

### Step 5: Add partnership test

```ts
it("partnership banner uses AFC strategic partner copy", () => {
  expect(HOMEPAGE_PARTNERSHIP_CONTENT.title).toEqual([
    "Official Strategic",
    "Partner",
  ]);
  expect(HOMEPAGE_PARTNERSHIP_CONTENT.image.src).toBe("/catalog-logo-sharp.webp");
  expect(HOMEPAGE_PARTNERSHIP_CONTENT.image.alt).toMatch(/AFC/i);
});
```

### Step 6: Add contact test

```ts
it("contact teaser leads with requirement headline and direct actions", () => {
  expect(HOMEPAGE_CONTACT_CONTENT.titleLead).toBe("Share your");
  expect(HOMEPAGE_CONTACT_CONTENT.titleAccent).toBe("requirement");
  expect(HOMEPAGE_CONTACT_CONTENT.directActions).toHaveLength(2);
  expect(HOMEPAGE_CONTACT_CONTENT.directActions.map((a) => a.type)).toEqual([
    "whatsapp",
    "phone",
  ]);
  expect(HOMEPAGE_CONTACT_CONTENT.directActions[0].label).toBe("WhatsApp now");
  expect(HOMEPAGE_CONTACT_CONTENT.directActions[1].label).toBe("Call team");
});
```

### Step 7: Run unit subset

```bash
npm.cmd run test -- tests/homepage-data.test.ts
```

---

## 5.2 TrustStrip `data-testid`

**File:** [`components/home/TrustStrip.tsx`](../../components/home/TrustStrip.tsx)

Fourth KPI (`locationsServed`) lacks `testId`. Add:

```ts
{
  value: formatKpiValuePlus(stats.locationsServed),
  label: "Locations serviced",
  testId: "kpi-locations-served",
},
```

**Hunk rule:** Agent D edits **only** this `items` entry. Agent A owns section/padding classes on the same file.

---

## 5.3 Extend `site-navigation-smoke.spec.ts`

Keep existing carousel/progress-dot and Final0704 section coverage.

### Hero CTAs + glass proof (new test)

```ts
test("homepage hero exposes product and quote CTAs plus trusted-by glass proof", async ({
  page,
}) => {
  await page.goto("/");

  const exploreProducts = page.getByRole("link", { name: "Explore Products" });
  await expect(exploreProducts).toBeVisible();
  await expect(exploreProducts).toHaveAttribute("href", "/products");

  const requestQuote = page.getByRole("link", { name: "Request a quote" });
  await expect(requestQuote).toBeVisible();
  await expect(requestQuote).toHaveAttribute("href", "/contact");

  const glassProof = page.getByRole("link", { name: /View clients/i });
  await expect(glassProof).toBeVisible();
  await expect(glassProof).toHaveAttribute("href", "/trusted-by");
  await expect(glassProof).toContainText(/Trusted by/i);
  await expect(glassProof).toContainText(/400\+/i);
});
```

### Partnership heading (add to sections test)

```ts
await expect(
  page.getByRole("heading", { name: /Official Strategic/i }),
).toContainText(/Partner/i);
```

### Trust locations KPI (add after `kpi-client-organisations`)

```ts
await expect(page.getByTestId("kpi-locations-served")).toBeVisible();
```

### Contact form aria (add to sections test)

```ts
const briefForm = page.getByRole("form", { name: "Project brief enquiry" });
await expect(briefForm).toBeVisible();
await expect(briefForm.getByRole("button", { name: /Send Brief/i })).toBeVisible();
await expect(page.getByLabel("Name")).toBeVisible();
await expect(page.getByLabel("City")).toBeVisible();
await expect(page.getByLabel("Phone or Email")).toBeVisible();
await expect(page.getByLabel("Brief")).toBeVisible();
```

Inputs use wrapping `<label>` + `id` (`contact-teaser-name`, etc.) — `getByLabel` is correct.

### Run nav smoke

```bash
npm.cmd run test:e2e:nav
```

---

## 5.4 Optional — homepage axe scan

**File:** [`tests/accessibility.spec.ts`](../../tests/accessibility.spec.ts)

```ts
test("homepage has no critical accessibility violations", async ({ page }) => {
  await page.goto("/");

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

```bash
npm.cmd run test:a11y
```

Include only if axe is clean on `/`. If violations exist, log in `docs/Failures.md` and skip rather than blocking Wave 1.

---

## Subagent-driven-development

| Stage | Reviewer focus |
|-------|----------------|
| **Implementer** | Apply 5.1–5.4; run vitest + e2e nav |
| **Spec reviewer** | Assertions match live `page.tsx`; no planner/projects false positives; glass proof links `/trusted-by`; form `aria-label` exact |
| **Code quality reviewer** | Stable role/testId selectors; no duplicate E2E; minimal imports |

**Do NOT skip** spec or quality review.