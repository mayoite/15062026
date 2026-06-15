# 06 — Testing & Evidence

*Commands, gates, evidence conventions, and quality ledger.*

---

## 1. Command reference

### Every batch (minimum)

```bash
npm run typecheck          # tsc --noEmit
npm run lint               # eslint --max-warnings=0
npm run test:planner       # vitest tests/planner
```

### Site / shared changes

```bash
npm run test:unit          # vitest tests/unit
npm run test:e2e:nav       # Playwright nav smoke
npm run test:a11y          # axe Playwright
```

### Significant releases

```bash
npm run release:gate
```

`release:gate` runs: `lint:secrets` → `lint` → `typecheck` → `build` → `test:a11y` → `test:e2e:nav` → `test:planner-catalog`

### Catalog / blocks

```bash
npm run catalog:qa:sheet   # SVG QA sheet
npm run test:planner-catalog  # Playwright catalog + guest workspace
```

### Database

```bash
npm run db:test
npm run db:apply
npm run launch:env
```

### Performance

```bash
npm run build && npm run start
# Then Lighthouse CLI against localhost — see results/audits/lighthouse-audit.md
```

---

## 2. Gate matrix

| Gate | When required | Pass | Fail action |
|---|---|---|---|
| typecheck | Always | 0 errors | Log `07`; fix before finish |
| lint | Always | 0 errors, 0 warnings | Log `07`; fix before finish |
| test:planner | `features/planner/` touches | All green | Log `07`; fix or revert |
| test:unit | `lib/`, `data/`, shared | All green | Log `07` |
| test:a11y | Public/planner marketing routes | All green | Log `07` |
| test:e2e:nav | Routes, nav, layout | All green | Log `07` |
| build | Export, config, deps | Exit 0 | Log `07` |
| release:gate | Significant batches | Exit 0 | Log `07`; no ship claim |

---

## 3. Evidence conventions

| Artifact type | Location | Naming |
|---|---|---|
| Command output | `results/` | `<gate>-YYYY-MM-DD.txt` |
| Lighthouse | `results/audits/` | `lighthouse-<route>.report.json` |
| Screenshots | `results/screenshots/<batch-id>/` | `<viewport>-<surface>.png` |
| Responsive matrix | `results/responsive/` | Per device folder |
| Catalog QA | `results/catalog-qa/` | Sheet + failure list |
| Security rerun | `results/audits/` | `security-rerun-YYYY-MM-DD.md` |
| Generated PDFs | `results/` | `boq-sample-YYYY-MM-DD.pdf` |

**Rule:** Handover and checklist Evidence columns must contain a **repo-relative path** or a **test file path** — not prose alone.

---

## 4. Playwright config note

Accessibility spec lives at `tests/accessibility.spec.ts`. Config: `config/build/playwright.config.ts`. If a11y tests do not run, verify `testDir` includes `tests/` root specs.

---

## 5. Quality ledger

### Ship gate (partner directive 2026-06-12)

- Average ≥ **4.9 / 5**
- No category < **4**
- No rounding up
- Incomplete evidence checklist = **withdrawn score** (precedent 2026-06-12)

### Categories

| Category | 1 (unacceptable) | 5 (flagship) |
|---|---|---|
| **Landing** | Stub or redirect | SSR hero vignette; LCP < 2.5s; CLS < 0.1 |
| **Editor UX** | Dead clicks, blank canvas | Shortcuts; mm readout; save indicator; onboarding |
| **Blocks** | Raster/blocky symbols | 121+ SKUs; SVG QA 0 failures; mm footprints |
| **3D** | Missing or broken | Split < 1s; materials/shadows top 20; sync < 500ms |
| **AI** | Mock or unwired | Chat + furnish; ghost apply + approval |
| **Help** | Stale or thin | 15+ sections; search; matches shipped editor |
| **Export** | Broken PDF | 300 DPI branded PDF + INR/GST BOQ |
| **Perf** | Canvas TTI > 4s | Canvas TTI < 2s; lazy Tldraw |
| **A11y** | Critical axe violations | 0 critical/serious on touched routes |
| **SEO** | Missing metadata | OG, canonical, JSON-LD |
| **Code health** | Lint/type fail | `release:gate` clean on touched paths |

### Score log

| Date | Phase / batch | Landing | Editor | Blocks | 3D | AI | Help | Export | Perf | A11y | SEO | Code | Avg | Ship? | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-06-11 | archive batch 2 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 3 | 5 | 5 | 5 | 4.2 | yes* | `archive/docs/plans/03-PLANNER-QUALITY-LEDGER.md` |
| 2026-06-12 | wave-1 start | — | — | — | — | — | — | — | — | — | — | — | — | — | Gate raised to 4.9 |
| 2026-06-13 | pack created | — | — | — | — | — | — | — | — | — | — | — | — | — | Awaiting re-baseline |

\*Archive score used 4.0 bar; current bar is **4.9**.

### Wave evidence checklists

**Wave A (surfaces)**

- [ ] `/planner` Lighthouse 375 + 1280 (LCP, CLS)
- [ ] Editor panel screenshots (rail, inspector, layers, modals)
- [ ] 3D before/after top 20 items
- [ ] `/planner/help` + one `/planner/features/[slug]` screenshot set

**Wave B (geometry + export)**

- [ ] Opening collision unit tests green
- [ ] BOQ PDF in `results/` with GST line assertion
- [ ] Command palette screenshot + no tldraw shortcut conflict

**Wave C (differentiation)**

- [ ] Share link route test
- [ ] GLB load time capture
- [ ] Showroom CTA + event names documented

---

## 6. Lighthouse targets (production build)

| Route | Perf now | Target | A11y target |
|---|---|---|---|
| `/` | 69 | ≥ 85 | 100 |
| `/products` | 52 | ≥ 80 | 100 |
| `/planner` | 75 | ≥ 90 | ≥ 96 |

Reproduction: `npm run build && npm run start` — audit against `localhost:3000`.

---

## 7. Security re-verification checklist

After P1 security items:

- [ ] No secrets in `.env.example` or committed history (new commits)
- [ ] `admin/themes/publish` returns 401 without admin session
- [ ] `planner/ai-advisor` rate limited
- [ ] `platform/drizzle/db.ts` throws if env missing
- [ ] Admin tokens ≥ 32 chars, not committed

Save rerun to `results/audits/security-rerun-YYYY-MM-DD.md`.
