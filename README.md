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

## Google Tracking

Set these env vars in `apps/web/.env.local` (and your production environment) to enable Google tracking:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
NEXT_PUBLIC_GOOGLE_ADS_ID="AW-XXXXXXXXX"
NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID="ca-pub-8982218628461022"
NEXT_PUBLIC_AD_SLOT_HOME_INLINE="1234567890"
NEXT_PUBLIC_AD_SLOT_SHOW_SIDEBAR="0987654321"
```

- `NEXT_PUBLIC_GA_MEASUREMENT_ID` enables GA4 page tracking.
- `NEXT_PUBLIC_GOOGLE_ADS_ID` enables Google Ads global site tag support.
- `NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID` sets the AdSense publisher ID used by ad slots.
- `NEXT_PUBLIC_AD_SLOT_HOME_INLINE` renders a single in-content ad on the homepage.
- `NEXT_PUBLIC_AD_SLOT_SHOW_SIDEBAR` renders a sidebar ad on show detail pages.

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
