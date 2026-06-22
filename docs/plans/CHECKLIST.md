# CSS Cleanup Checklist

Use this checklist while working through the hardcoding cleanup and the follow-on doc updates.

## Before editing

- [ ] Review `results/failures-index.csv` for resolved/pending status, or `results/pending-failures.csv` for pending-only view
- [ ] Confirm the target file already has a nearby CSS home in `app/css/`
- [ ] Decide whether the styling is shared, route-owned, or truly one-off
- [ ] Avoid moving code unless the new CSS location is clear

## During editing

- [ ] Move repeated TSX styling into the nearest shared CSS layer
- [ ] Keep route-specific exceptions local when they do not repeat
- [ ] Update nearby docs when a folder or ownership rule changes
- [ ] Prefer small, reviewable edits over broad rewrites

## After editing

- [ ] Re-read the changed TSX and CSS together
- [ ] Confirm there are no new hardcoded style clusters introduced
- [ ] Regenerate any folder indexes or generated docs that point at the moved files
- [ ] Log blockers or follow-ups in `Failures.md` when something cannot be finished

## Final pass

- [ ] Check that `docs/plans/README.md` still matches the actual plan files
- [ ] Check that `docs/plans/CONTENTS.md` reflects the same structure as the folder
- [ ] Keep the checklist current when the plan changes
