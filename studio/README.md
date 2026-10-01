# Sanity Studio

Hosted separately from the site (or at `/studio` via Sanity's hosting). Requires a Sanity project.

```bash
cd studio
npm install
SANITY_STUDIO_PROJECT_ID=xxxx npm run dev      # local Studio at http://localhost:3333
SANITY_STUDIO_PROJECT_ID=xxxx npm run deploy   # hosts at https://<name>.sanity.studio
```

## Seeding content

From the repo root: `npm run seed:ndjson` writes `seed.ndjson` from `src/content/seed`. Then `npm run import` here imports it into the `production` dataset.

## Jobs approval flow

1. New submissions arrive with `status: pending` under **Jobs → Pending jobs**.
2. Use **Approve and publish** (sets `datePosted`, `approvedAt`, default `validThrough` +60 days) or **Reject** (optional reason).
3. A Sanity webhook (Manage → API → Webhooks) posts to `https://<site>/api/revalidate` with header `x-revalidate-secret`, filter `_type == "job"`, projection
   `{ _type, status, "slug": slug.current, title, submitterEmail, contactName, rejectReason }`.
   The site emails the studio and triggers the Vercel deploy hook.
4. The daily cron at `/api/cron/expire-jobs` expires roles past `validThrough` and emails a renew link 7 days before.

Approve only genuine roles at real studios.
