# Website Launch 5-Phase Governance And Metrics

Source documents:

1. `docs/ops/audits/website-world-standard-audit.md`

2. `docs/ops/audits/website-world-standard-audit-critique.md`

Purpose: define the operating model, owners, metrics, gates, severity rules, and reporting cadence for the five-phase website launch plan.

## Governance Summary

The launch should be managed as a controlled release, not a design-cleanup effort. The audit found production reliability, conversion, content proof, accessibility, and monitoring gaps. These need explicit decision authority and measurable gates.

## Owner Map

### Launch Lead

Accountable for go/no-go, severity classification, waiver approval, daily review, and final launch decision.

### Engineering Lead

Accountable for Appwrite repair, auth reliability, backend dependency clarity, env validation support, and technical completion evidence.

### DevOps Owner

Accountable for Vercel envs, production/preview configuration, deployment checks, custom-domain readiness, and rollback mechanics.

### QA Owner

Accountable for route coverage, smoke tests, screenshots, console/network error capture, auth verification, quote verification, and final evidence pack.

### Design Lead

Accountable for first-viewport hierarchy, mobile calm, CTA choreography, cookie/assistant placement, and premium visual acceptance.

### Frontend Owner

Accountable for implementing first-viewport fixes, auth error states, quote UI states, accessibility fixes, and route-level UI behavior.

### Commercial Owner

Accountable for quote requirements, buyer journey, response SLA, fallback contact paths, product-to-quote movement, and sales usefulness of captured data.

### Sales-Operations Owner

Accountable for quote routing, recipient monitoring, CRM/mailbox ownership, duplicate handling, lead status, and response-time reporting.

### Content Lead

Accountable for product copy, trust proof, sustainability evidence, strategic partner explanation, and removal of internal product-team language.

### Content Operations Owner

Accountable for gathering dimensions, materials, finishes, lead times, warranty details, installation support, certifications, and source records.

### Accessibility Owner

Accountable for headings, contrast, alt text, labels, keyboard access, focus order, screen-reader risk, and target-size checks.

### Analytics Owner

Accountable for launch event taxonomy, quote metrics, auth metrics, planner metrics, dashboard or manual scoreboard, and 14-day reporting.

### Legal/Compliance Owner

Accountable for cookie consent, privacy linkage, tracking consent, logo permissions, testimonials, sustainability claims, partner claims, and warranty wording.

### Backend Architecture Owner

Accountable for Appwrite/Supabase responsibility boundaries, auth/session strategy, planner persistence, quote storage, and provider dependency map.

### Incident Owner

Accountable for rollback procedure, deploy freeze, hotfix routing, incident communication, and launch-day escalation.

## Severity Rules

### Severity 0 - Launch Blocking

Definition: customer-blocking production failure or trust-destroying operational defect.

Examples:

1. Broken login.

2. Broken quote submission.

3. Blank page on launch-critical route.

4. Required production env missing.

5. Raw backend exception visible to customer.

6. Appwrite CORS failure.

7. Missing Appwrite project id in production.

8. Launch-critical route unavailable.

Rule: cannot publicly launch or promote with any open Severity 0 defect.

### Severity 1 - Launch Blocking Unless Waived

Definition: major trust, accessibility, conversion, or mobile usability defect.

Examples:

1. Mobile first-fold CTA collision.

2. Inaccessible primary CTA.

3. Duplicate H1 on conversion page.

4. Critical console error during smoke.

5. Missing core product proof on priority catalogue surface.

6. Unsupported client, partner, sustainability, or warranty claim.

7. Quote path reaches an unmonitored destination.

8. Primary navigation or assistant behavior blocks buyer action.

Rule: must be closed before launch unless launch lead signs a waiver with owner, mitigation, expiry date, and customer risk.

### Severity 2 - Tracked Enhancement

Definition: visible quality or maturity improvement that does not block customer completion.

Examples:

1. Secondary content polish.

2. Deeper product comparison.

3. Expanded planner templates beyond launch minimum.

4. Photography upgrades beyond launch minimum.

5. Extended sustainability storytelling.

Rule: can ship after launch if owner and date are recorded.

## Five-Phase Gate Model

### Phase 1 Gate - Controlled Baseline

Pass criteria:

1. Defect register exists.

2. Launch-critical routes are listed.

3. Evidence baseline exists for desktop and mobile.

4. Observed versus inferred findings are labeled.

5. Daily launch review is scheduled.

Fail condition: defects lack owner, severity, route, evidence, or acceptance checks.

### Phase 2 Gate - Reliability Repaired

Pass criteria:

1. Appwrite public envs verified.

2. Production origin registered in Appwrite.

3. Valid login passes.

4. Invalid login returns controlled error.

5. `/login` has zero critical console errors.

6. Backend dependency map is complete.

Fail condition: CORS failure, missing project id, raw `Failed to fetch`, blank auth page, or unresolved Appwrite/Supabase responsibility for launch-critical behavior.

### Phase 3 Gate - Buyer Entry And Quote Path Ready

Pass criteria:

1. One primary first-viewport action is defined.

2. Mobile first fold has no control collision.

3. Login page hierarchy and contrast pass quick review.

4. Quote captures useful commercial context.

5. Quote reaches monitored destination.

6. Quote failure shows safe fallback.

7. Quote metrics are tracked or manually counted.

Fail condition: overlapped CTA, unreadable first-fold text, broken quote, unmonitored quote destination, or inaccessible conversion path.

### Phase 4 Gate - Proof And Product Readiness

Pass criteria:

1. Priority categories have at least five buyer-grade facts.

