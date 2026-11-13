# Approved visual baseline — Alhabib V3

## Intent
The old V1 bundled photos and legacy specialty_visuals fallback must never replace a newly approved image. Latest approved visuals and ten current specialist image references from the production CMS (version 64, 2026-11-08) are committed as a seed manifest in lib/visual-baseline.ts. This is only an asset-reference inventory, not a backup of the image bytes themselves.

The super admin panel can:
- اعتماد الحالة الحالية كافتراضية: atomically replace the old visual-default manifest in Neon with the currently selected public visuals, specialist photo URLs/cropping, and specialty image/icon values.
- استعادة النسخة الافتراضية: atomically restore only those media and crop/icon properties. It never reverts names, biographies, schedules, accounts, or other site settings.

Individual افتراضي controls now remove overrides and render from the approved baseline. Old specialty_visuals and old built-in hero image are not restoration sources. Only the latest visual_baseline_v1 entry is treated as approved default.

## Safety and retention
- Media uploads use immutable UUID-based private Blob paths. Never delete underlying Blob objects while any current or approved manifest refers to them.
- Do not purge unrelated revisions, user data, or all V1 assets just to reset defaults. This requires separate reference audit and backup.
- The manifest is a fallback if no CMS snapshot exists; subsequent approvals replace the snapshot in one optimistic transaction.
- Public URL links can disappear; for offline recovery, independently back up image bytes and verify media URL availability.
- Preview write safety still depends on properly isolated Neon/Blob credentials; this change does not alter sessions.

## Verification
Run npm run test:visual-baseline, npm run lint, npm run build, npm run test:browser, and HTTP smoke checks. Verify approved hero/photos on the production site before production deployment.
