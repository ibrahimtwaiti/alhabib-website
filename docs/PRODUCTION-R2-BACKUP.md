# Center Alhabib — PostgreSQL 18 → private Cloudflare R2 backup

## Scope and safety

- Repository: `ibrahimtwaiti/alhabib-website` (no separate repository).
- Environment: **`production-backup`** (matches the environment created by the owner).
- Source: dedicated production Neon project `gentle-dream-44222221`, branch `br-divine-block-bespzy6v`, database `alhabib_cms`.
- Dedicated database role: **`alhabib_backup_reader`**, created with Neon `read_only` access to `public` in `alhabib_cms`; verified `SELECT=true`, `INSERT/UPDATE/DELETE=false`.
- Destination: private R2 bucket `alhabib-cms-backups`, location **ENAM** (North America). Public `r2.dev` endpoint disabled when last checked.
- The dump is **not additionally encrypted by our workflow** per owner's instructions. It is a standard PostgreSQL custom-format `.pgdump` file. Cloudflare automatically encrypts R2 objects at rest; TLS is used for transfer. Anyone with bucket read access may download a legible dump, including administrator password hashes and CMS records.
- Never log database URLs, passwords, CMS JSON, or the dump, and never upload the dump as a GitHub Actions artifact.

## One-time owner setup (REQUIRED before first real backup)

GitHub → `alhabib-website` → Settings → Environments → **production-backup**:

**Environment secrets:**

| Key | Source |
| --- | --- |
| `ALHABIB_R2_ACCESS_KEY_ID` | Cloudflare R2 API token Access Key ID |
| `ALHABIB_R2_SECRET_ACCESS_KEY` | Cloudflare R2 API token Secret Access Key |
| `ALHABIB_R2_ACCOUNT_ID` | Cloudflare Account ID |
| **`NEON_BACKUP_READ_ONLY_URL`** | Neon Connect → production branch → `alhabib_cms` database → `alhabib_backup_reader` role → PostgreSQL connection URI, including `sslmode=require` |

The first three R2 environment secrets have been supplied by the owner. **GitHub's available connector cannot write or verify environment secrets.** The Neon URI must be entered by the owner directly in GitHub. Do not paste it into this repository, issue, PR, Actions logs, or a chat.

**ENAM location authorization — confirmed by the owner:** The owner explicitly approved storing Alhabib CMS backup files in Cloudflare R2's **ENAM / North America** region on **14 November 2026**. This approval is encoded as the non-secret job configuration `ALHABIB_R2_DATA_LOCATION_APPROVED: 'true'`. **No GitHub Environment variable is needed.** Changing the destination region or revoking approval requires reviewing and updating the workflow through a protected Pull Request. The configured storage location is not presumed to satisfy any otherwise-applicable medical-data transfer or privacy requirements; assess those separately.

Recommended environment **Deployment branches and tags** restriction: `main` only. The job independently enforces `github.repository` and `github.ref == refs/heads/main`. Leave **Required reviewers** disabled when operating as sole maintainer.

## Run and verify

1. Inspect the reviewed workflow under `.github/workflows/alhabib-nightly-r2-backup.yml`, and merge the reviewed PR only when the pre-release conditions are satisfied. Editing workflow files is subject to GitHub's `main` ruleset and required `verify` / `browser` jobs.
2. **First automatic run:** the first merge to `main` that adds or changes `.github/workflows/alhabib-nightly-r2-backup.yml` triggers a single backup through its narrowly scoped `push` path filter. Future backups use the nightly schedule. For an additional manual run, open GitHub → Actions → **Alhabib CMS - nightly private R2 backup** → **Run workflow**, select `main`.
3. Check the `production-backup` job summary for a private object path, size, SHA-256, verified byte-for-byte R2 download and successful restore into a **temporary, network-disconnected PostgreSQL 18 Docker container**. This tests a real dump → R2 → download → independent restore path without touching Neon production.
4. In Cloudflare R2 confirm the object under `alhabib-cms-backups/daily/` is stored privately. The job **must not** publish its dump as an Actions artifact.
5. Check the next scheduled run: `15 2 * * *` is **02:15 UTC / 05:15 Saudi time**. Scheduled GitHub Actions can start late and may be delayed or dropped during high load; monitor failures.

Each backup has a unique timestamp + GitHub run ID. Existing backups are never overwritten by this workflow. **Automatic retention/deletion is not configured**; agree and apply a retention policy only after a successful restoration drill and a data-retention decision.

## Recovery guidance

- The job exercises full `pg_restore` **only inside a disposable, network-isolated local PostgreSQL 18 instance**, never against Neon production.
- PostgreSQL 18's template database already includes the `public` schema. Restore uses `--clean --if-exists` **inside the disposable local test container only** so the archive can recreate its own `public` schema. The first backup run on 13 November 2026 uploaded and re-downloaded the dump correctly but exposed this restore-only issue; a corrective PR and fresh verified run are required before declaring the drill successful.
- For a real incident, create a **separate** Neon recovery branch/database. Restore there first, inspect structure and CMS version, verify records, and get an explicit go/no-go before any production cutover.
- Do **not** call Neon snapshot restore with an implicit finalization or switch production branch/compute in order to test recovery.
- A GitHub workflow/code rollback does not restore Neon database state; keep these independent.
- Revoke the Cloudflare key and replace the GitHub environment secrets immediately if a credential is exposed. The dump is not additionally encrypted, so a leaked R2 read key exposes readable backups.

## Release gates

- [x] Production database read-only account created and verified through Neon.
- [x] R2 bucket exists with public access disabled; role-specific R2 credentials entered by owner (their operation still needs testing).
- [x] `main` GitHub ruleset with solo-maintainer PR checks configured.
- [x] Vercel WAF and separate Preview Neon credentials configured earlier.
- [x] `NEON_BACKUP_READ_ONLY_URL` is visible by name under `production-backup` Environment secrets in the owner's screenshot; the value is deliberately unreadable and must still be runtime-validated.
- [x] ENAM location explicitly approved by owner on 14 November 2026 and recorded as a non-secret workflow configuration.
- [ ] Workflow successfully builds/dumps, uploads, byte-compares and restores on GitHub Actions.
- [ ] Production release/merge separately approved once all release checks pass.

No real backup has been completed until the GitHub Actions job is green and the R2 object is independently confirmed.
