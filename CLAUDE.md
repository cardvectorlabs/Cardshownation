# Claude Workflow Tree

Use this file as the Claude-facing entry point for Card Show Nation. The canonical repo workflow is mirrored here so Claude and Codex operate from the same map.

## Core Approach

- Start at the repo root.
- Prefer fixture mode unless the task explicitly requires live database behavior.
- Keep changes close to the owning module and avoid touching unrelated local work.
- Validate with the smallest relevant command before running a full build.

## Workflow Tree

```text
root
|- 1. Identify the task type
|  |- UI/page work -> apps/web/app + apps/web/components
|  |- Public data/filtering -> apps/web/lib/shows.ts + app/api/shows
|  |- Admin/review flow -> apps/web/app/admin + apps/web/lib/submissions.ts
|  |- Import/automation -> app/admin/import* + lib/eventbrite.ts + packages/db/prisma
|  |- Schema/data model -> packages/db/prisma/schema.prisma + seed.ts
|  |- Tooling/CI -> package.json + turbo.json + .github/workflows
|- 2. Pick the safe execution path
|  |- Fixture path -> keep CSN_DATA_MODE=fixture and test with fixture JSON stores
|  |- Live DB path -> confirm env vars, then run Prisma commands only when needed
|- 3. Implement
|  |- Update the narrowest responsible files first
|  |- Check adjacent middleware/server actions for auth or admin changes
|- 4. Validate
|  |- npm run lint for tooling and static checks
|  |- npm run build for app changes
|  |- npm run db:generate when Prisma types/schema change
|- 5. Report
   |- State what changed
   |- Note required env vars, migrations, or manual follow-up
```

## Coordination With Codex

- `AGENTS.md` is the matching Codex-facing document.
- If both agents touch the same task, split ownership by module boundaries from the tree above.
- Keep shared conclusions anchored to repo paths, not high-level abstractions.
