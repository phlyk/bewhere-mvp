# BeWhere MVP - Critical Fix Tasks

> These tasks must be completed to get the MVP into working order.
> All tasks require **verification** before marking complete.

## Priority 1: Build Errors (Nothing Runs)

### ETL TypeScript Errors
- [ ] F1.1 Fix `etl/src/config/database.ts` - TypeScript errors with DataSourceOptions type
- [ ] F1.2 Fix `etl/src/utils/index.ts` - Duplicate export of `aggregateMonthlyToYearly`
- [ ] F1.3 Fix `etl/src/utils/report-formatter.ts` - Duplicate object literal properties (lines 179-212)
- [ ] F1.4 Fix `etl/src/utils/etl-run-logger.spec.ts` - Object possibly undefined error (line 579)
- [ ] F1.5 Verify ETL builds: `cd etl && npm run build` must succeed

### Frontend Syntax Errors
- [ ] F1.6 Fix any remaining JSX/TSX syntax errors in `web/src/components/`
- [ ] F1.7 Verify frontend builds: `cd web && npm run build` must succeed

### API Build Verification
- [ ] F1.8 Verify API builds: `cd api && npm run build` must succeed

## Priority 2: Database Migrations (API 500 Errors)

- [ ] F2.1 Add migration run command to API startup (or create migration script)
- [ ] F2.2 Ensure migrations run before API starts accepting requests
- [ ] F2.3 Verify all 8 migrations run successfully:
  - CreateAdministrativeAreas
  - CreatePopulation
  - CreateCrimeCategories
  - CreateDataSources
  - CreateCrimeObservations
  - CreateCategoryMappings
  - CreateEtlRuns
  - SeedCrimeCategories
- [ ] F2.4 Verify API endpoints return 200 (not 500) after migrations

## Priority 3: Docker Compose Integration

- [ ] F3.1 ETL Docker container builds successfully
- [ ] F3.2 API Docker container builds and runs migrations on startup
- [ ] F3.3 Full `docker compose up` starts all services without errors
- [ ] F3.4 Verify `docker compose run --rm etl npm run etl:all` works

## Priority 4: End-to-End Verification

- [ ] F4.1 API health check returns 200: `curl http://localhost:3000/health`
- [ ] F4.2 Areas endpoint works: `curl http://localhost:3000/areas`
- [ ] F4.3 Categories endpoint works: `curl http://localhost:3000/categories`
- [ ] F4.4 Frontend dev server starts: `cd web && npm run dev`
- [ ] F4.5 Frontend loads in browser without console errors
- [ ] F4.6 Map renders with département boundaries

## Priority 5: Run Actual Tests

- [ ] F5.1 Run API unit tests: `cd api && npm test`
- [ ] F5.2 Run ETL unit tests: `cd etl && npm test`
- [ ] F5.3 Run frontend unit tests: `cd web && npm test` (if any)
- [ ] F5.4 Run Playwright e2e tests (requires working full-stack)

---

## Verification Checklist (Per Task)

Each subagent MUST complete these steps before marking a task done:

1. ✅ Code changes made
2. ✅ TypeScript compiles without errors (`npx tsc --noEmit`)
3. ✅ Relevant tests pass (if applicable)
4. ✅ Manual verification performed (curl, browser, etc.)
5. ✅ Changes committed with descriptive message
