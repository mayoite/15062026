# Catalog and Asset Pipeline

## Objective

Make planner catalog ingest, normalization, dedupe, and asset resolution deterministic so runtime consumers depend on one canonical DTO, one manifest or registry-backed asset metadata source, and one canonical asset path flow.

## Files

- `E:\16062026\scripts\ingest-planner-catalog.ts`
- `E:\16062026\features\planner\catalog\ingest\csvCatalogIngest.ts`
- `E:\16062026\features\planner\catalog\generatedCatalogItems.ts`
- `E:\16062026\features\planner\catalog\generatedCatalogItemsPart1.ts`
- `E:\16062026\features\planner\catalog\generatedCatalogItemsPart2.ts`
- `E:\16062026\features\planner\catalog\workspaceCatalog.ts`
- `E:\16062026\features\planner\catalog\mergeCatalogItems.ts`
- `E:\16062026\features\planner\catalog\catalogStore.ts`
- `E:\16062026\features\planner\lib\assetPipeline.ts`
- `E:\16062026\lib\assetPaths.ts`
- `E:\16062026\docs\database\SEEDING.md`

## Required Outcomes

- one canonical ingest output path exists
- normalization happens before runtime, not repeatedly in the client
- one stable DTO shape feeds planner consumers
- planner asset metadata comes from one manifest or registry-backed source of truth
- asset paths resolve through one canonical helper
- duplicate rows, invalid source rows, stale generated artifacts, and missing assets become visible audit signals

## Source Validation Requirements

The ingest pipeline should validate supported source families explicitly before normalization.

Minimum expectations:
- each supported CSV or source family has a named validation path
- invalid rows are reported with enough context to trace the source
- validation failures do not quietly flow into runtime DTO generation
- source-family drift becomes visible in an audit or validation report

## Canonical Output and Retirement Rules

- separate parse, validate, normalize, dedupe, and map stages
- define a stable dedupe identity key
- emit one canonical generated output path
- emit a duplicate report
- emit a source validation report
- emit or preserve a human-readable missing-asset audit
- retire or deprecate stale generated artifacts intentionally
  - do not silently leave old generated outputs alive if they can drift from the canonical output

If old generated artifacts must remain temporarily for compatibility, mark them as transitional and map consumers intentionally.

## Asset Source of Truth

- use one manifest or registry-backed metadata source for planner asset references
- use one canonical asset path helper
- do not scatter hardcoded asset-path rewriting across runtime consumers
- make missing or stale asset references visible in audit output

## Implementation Steps

1. Baseline the current source inputs, generated artifacts, runtime consumers, and asset metadata paths.
2. Separate parse, validate, normalize, dedupe, and map stages.
3. Define a stable identity key for dedupe.
4. Emit one canonical output, one duplicate report, and one source validation report.
5. Replace ad hoc asset-path rewriting with one manifest or registry-backed resolver path.
6. Retire or explicitly deprecate stale generated artifacts that no longer match the canonical contract.

## Truth / Evidence

- canonicalization belongs at ingest, not in runtime render paths
- client-side re-normalization is the wrong shape because it bloats hydration and hides contract drift
- later database work depends on the catalog contract settling here first

## Do Not Break

- current planner catalog consumer expectations without mapping them first
- runtime asset lookup behavior for valid existing references
- data contract stability needed by later database work

## Proof Target

Proof for this file is strong only if a reviewer can show:
- the canonical ingest output
- the normalized DTO contract
- source-family validation evidence
- golden-output proof for the canonical generated output
- the single manifest or registry-backed asset metadata source
- the single asset-path resolution path
- duplicate, invalid-row, stale-artifact, and missing-asset audit evidence

## Evidence Types

Responsible proof for this lane can include:
- golden-output diff or snapshot for the canonical generated output
- duplicate report
- source validation report
- missing-asset audit
- stale-generated-artifact retirement or deprecation note
- consumer inventory showing runtime no longer re-normalizes source rows

## Completion Checklist

- [x] Canonical ingest output is named and used.
- [x] Source-family validation is explicit.
- [x] Normalization is not left for runtime render paths.
- [x] Asset metadata source of truth is manifest or registry-backed.
- [x] Asset resolution is centralized.
- [x] Golden-output proof exists or the exact gap is logged.
- [x] Duplicate, invalid-row, stale-artifact, and missing-asset audits are available or the exact gap is logged.
