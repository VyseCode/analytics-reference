# PLAN — Analytics dashboard reference implementation

Stack: Next.js 16.4.6 App Router, React 19, Tailwind 4, TypeScript, MongoDB + Mongoose,
bcryptjs, jose JWT in HTTP-only cookie, zod. Port 3220, DB `analytics_ref`.

## Models & indexes
- **User**: name, email(unique, lowercase), password(select:false), timestamps. Index: `{email:1} unique`.
- **Site**: owner(ref User), name, domain, trackingId (unique generated public token), timestamps.
  Indexes: `{trackingId:1} unique`, `{owner:1,createdAt:-1}`.
- **Event**: site(ref Site), name, visitorId, url, referrer, eventId (client idempotency key),
  device{browser,os,type}, createdAt. Indexes: `{site:1,createdAt:-1}`, `{site:1,eventId:1} unique`,
  `{site:1,name:1,createdAt:-1}`, `{site:1,url:1}`, `{site:1,referrer:1}`.
- **Funnel**: site(ref Site), name, steps:[string] (ordered), createdBy, timestamps. Index: `{site:1,createdAt:-1}`.

## API endpoints
Auth: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
Sites (auth): `GET|POST /api/sites`, `GET|PATCH|DELETE /api/sites/[id]`.
Public ingest: `POST /api/collect` (validate, unknown site 404, duplicate eventId idempotent, in-memory rate limit 429).
Discovery: `GET /api/sites/[id]/events` (pagination limit/cursor-ish offset, filters name/visitor, sort by createdAt).
Core analytics: `GET /api/sites/[id]/analytics?days=7|30` (visitors, pageviews, events, timeseries,
topPages, topReferrers, deviceBreakdown) — empty ranges return zeros.
Funnels (auth): `GET|POST /api/sites/[id]/funnels`, `GET|DELETE /api/sites/[id]/funnels/[fid]` (GET includes step counts + conversion).

## Pages
Public: `/` (redirect), `/login`, `/register`.
Protected group `(app)` with session-guarding layout: `/dashboard`, `/sites`, `/sites/[id]`,
`/sites/[id]/funnels`, `/sites/[id]/settings`. Plus `loading.tsx`, `error.tsx`, `not-found.tsx`.

## Ordered feature slices
1. **Auth** — User model, auth API, guarded layout, login/register pages.
2. **Sites CRUD** (primary CRUD) — create/list/read/update/delete with ownership + generated snippet.
3. **Event discovery** — paginated filtered event explorer endpoint + table.
4. **Ingestion** (core workflow) — `/api/collect` validation, idempotency, rate limit, deleted-site rejection.
5. **Aggregations** (core workflow) — analytics endpoint + dashboard charts.
6. **Funnels** (engagement) — CRUD + step counts/conversion.
7. **Dashboards/UI precision** — overview, site analytics with SVG bar/line charts, date range selector,
   settings/snippet copy, responsive cards/tables, loading/empty/error states.

## Edge cases
Unknown site 404 · malformed event 400 · duplicate eventId idempotent · events for deleted site rejected/404
(cascade delete removes events+funnels) · empty ranges → zeros/empty state · one-step funnel (100% conversion)
· cross-site leakage prevented by ownership checks on every authenticated route and site-scoped queries ·
rate limit 429.

## Seed dataset
Users: `owner@example.com` + `other@example.com` (both `password123`, bcrypt). Sites: 2 owned by owner,
1 by other. Events across last 30 days (pageview/signup/purchase/custom), several visitors, referrers
(google.com/twitter.com/direct), devices (desktop/mobile/tablet), plus orphan events for a deleted site.
Funnels: 3-step `pageview→signup→purchase` and 1-step `pageview`. Re-runnable, wipes only `analytics_ref`.

## UI design tokens
Single accent `#4f46e5` (indigo-600); slate neutrals; system font stack; `rounded-xl` cards with
`border-slate-200` + subtle shadow; spacing via Tailwind 4/6 scale; heading `text-3xl`, labels `text-sm`;
focus rings `ring-accent/30`; responsive `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`; inline SVG charts.
