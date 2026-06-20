# Stage 01 findings

Generated: 2026-06-19T13:07:25.093Z

## Migration review

All 168 inventory paths marked `Migration review` have a classification and direct, type-only, and dynamic import-reference fields.

| Classification | Count |
|---|---:|
| canonical | 10 |
| compatibility | 34 |
| false-positive | 68 |
| generated | 2 |
| protected | 8 |
| stale | 46 |

Unreferenced by resolved active-source imports: 89. This is not deletion proof.

## Duplicate filenames versus responsibilities

- Duplicate filename groups: 36. These are listed independently in `duplicate-filenames.csv`.
- Responsibility review buckets: 6. These are listed independently in `duplicate-responsibilities.csv`.
- Exact normalized-content duplicate groups: 5. These are listed in `duplicate-content.csv`.
- High-confidence planner duplication includes catalog/store copies of `plannerCatalogCore.ts` and `plannerManagedProductsShared.ts`, multiple persistence/document bridges, three template surfaces, and parallel `3d/` and `viewer/` scene surfaces.
- Exact-content findings include Supabase and Appwrite files under protected `platform/`; no change is authorized by this audit.

## Runtime circular imports

Runtime strongly connected components: 2. Type-only edges are excluded.
- Cycle 1: features/planner/catalog/catalogStore.ts; features/planner/onboarding/projectSetup.ts
- Cycle 2: features/planner/lib/documentBridge.ts; features/planner/lib/fabricDocumentBridge.ts

## Evidence limits

Computed import expressions and non-`@/` path aliases are not statically resolved. Classification and duplication buckets require ownership review before implementation moves.
