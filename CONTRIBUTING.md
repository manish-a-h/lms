# Contributing to LMS

## Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/<short-description>` | `feat/leave-apply-form` |
| Bug fix | `fix/<short-description>` | `fix/balance-calculation` |
| Chore / docs | `chore/<short-description>` | `chore/update-readme` |
| Testing | `test/<short-description>` | `test/leave-unit-tests` |

## Commit Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):


**Allowed types:** `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `style`, `perf`

## Pull Request Rules

1. Branch from `main`
2. PR title must follow the commit format above
3. All CI checks (lint, typecheck, test, build) must pass before merging
4. At least **one reviewer approval** is required
5. Squash commits when merging feature branches
6. Keep PRs focused — one feature or fix per PR
7. Add or update tests for any new logic you introduce

## Before Opening a PR — Local Checklist

- [ ] `npm run lint` passes with no errors
- [ ] `npx tsc --noEmit` passes with no type errors
- [ ] `npm test` passes
- [ ] Tested manually at mobile (375px) and desktop (1280px)
- [ ] New environment variables added to `.env.example`
- [ ] Prisma schema changes have a migration file committed

## Database Backup (Production)

**Backup:**
```bash
pg_dump -U postgres -d lms_db -F c -f backup_$(date +%Y%m%d).dump
```

**Restore:**
```bash
pg_restore -U postgres -d lms_db -F c backup_20260407.dump
```

Schedule daily automated backups via your hosting provider or a cron job.

## Deployment Notes

- Never run `prisma migrate dev` in production — use `prisma migrate deploy` instead
- Always set `NODE_ENV=production` on the server
- Keep `.env` out of version control — only `.env.example` is committed