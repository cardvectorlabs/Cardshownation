# Card Show Nation

Card Show Nation is a mobile-first card show directory for collectors, vendors, and promoters.

## Local testing

The web app now supports a fixture mode for local testing without Postgres.

1. From the repo root, run `npm install` if needed.
2. Start the app with `npm run dev`.
3. Open `http://localhost:3000`.

Fixture mode is enabled in [apps/web/.env.local](./apps/web/.env.local) with:

```env
CSN_DATA_MODE="fixture"
```

In fixture mode:

- Public pages use built-in sample show data.
- New submissions are saved to [apps/web/data/fixture-submissions.json](./apps/web/data/fixture-submissions.json).
- Approved fixture submissions create local shows in [apps/web/data/fixture-local-shows.json](./apps/web/data/fixture-local-shows.json).
- The header shows a `Fixture Mode` badge so you know the app is not using live production data.

## Live database mode

When you are ready to switch to a real database:

1. Replace `DATABASE_URL` in `apps/web/.env.local` with a real Postgres connection string.
2. Remove or change `CSN_DATA_MODE`.
3. Run:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

Then start the app normally with `npm run dev`.
