# Release resource QA summary

Generated for the 2026-08-30 release-blocker correction. This audit is read-only; it does not delete or infer provider data.

## Before correction

- Resources inspected: 265
- Treatment records inspected: 370
- Resource issues: 0
- Treatment issues: 448
- Records claiming private insurance: 356 of 370 (96.216%)
- Confirmed sober-living price corruption: `$2`, `$2`, and `$3` instead of `$2,575`, `$2,500`, and `$3,000`

## After correction in a disposable PostgreSQL database

- Resources inspected: 265
- Treatment records inspected: 370
- Resource issues: 0
- Treatment issues retained for human review: 19
- Records claiming private insurance: 19 of 370 (5.135%)
- Sober-living price corruption found: 0
- Unverified sober-living insurance assumptions found: 0

The remaining 19 records are non-sober-living treatment entries with unverified insurance claims. The release UI does not display those claims unless the record is verified, and the QA command continues to surface them for later source verification.

## Repeatable checks

- `pnpm audit:resource-quality`
- `pnpm audit:resource-quality -- --details`
- `pnpm repair:sober-living-import` (dry run)
- `pnpm repair:sober-living-import -- --apply` (explicit write)