2. Meaningful product images have useful alt text.

3. Product route has clear quote or buying action.

4. At least three trust-proof modules are approved.

5. Claims are sourced or removed.

6. Planner entry is written in buyer language.

7. Guest/member value is clear before login prompt.

Fail condition: unsupported trust claim, public internal technology label without explanation, product route looks unfinished, or planner path dead-ends.

### Phase 5 Gate - Launch Control Ready

Pass criteria:

1. 0 Severity 0 defects.

2. 0 unwaived Severity 1 defects.

3. 100% smoke pass.

4. Env validation pass.

5. Login verification pass.

6. Quote verification pass.

7. Desktop and mobile screenshots pass.

8. Rollback procedure is documented.

9. 14-day scoreboard is active.

Fail condition: failed smoke, broken auth, broken quote, missing env, critical console error, unresolved rollback ownership, or unreviewed Severity 1 risk.

## Required Metrics

### Reliability Metrics

1. Route-level smoke pass rate.

2. Critical console error count.

3. Network failure count on launch-critical routes.

4. Env validation pass/fail.

5. Auth success count.

6. Auth failure count by reason.

7. Raw auth-error count.

8. Uptime incident count.

### Conversion Metrics

1. Homepage primary CTA clicks.

2. Product-to-quote movement.

3. Quote starts.

4. Quote completions.

5. Quote validation errors.

6. Quote submission failures.

7. Fallback contact usage.

8. Quote response SLA compliance.

### Product And Content Metrics

1. Priority category completeness score.

2. Product image alt-text defect count.

3. Product first-fold pass/fail.

4. Product route quote CTA visibility.

5. Number of buyer-grade facts per priority category.

### Trust Metrics

1. Approved proof module count.

2. Unsupported claim count.

3. Client-logo approval status.

4. Sustainability claim source status.

5. Partner claim source status.

6. Trust proof engagement count if analytics exists.

### Planner Metrics

1. Planner entry visits.

2. Planner chooser completion.

3. Demo-template opens.

4. Planner starts.

5. Planner-to-quote transitions.

6. Internal first-time-user correct-choice rate.

### Accessibility Metrics

1. Duplicate H1 count on launch-critical routes.

2. Missing meaningful alt text count.

3. Keyboard trap count.

4. Focus-order defects.

5. Contrast defects on conversion pages.

6. Tap-target defects on mobile primary actions.

## Daily Launch Review Format

Cadence: daily until public launch, then daily for 14 days after launch.

Duration: 15 minutes.

Required attendees: launch lead, engineering lead, QA owner, design lead, commercial owner, analytics owner.

Review agenda:

1. Severity 0 count and owner status.

2. Severity 1 count and owner status.

3. Smoke test result.

4. Auth verification result.

5. Quote verification result.

6. Mobile first-fold screenshot status.

7. Product/trust content readiness.

8. Open blockers requiring leadership decision.

9. Rollback or incident concerns.

10. Next 24-hour commitments.

## Launch Waiver Policy

Severity 0 waiver: not allowed.

Severity 1 waiver: allowed only by launch lead.

Required waiver fields:

1. Defect id.

2. Route or surface.

3. Customer risk.

4. Business risk.

5. Mitigation.

6. Owner.

7. Expiry date.

8. Reason launch still proceeds.

Severity 2 waiver: not required, but owner and target date must be recorded.

## Rollback Policy

Rollback triggers:

1. Broken login in production.

2. Broken quote submission in production.

3. Blank page on launch-critical route.

4. Missing required env in production.

5. Raw backend exception visible to customer.

6. Two or more Severity 1 regressions in one release.

7. Failed production smoke after release.

8. First-fold mobile collision on homepage or quote path.

Rollback requirements:

1. Incident owner is named.

2. Backup incident owner is named.

3. Previous stable deployment is identifiable.

4. Rollback command or deployment-console action is documented.

5. Maximum rollback time is recorded.

6. Customer-safe disablement exists for auth, quote, assistant, and planner entry.

## 14-Day Scoreboard

Track daily for 14 days after launch:

1. Severity 0 open count.

2. Severity 1 open count.

3. Smoke pass/fail.

4. Critical console errors.

5. Login attempts and success rate.

6. Auth failures by reason.

7. Quote starts.

8. Quote completions.

9. Quote failures.

10. Fallback contact usage.

11. Product-to-quote movement.

12. Planner starts.

13. Planner-to-quote transitions.

14. Mobile first-fold review after each deploy.

15. Quote response SLA compliance.

16. Rollback or incident events.

## Leadership Reporting Template

Use this summary in every leadership review:

```text
Launch status: Go / No-go / Go with waiver
Severity 0 open: <number>
Severity 1 open: <number>
Smoke status: Pass / Fail
Auth status: Pass / Fail
Quote status: Pass / Fail
Mobile first-fold status: Pass / Fail
Product readiness: Red / Amber / Green
Trust proof readiness: Red / Amber / Green
Monitoring readiness: Red / Amber / Green
Rollback readiness: Pass / Fail
Top blocker: <single most important blocker>
Decision needed: <specific leadership decision>
Next review: <date and time>
```

## Final Sign-Off

Launch sign-off requires these owners to approve or record a specific objection:

1. Launch lead.

2. Engineering lead.

3. QA owner.

4. Design lead.

5. Commercial owner.

6. Sales-operations owner.

7. Analytics owner.

8. Legal/compliance owner.

9. Incident owner.

Go decision is invalid if auth, quote, smoke, env validation, mobile first-fold review, and rollback readiness have not been evidenced.
