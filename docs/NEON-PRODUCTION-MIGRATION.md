# Dedicated Neon production CMS migration — 2026-11-09

## Safety invariant
- The original Vercel Marketplace `DATABASE_URL` and `POSTGRES_URL` remain unchanged as rollback sources.
- The new independently owned Neon project has database `alhabib_cms` on its `production` branch.
- `ALHABIB_NEXT_DATABASE_URL` is a Vercel **Production-only sensitive** variable. It is not a credential to publish, print, or commit.
- Migration copies the **whole** existing CMS JSONB row: admins/password hashes (never exposed to browser), editorial content, revisions and activity log. It does not reset an admin account.
- `lib/cms-migration.ts` copies only when the source version exceeds the copied version; it never modifies the original database.
- Migration endpoint `/api/system/neon-readiness` returns only `ready: true/false`; it verifies exact JSONB payload and source/target version without exposing content.
- Moving the official CMS to an empty database is explicitly blocked.

## Verified cutover sequence
1. Deploy shadow-migration code with `ALHABIB_NEXT_DATABASE_URL` set, keeping the original DATABASE_URL authoritative.
2. Confirm `/api/system/neon-readiness` returns `ready: true`, and verify that the destination contains the same admin and table rows.
3. Set `ALHABIB_CMS_READ_ONLY=1` in the **Production** Vercel environment and deploy. This briefly freezes edits/uploads while visitors can still view the site.
4. Reconfirm readiness after the lock has reached production.
5. Set `ALHABIB_PRIMARY_DATABASE_URL` (Production-only sensitive) to the new target connection string, keeping `ALHABIB_CMS_READ_ONLY=1`, and deploy. This selects the new dedicated Neon CMS.
6. Validate the official production deployment ID/commit, public site, auth and data without changing live records. The CMS will refuse to initialize if the new DB is empty.
7. Change `ALHABIB_CMS_READ_ONLY=0` and redeploy only after readiness and rollout checks. Re-test a disposable article create/edit/delete as a signed-in super admin.
8. Keep the source Neon snapshot as a temporary **read-only rollback copy**. After the cutover, edits to the new destination must not be overwritten by replaying the old source. Any rollback needs a planned data reconciliation.

## Remaining architectural growth considerations
The CMS is currently one optimistic-version JSONB snapshot in Postgres. A separate database improves isolation and makes backups/rollbacks more controlled; it **does not alone provide unlimited editorial capacity**. Recommended later: normalized relational tables, indexed article pagination, object-based media storage, and scheduled backups/monitoring. Avoid claiming that the database switch solves pagination or storage quotas.
