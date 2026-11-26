# Pulse Analytics

A reference implementation inspired by Plausible Analytics — a privacy-friendly,
self-hostable website analytics dashboard built with Next.js 16 and MongoDB.

## Features

- **Site management** — create sites with generated tracking IDs and copyable JavaScript snippets; rename and delete sites (cascade removes their events and funnels).
- **Event collection** — public `POST /api/collect` endpoint with zod validation, unknown-site rejection, client event-ID idempotency, CORS and a fixed-window IP rate limit.
- **Aggregations** — visitors, pageviews and event totals; daily time series; top pages, top referrers and device breakdown for 7- or 30-day ranges.
- **Funnels** — ordered event steps with per-step visitor counts, step conversion and overall conversion; single-step funnels supported.
- **Event explorer** — bounded pagination plus name/visitor filters and ascending/descending sort.
- **Dashboards** — overview cards, site analytics with inline SVG bar/line charts, date range selector, responsive cards/tables, loading/empty/error states.
- **Auth** — HTTP-only jose JWT cookie, bcrypt password hashing, guarded route group, duplicate-email handling.

## Stack

Next.js 16.4.6 (App Router, Turbopack), React 19, Tailwind CSS 4, TypeScript,
MongoDB + Mongoose, bcryptjs, jose, zod. No chart library — charts are hand-written SVG.

## Setup

```bash
npm install
cp .env.example .env.local   # adjust values as needed
npm run seed                 # creates analytics_ref with demo data
npm run dev                  # http://localhost:3000
```

The verification and reference port is **3220** (`npm run start -- -p 3220`).

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/analytics_ref` | MongoDB connection string and database name |
| `JWT_SECRET` | development fallback | Secret used to sign session JWTs — set a long random value in production |
| `RATE_LIMIT_MAX` | `120` | Max collected events per IP per window |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate-limit window length in milliseconds |

## Seed

`npm run seed` drops and rebuilds **only** the `analytics_ref` database, so it is
safe to re-run. It creates 2 users, 3 sites, 723 events spread over 30 days (plus
3 orphan events for a deleted site) and 4 funnels, then builds all indexes.

Demo accounts (password `password123`):

| Email | Sites |
| --- | --- |
| `owner@example.com` | Acme Blog (`trk_acme_blog`), Acme Store (`trk_acme_store`) |
| `other@example.com` | Other Co (`trk_other_co`) |

## API

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | no | Register, sets session cookie |
| POST | `/api/auth/login` | no | Log in, sets session cookie |
| POST | `/api/auth/logout` | no | Clear session cookie |
| GET | `/api/auth/me` | no | Current session user or `null` |
| GET | `/api/sites` | yes | List the caller's sites |
| POST | `/api/sites` | yes | Create a site with generated tracking ID |
| GET | `/api/sites/[id]` | yes | Get one owned site plus snippet |
| PATCH | `/api/sites/[id]` | yes | Rename / change domain |
| DELETE | `/api/sites/[id]` | yes | Delete site, events and funnels |
| POST | `/api/collect` | public | Ingest one event (202 new, 200 duplicate) |
| OPTIONS | `/api/collect` | public | CORS preflight |
| GET | `/api/sites/[id]/events` | yes | Paginated/filtered raw events |
| GET | `/api/sites/[id]/analytics?days=7\|30` | yes | Aggregated dashboard data |
| GET | `/api/sites/[id]/funnels?days=7\|30` | yes | Funnels with computed steps |
| POST | `/api/sites/[id]/funnels` | yes | Create a funnel |
| GET | `/api/sites/[id]/funnels/[fid]` | yes | One funnel with results |
| DELETE | `/api/sites/[id]/funnels/[fid]` | yes | Delete a funnel |

## Pages

`/` (redirect), `/login`, `/register`, `/dashboard`, `/sites`, `/sites/[id]`,
`/sites/[id]/events`, `/sites/[id]/funnels`, `/sites/[id]/settings`.

## Local deploy

```bash
npm run build && npm start -- -p 3220
```

Ensure MongoDB is running and `MONGODB_URI` points at a database seeded with
`npm run seed`. Production builds use Turbopack and the `NODE_ENV` cookie `secure`
flag; set a real `JWT_SECRET` and terminate TLS at your proxy.

## Known limitations

- Funnel steps are matched by event name and visitor intersection, not strict chronological sequencing within a single session.
- The rate limiter is in-process and in-memory; a multi-instance deployment needs a shared store such as Redis.
- Analytics are computed on demand from raw events; there is no rollup collection or long-term retention policy.
- `/api/collect` accepts either a tracking ID or a site Object ID; the Object ID form is convenient for testing but less secret than a tracking token.
- The tracking snippet contains a `YOUR_HOST` placeholder that must be replaced before use on a real site.
