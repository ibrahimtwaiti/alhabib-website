'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'../.github/workflows/alhabib-nightly-r2-backup.yml'),'utf8');
const runbook=fs.readFileSync(path.join(__dirname,'../docs/PRODUCTION-R2-BACKUP.md'),'utf8');

function includes(value,reason){assert.ok(source.includes(value),reason||`Missing required backup gate: ${value}`);}

includes('schedule:', 'nightly schedule is required');
includes("cron: '15 2 * * *'", 'daily schedule required');
includes('workflow_dispatch:', 'manual verification is required');
includes("github.repository == 'ibrahimtwaiti/alhabib-website'", 'must not run from forks');
includes("github.ref == 'refs/heads/main'", 'must never run from pull requests or preview branches');
includes('environment: production-backup', 'use existing approved GitHub environment');
includes('contents: read', 'restrict GitHub token');
includes('NEON_BACKUP_READ_ONLY_URL:', 'dedicated Neon read-only connection secret');
includes("u.username == 'alhabib_backup_reader'", 'must reject admin credential');
includes("u.path == '/alhabib_cms'", 'must use center CMS database');
includes("q.get('sslmode'", 'TLS required for Neon');
includes("postgres:18-alpine", 'Neon runs PostgreSQL 18');
includes('pg_dump', 'must produce a PostgreSQL dump');
includes('--format=custom', 'must be a restorable native dump');
includes('--schema=public', 'must back up all public CMS tables');
includes('alhabib-cms-backups', 'restrict S3 destination to Alhabib bucket');
includes('ALHABIB_R2_DATA_LOCATION_APPROVED', 'require explicit ENAM location approval');
includes('cmp --silent', 'round-trip content verification');
includes('--network none', 'restore test must not reach Production Neon');
includes('pg_restore -U postgres', 'independent recovery drill required');
includes('--clean --if-exists --no-owner --no-acl --exit-on-error', 'PostgreSQL 18 must drop the default public schema before recreating it from the dump');
includes('cleanup() {', 'restore container and temporary dump must be removed');
includes('trap cleanup EXIT', 'cleanup must occur on both success and failure');
assert.ok(!/actions\/upload-artifact@/i.test(source),'never upload unencrypted dumps as GitHub artifacts');
assert.ok(!/\bage\s|\bgpg\s|\bopenssl\s+enc\b/.test(source),'owner disallowed extra file encryption');
assert.ok(!/^\s+pull_request:/m.test(source),'PR must never be a backup trigger');
includes('push:', 'first merged PR triggers the initial backup');
includes('branches: [main]', 'push must not run from development branches');
includes("- '.github/workflows/alhabib-nightly-r2-backup.yml'", 'push must run only when the backup workflow changes');
includes("ALHABIB_R2_DATA_LOCATION_APPROVED: 'true'", 'record approved ENAM location in non-secret workflow config');
assert.ok(!/ALHABIB_R2_DATA_LOCATION_APPROVED: \$\{\{\s*vars\./.test(source),'owner already approved ENAM: no environment variable should be needed');
assert.ok(runbook.includes('production-backup')&&runbook.includes('NEON_BACKUP_READ_ONLY_URL'),'runbook must document GitHub onboarding');
assert.ok(runbook.includes('ENAM')&&runbook.includes('not additionally encrypted'),'runbook must disclose location and lack of extra encryption');
console.log('Backup workflow: branch guard, environment secrets, read-only PostgreSQL 18, private R2, offline recovery, no-extra-encryption rules OK');
