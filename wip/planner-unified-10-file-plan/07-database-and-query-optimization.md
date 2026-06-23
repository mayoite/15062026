# Database and Query Optimization

## Objective

Tune planner, admin, and catalog database access only after state and data contracts are stable.

## Files

- `E:\16062026\platform\drizzle\schema.ts`
- `E:\16062026\platform\drizzle\migrations\0001_add_missing_indexes.sql`
- `E:\16062026\platform\drizzle\db.ts`
- `E:\16062026\app\api\plans\route.ts`
- `E:\16062026\app\api\plans\[id]\route.ts`
- `E:\16062026\app\api\admin\plans\route.ts`
- `E:\16062026\app\api\planner\catalog\route.ts`
- `E:\16062026\lib\supabase\server.ts`
- `E:\16062026\lib\supabase\client.ts`

## Required Outcomes

- hot routes use indexes that match real filter and sort patterns
- summary queries fetch summary columns only
- detail queries remain explicit and complete
- JSON search predicates are flattened where hot search/filter paths justify indexed columns
- RLS policy-column assumptions are explicit and indexed if they are on hot paths
- connection reuse is stable
- route-level observability exists instead of assumption
- query evidence exists instead of assumption

## Implementation Steps

1. Baseline hot planner, admin, and catalog query shapes by route.
2. Separate summary, detail, and write-side lookup paths.
3. Flatten JSON search predicates into explicit searchable columns where those predicates are on hot paths.
4. Add missing composite or partial indexes only where query shape proves they matter.
5. Make RLS policy-column assumptions explicit and index those columns if they are actually part of hot query or policy filters.
6. Reduce read-after-write round trips where a single statement is enough.
7. Add route-level observability so slow or scan-heavy paths are visible.
8. Capture explain evidence before and after changes.

## Route-Level Observability

The lane is not complete if it only adds indexes and hopes for the best.

At minimum, make it possible to inspect:
- which route or query shape is hot
- which filters and sorts are actually used
- whether the plan hits the intended index
- whether repeated requests allocate unnecessary new clients or pools

Observability can be lightweight, but it must be real.

## Dependency Rule

Do not let this lane redefine persistence semantics or catalog contracts.
It optimizes the settled contracts from files `04` and `06`.

## Do Not Break

- hydration and persistence semantics settled earlier
- API response fields the UI actually needs
- connection/client discipline
- RLS behavior that the current routes depend on

## Proof Target

Proof for this file is strong only if a reviewer can show:
- before and after query evidence per hot route
- summary reads narrowed
- detail reads preserved
- JSON search flattening where it was required
- RLS policy-column/index decisions called out explicitly
- route-level observability or equivalent route notes
- connection reuse staying stable

## Evidence Types

Responsible proof for this lane can include:
- `EXPLAIN` or `EXPLAIN ANALYZE`
- before and after route query notes
- field-list diff for summary vs detail responses
- client or pool reuse notes from repeated requests
- explicit note where a proposed index was rejected because the query shape did not justify it

## Completion Checklist

- [ ] Hot query paths are named and measured. <!-- partial: routes are named and telemetry exists, but runtime measurement is still missing -->
- [x] Summary, detail, and write-side lookup boundaries are explicit.
- [x] JSON search predicates are flattened where hot-path evidence justifies it, or the exact reason not to is logged.
- [ ] RLS policy-column assumptions are explicit. <!-- partial: no live RLS verification is available here -->
- [x] Index changes match actual query patterns.
- [x] Route-level observability exists or the exact gap is logged.
- [ ] Explain or equivalent evidence exists, or the exact gap is logged. <!-- partial: exact gap is logged, but no live EXPLAIN capture exists -->
