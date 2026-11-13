# Alhabib â€” Phase 1 security & stability (13 November 2026)

## Release scope

Changes are on a development branch. No production merge, deployment, database DDL, secrets, or destructive data changes are authorized here. CI uses Node 26 to match Vercel runtime and a committed npm lockfile with npm ci --legacy-peer-deps. The peer flag is retained until compatibility can be verified.

## CSRF and login security

Unsafe requests must have a same-origin Origin. Cross-site Sec-Fetch-Site is rejected, and missing Origin fails closed. The application accepts HTTP only on localhost/127.0.0.1 for development and isolated QA. API automation must send an appropriate Origin. Admin login only accepts JSON, with a maximum body of 4 KiB. The existing persisted lockout after five failed attempts is regression-tested. This is NOT a distributed IP rate limiter; configure Vercel WAF rate limits before claiming complete brute-force defense.

## Preview isolation

Preview CMS writing requires V3_PREVIEW_DATABASE_URL, a distinct Neon hostname from Preview DATABASE_URL, and a non-secret ALHABIB_PRODUCTION_DATABASE_HOST. If the guard is missing, writes fail closed. The production endpoint hostname must be set by an administrator in Vercel Preview environment. Never store credentials in source control. This is a defense-in-depth check; real isolation also depends on a separate Neon branch and least-privilege credentials.

## Neon backup limits and incident

On 13 November 2026 Neon rejected creatio¶»§q«^