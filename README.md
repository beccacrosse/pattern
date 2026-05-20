# Pattern

Single-user web app to track **Instagram post engagement** from CSV imports, with Supabase storage and a path to **Instagram Graph API** sync.

## Features

- **Magic link auth** (Supabase) with optional **`OWNER_EMAIL`** gate for a single allowed account.
- **CSV import** with auto-detected column mapping, preview, validation, and **idempotent upserts** (`posts`, `post_metrics_daily`, `import_jobs` logs).
- **Dashboard**: KPIs, daily engagement rate chart (Recharts), sortable posts table, date range + media type filters.
- **Settings**: engagement denominator (`impressions`, `reach`, or `impressions_then_reach`), Instagram integration placeholders.
- **Phase 2 hooks**: `DataSourceAdapter`, cron route skeleton, Meta webhook verification placeholder, `sync_job_logs`.

## Engagement rate

\[
\text{ER} = \frac{\text{likes} + \text{comments} + \text{saves} + \text{shares}}{\text{denominator}}
\]

Denominator is chosen in **Settings** (see in-app copy for fallback rules). KPI “Engagement rate” uses **weighted** totals: \(\sum\) engagements ÷ \(\sum\) denominator logic applied to summed impressions/reach (same preference as daily trend buckets).

## Supabase setup

1. Create a Supabase project.
2. Run the SQL migration: copy [`supabase/migrations/20250505120000_init.sql`](supabase/migrations/20250505120000_init.sql) into the SQL editor and execute (or use the Supabase CLI: `supabase db push`).
3. **Authentication → Providers → Email**: enable email + magic link.  
   **Authentication → URL configuration**: add site URL `http://localhost:3000` and redirect URL `http://localhost:3000/auth/callback` (plus production URLs when deployed).

## Environment

Copy [`.env.example`](.env.example) to `.env.local` and fill values:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `OWNER_EMAIL` | Optional; if set, only this email may use the app after login |
| `CRON_SECRET` | Protects `GET /api/cron/instagram-sync` (`Authorization: Bearer …`) |
| `META_WEBHOOK_VERIFY_TOKEN` | Optional; Meta webhook challenge for `GET /api/webhooks/instagram` |

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in, then **Import** [`public/sample-metrics.csv`](public/sample-metrics.csv) to seed demo metrics.

```bash
npm test        # Vitest (parsing + engagement math)
npm run build   # Production build
```

## Large CSV uploads

Server Actions default body limit is **1MB**. For larger files, split CSVs or host an Edge Function / API route with a higher limit and stream parsing.

## Deploy (Vercel + Supabase)

1. Push the repo to GitHub and import into [Vercel](https://vercel.com).
2. Set the same env vars in Vercel (use production Supabase URL + anon key).
3. Add production redirect URLs in Supabase Auth settings.
4. Optional: [`vercel.json`](vercel.json) defines a daily cron hitting `/api/cron/instagram-sync`. Set **`CRON_SECRET`** in Vercel; scheduled invocations use `Authorization: Bearer <CRON_SECRET>` when configured as a secured cron (see [Vercel Cron](https://vercel.com/docs/cron-jobs)). The handler currently logs a stub sync (Graph API not wired yet).

## Project layout (high level)

| Path | Role |
|------|------|
| [`app/(dashboard)/page.tsx`](app/(dashboard)/page.tsx) | Dashboard |
| [`app/(dashboard)/import/page.tsx`](app/(dashboard)/import/page.tsx) | CSV import + job history |
| [`app/(dashboard)/settings/page.tsx`](app/(dashboard)/settings/page.tsx) | Preferences + API placeholders |
| [`lib/import/csvParser.ts`](lib/import/csvParser.ts) | CSV parsing + mapping |
| [`lib/import/upsertMetrics.ts`](lib/import/upsertMetrics.ts) | DB upserts |
| [`lib/analytics/engagement.ts`](lib/analytics/engagement.ts) | Engagement math |
| [`lib/data-sources/types.ts`](lib/data-sources/types.ts) | `DataSourceAdapter` |
| [`middleware.ts`](middleware.ts) | Session refresh + auth + owner gate |

## License

Private / your repo — adjust as needed.
