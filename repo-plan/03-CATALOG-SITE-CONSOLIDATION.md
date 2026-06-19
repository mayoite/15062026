# 03 Catalog and Site Consolidation

## A. Canonical Catalog

Current ownership zones:

```text
features/catalog/*
lib/catalog/*
features/planner/catalog/*
features/planner/store/catalogData.ts
features/planner/store/catalogHelpers.ts
features/planner/store/plannerCatalog.ts
features/planner/store/plannerCatalogCore.ts
features/planner/store/plannerManagedProducts*.ts
features/planner/store/unifiedCatalog.ts
```

- [ ] Create a field matrix for site products, planner items, managed products, BOQ rows, and 3D items.
- [ ] Define one stable catalog ID and one dimensions/media/finish/model contract.
- [ ] Keep provider-neutral catalog logic under `features/catalog/`.
- [ ] Keep Fabric rendering, placement, drag/drop, and room presets under planner catalog.
- [ ] Move CSV ingestion out of runtime code and into tooling.
- [ ] Remove planner store catalog duplicates after imports migrate.
- [ ] Test one catalog ID across static product routes, planner placement, BOQ, and 3D.

## B. Site Content Ownership

Current content: `data/site/*.ts` and `data/site/localCatalogIndex.json`.

Current homepage UI: `components/home/*`.

- [ ] Map every exported site constant to its consumers.
- [ ] Keep brand, contact, navigation, and SEO defaults globally shared.
- [ ] Colocate homepage, route, support, assistant, and product-suite content with owning features.
- [ ] Detect duplicate component pairs before moving code:
  - `Hero.tsx` and `HomepageHero.tsx`
  - `TrustStrip.tsx` and `HomeTrustStrip.tsx`
  - repeated process/planner graphics across home and shared components
- [ ] Choose one canonical component per rendered responsibility.
- [ ] Keep `app/(site)/**/page.tsx` limited to metadata, server loading, and composition.
- [ ] Update navigation, SEO, homepage data, and screenshot tests after each slice.

## Acceptance Gate

- One catalog item has one identity and consistent dimensions across site and planner.
- No visible site copy has two active sources.
- No route file owns reusable domain logic.
