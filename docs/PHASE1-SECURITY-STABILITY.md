# Alhabib — Phase 1 security & stability (13 November 2026)

## Release scope

Changes are on a development branch. No production merge, deployment, database DDL, secrets, or destructive data changes are authorized here. CI uses Node 26 to match Vercel runtime and a committed npm lockfile with npm ci --legacy-peer-deps. The peer flag is retained until compatibility can be verified.

## CSRF and login security

Unsafe requests must have a same-origin Origin. Cross-site Sec-Fetch-Site is rejected, and missing Origin fails closed. The application accepts HTTP only on localhost/127.0.0.1 for development and isolated QA. API automation must send an appropriate Origin. Admin login only accepts JSON, with a maximum body of 4 KiB. The existing persisted lockout after five failed attempts is regression-tested. This is NOT a distributed IP rate limiter; configure Vercel WAF rate limits before claiming complete brute-force defense.

## Preview isolation

Preview CMS writing requires V3_PREVIEW_DATABASE_URL, a distinct Neon hostname from Preview DATABASE_URL, and a non-secret ALHABIB_PRODUCTION_DATABASE_HOST. If the guard is missing, writes fail closed. The production endpoint hostname must be set by an administrator in Vercel Preview environment. Never store credentials in source control. This is a defense-in-depth check; real isolation also depends on a separate Neon branch and least-privilege credentials.

## Neon backup limits and incident

On 13 November 2026 Neon rejected creation of a second manual snapshot: snapshots limit exceeded. The existing snapshot restore action unexpectedly finalized into the original default branch and moved the Production compute. The incident was reversed: original production branch is again the default and its original compute endpoint was reassigned, and CMS version 64 with ten specialists and seven specialties was re-verified. A restored copy from the older snapshot remains as the separate non-default branch the isolated test branch. No old snapshot or production content was intentionally deleted.

Never call restore_snapshot with its default finalization just to test restore. Use an independently isolated Neon test project, or only a workflow explicitly documented and proven NOT to transfer the production compute. Finalization or branch switching requires separate release approval.

Daily/weekly automatic snapshot scheduling is NOT active due to the snapshot quota. Next steps: upgrade Neon snapshot capacity or implement encrypted, independently retained off-site backups with a tested runbook. Do not overwrite the existing manual snapshot before a reliable alternative exists.

## Before merge and deployment

Verify required branch rules and successful PR checks; test login/logout and CMS writes on a genuinely isolated Preview; check the Neon production default branch and compute endpoint; validate backup restore policy; obtain explicit production deployment authorization. Roll back code changes through reviewed PRs, not through production database snapshot finalize.
