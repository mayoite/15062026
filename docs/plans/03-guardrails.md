# Phase 3 - Guardrails and Drift Checks

## Goal

Keep the cleanup from regressing by making the docs and inventories regenerate cleanly.

## Scope

- Keep `npm run docs:sync:all` as the normal regeneration command
- Keep `docs/plans/` as the canonical plan docs folder
- Add or maintain checks that warn when generated docs or inventories drift
- Refresh generated outputs whenever the canonical folders move

## Exit Criteria

- Docs and inventories can be regenerated in one command
- Old path references are easy to spot and hard to reintroduce
- The repo keeps a single source of truth for plans and documentation

