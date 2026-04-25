# Agent Workflow Tree

This repo is a Turbo monorepo with one Next.js app in `apps/web` and one Prisma package in `packages/db`.

## Shared Rules

- Start from the repo root and run validation there unless a workspace-only command is needed.
- Preserve any existing local changes, especially unrelated user work.
- Prefer fixture mode first. Live database work should only happen when the task explicitly needs it.
- Validate every code change with the smallest relevant command, then use `npm run build` before closing larger work.

## Repo Map

- `apps/web/app`: routes, admin pages, API routes, metadata.
- `apps/web/components`: reusable UI.
- `apps/web/lib`: data access, fixture store, imports, geo helpers, utilities.
- `packages/db/prisma`: schema, seed, and import utilities.
- `.github/workflows`: CI jobs.

## Workflow Tree

```text
root
|- 1. Classify the request
|  |- UI or page copy -> apps/web/app + apps/web/components
|  |- Public show data/filtering -> apps/web/lib/shows.ts + app/api/shows
|  |- Admin review/publish flow -> apps/web/app/admin + apps/web/lib/submissions.ts
|  |- Imports/automation -> app/admin/import* + lib/eventbrite.ts + packages/db/prisma
|  |- Schema/data model -> packages/db/prisma/schema.prisma + seed.ts
|  |- Tooling/CI -> package.json + turbo.json + .github/workflows
|- 2. Choose the execution path
|  |- Fixture-safe path
|  |  |- Keep CSN_DATA_MODE=fixture
|  |  |- Use fixture JSON stores for local flow testing
|  |- Live DB path
|  |  |- Confirm DATABASE_URL and related env vars exist
|  |  |- Run db generate/push/migrate only if the task truly needs database changes
|- 3. Make the change
|  |- Keep edits close to the owning module
|  |- Avoid cross-cutting refactors unless the task requires them
|  |- For admin/auth changes, check middleware plus the matching server action/page
|- 4. Validate
|  |- Tooling changes -> npm run lint
|  |- App/runtime changes -> npm run build
|  |- Schema changes -> npm run db:generate and then app build if code imports Prisma types
|- 5. Close out
   |- Summarize user-visible impact
   |- Call out env vars, migrations, or manual follow-up if required
```

## Codex Notes

- Default to direct implementation after enough context is gathered.
- Prefer narrow patches and immediate validation over long planning.
- When a task spans admin, imports, and schema layers, verify the full path from route/action to storage.

## Claude Notes

- Begin larger tasks with a short execution plan before editing.
- Use the same ownership map above to keep reasoning grounded in repo structure.
- After analysis, converge quickly into concrete edits or explicit findings instead of restating context.
