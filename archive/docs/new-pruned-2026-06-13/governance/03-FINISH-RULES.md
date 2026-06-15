# 03 — Finish Rules

*Complete every step before marking a checklist item `[x]` or declaring a batch done.*

---

## 1. Implementation complete

- [ ] Smallest complete increment shipped — no TODO stubs left in production paths for this item
- [ ] No unrelated files changed (or unrelated changes reverted)
- [ ] Competitor naming/assets scan: none introduced (`01-MASTER-PLAN.md` honesty rule)
- [ ] Guest and auth paths both manually checked if the item touches planner workspace

---

## 2. Automated gates (run in order)

```bash
npm run typecheck
npm run lint
npm run test:planner
```

For planner UI, export, or marketing surfaces:

```bash
npm run test:unit
npm run test:a11y
npm run test:e2e:nav
```

For significant app-wide work:

```bash
npm run release:gate
```

| Gate | Required | Pass criterion |
|---|---|---|
| `typecheck` | Always | 0 errors |
| `lint` | Always | 0 errors, 0 warnings |
| `test:planner` | Planner touches | All green; record count |
| `test:unit` | Shared lib / data | All green |
| `test:a11y` | Public or planner marketing routes | All green |
| `test:e2e:nav` | Route / nav changes | All green |
| `release:gate` | Significant batches | Full script exit 0 |

- [ ] All required gates for this item: **PASS**
- [ ] Output pasted or saved under `results/` (e.g. `results/typecheck-YYYY-MM-DD.txt`)

If any gate fails: **do not mark done**. Log in `07-FAILURES-AND-RISKS.md`, fix, re-run from top.

---

## 3. Manual verification

| Item type | Manual checks |
|---|---|
| Planner editor | Place wall, door, furniture; undo/redo; autosave indicator; 2D↔3D sync |
| Planner landing | H1 visible without hydration; reduced-motion; 375 + 1280 px |
| Export / BOQ | Generate PDF; spot-check line items vs catalog |
| Site page | First viewport CTA; mobile drawer; no console errors |
| API / security | Unauthenticated request rejected; rate limit where specified |
| Performance | Lighthouse or bundle note if item targets perf |

- [ ] Manual checks for this item type completed
- [ ] Regressions checked on adjacent surfaces listed in handover

---

## 4. Visual evidence

Screenshot every **changed** surface at:

- 375 px (mobile)
- 768 px (tablet) — if layout breakpoints change
- 1280 px (desktop)

Save under:

- `results/screenshots/<batch-id>/`
- Or `results/responsive/` for full matrix runs

- [ ] Screenshots captured and paths recorded in handover

For perf items, also:

- [ ] Lighthouse JSON or markdown under `results/audits/`

---

## 5. Quality ledger (planner product work)

If the batch touches a scored surface (`06-TESTING-AND-EVIDENCE.md` §Ledger):

- [ ] Categories re-scored with date and evidence links
- [ ] Average ≥ **4.9** and no category < **4** before calling a wave complete
- [ ] Score without evidence = **no score** (withdrawn-score precedent 2026-06-12)

---

## 6. Documentation updates (same session)

| Doc | Update |
|---|---|
| `05-EXECUTION-CHECKLIST.md` | `[x]` only with evidence path in the Evidence column |
| `04-HANDOVER.md` | Verification, active batch closed, next item |
| `07-FAILURES-AND-RISKS.md` | Any failure, skip, waiver, or new risk |
| `06-TESTING-AND-EVIDENCE.md` | Score log row if planner ledger affected |

- [ ] All four docs updated in the same session as the code merge

---

## 7. Feature loop (mandatory)

1. Define feature + acceptance evidence **before** code (start rules)
2. Implement smallest complete increment
3. Run automated + manual tests
4. Critique: usability, visual quality, correctness, regressions, ledger
5. Revise defects
6. Retest after revision

- [ ] Loop closed — item is not done at step 3

---

## 8. Finish sign-off

| Field | Value |
|---|---|
| Date | |
| Operator | |
| Checklist item ID | |
| Gates run | |
| Gate results | all pass / list failures |
| Evidence paths | |
| Manual verification | done / N/A |
| Screenshots | paths or N/A |
| Ledger update | row date or N/A |
| Known follow-ups | |

Remove **Active batch** from `04-HANDOVER.md` or mark **Complete**.

---

## Definition of done (absolute)

An item is **done** only when all are true:

1. Checklist row is `[x]` with evidence path filled in
2. Required gates passed with saved output
3. Manual verification complete for the item type
4. Handover updated
5. No new undocumented Severity 0–1 issues introduced

An item is **not done** if:

- Tests pass but acceptance evidence is missing
- Only happy path was tested
- Another operator cannot reproduce the evidence from the handover alone
- Lint/typecheck were not re-run after the last commit
