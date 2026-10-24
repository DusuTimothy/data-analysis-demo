# Plateau Campaign Analytics

Internal analytics dashboard for an APC candidate contesting the Plateau Senatorial District seat in the 2027 general election. It aggregates field activity — rallies, door-to-door canvassing, town halls, market outreach, radio, social media, and billboards — into contacts reached, spend, and cost per contact by LGA, ward, polling unit, or activity type.

> **This repository contains synthetic demo data only.** It is not real campaign, polling unit, or election data. The candidate name and LGA list in the local `.env` are placeholders.

## Contents

- [What it does](#what-it-does)
- [Architecture](#architecture)
- [Assumptions](#assumptions)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Data dictionary](#data-dictionary)
- [API](#api)
- [Security controls](#security-controls)
- [How to debug](#how-to-debug)
- [Tests](#tests)
- [Troubleshooting](#troubleshooting)
- [Compliance and privacy](#compliance-and-privacy)
- [Deployment notes](#deployment-notes)
- [Known limitations](#known-limitations)

## What it does

- Reads campaign activity from a **read-only PostgreSQL view**.
- Groups by LGA, ward, polling unit, or activity type.
- Filters by LGA, ward, activity type, and date range.
- Returns total activities, contacts reached, total spend (NGN), and cost per contact.
- Renders a responsive React dashboard with routed views, charts, and accessible table fallbacks.
- Correlates every request, log line, and error response with a request ID.

The app never reads voter names, phone numbers, PVC/VIN numbers, addresses, religion, ethnicity, or any other personal or sensitive attribute. The runtime database role cannot read the base table — only the analytics view.

### Dashboard views

| Route | Purpose |
|---|---|
| `/overview` | Headline totals, contacts by LGA, spend by activity type, and monthly contact trend. |
| `/trends` | Weekly or monthly contacts and spend over time, with a period table. |
| `/coverage` | LGA × activity-type heatmap for contacts or spend, showing coverage gaps. |
| `/lgas`, `/wards`, `/polling-units`, `/activity-types` | Ranked bar chart plus a full table for each breakdown. |
| `/table` | Complete aggregation with a selectable grouping dimension and totals row. |

Filters live in the URL (`lga`, `activity_type`, `ward`, `from`, `to`) and are preserved when switching views. Views are lazy-loaded, and every chart has a table or text alternative for accessibility and precision.

## Architecture

```
Browser (React + Tailwind + Recharts, React Router)
        │  GET /api/analytics/{context,summary,trends,coverage}
        ▼
Express app (app.js)
  requestId → request logger → helmet → CORS allowlist
  → rate limits → JSON body limit → validation
        ▼
analyticsRoutes → analyticsController   (HTTP mapping)
        ▼
analyticsService                        (validation, decimal normalization, null cost)
        ▼
campaignRepository                      (Sequelize fn/col, bound filters)
        ▼
CampaignActivity model
        ▼
analytics_campaign_activities view      (safe columns only)
        ▼
campaign_activities base table          (upstream data, may contain sensitive columns)
```

`app.js` builds the Express app without opening a port, so tests exercise the full HTTP stack in-process. `server.js` owns configuration, the database connection, listening, and graceful shutdown.

Request flow: **route → controller → service → repository → model → view**.

## Assumptions

1. **The supplied database may contain PII.** The application connects with a read-only role that has `SELECT` only on `analytics_campaign_activities`. The runtime role has no access to `campaign_activities`.
2. **The LGA list is supplied by the campaign.** `PLATEAU_SENATORIAL_LGAS` is required and the app refuses to start without it. The local demo value (`Bokkos,Kanam,Kanke,Mangu,Pankshin`) is a **placeholder, not an authoritative district composition**. Replace it before using the app for any real reporting.
3. **Seed data is synthetic.** The seed script is deterministic, idempotent, and local-only.
4. **Authentication is out of scope.** The API must run behind SSO, a VPN, or reverse-proxy authentication. Do not expose it directly to the internet.
5. **Schema changes are out of scope.** The app never runs `sync()`, migrations, or writes against the upstream database.
6. **Currency and timezone are fixed** to NGN and `Africa/Lagos`, matching the campaign context.

## Repository layout

```
plateau-campaign-analytics/
├── package.json                     # npm workspaces + root scripts
├── README.md
├── server/
│   ├── package.json
│   ├── eslint.config.js
│   ├── .env.example
│   ├── setup/
│   │   ├── create-local-schema.sql  # base table, indexes, safe view
│   │   └── grant-read-only-role.sql # least-privilege grants
│   ├── src/
│   │   ├── app.js                   # Express app factory
│   │   ├── server.js                # boot, listen, graceful shutdown
│   │   ├── seed.js                  # deterministic synthetic seed
│   │   ├── setupLocalDatabase.js    # applies the local schema
│   │   ├── config/
│   │   │   ├── env.js               # fail-fast environment validation
│   │   │   └── campaign.js          # enums, labels, campaign config
│   │   ├── db/database.js           # Sequelize instance + lifecycle
│   │   ├── models/CampaignActivity.js
│   │   ├── repositories/campaignRepository.js
│   │   ├── services/analyticsService.js
│   │   ├── controllers/analyticsController.js
│   │   ├── middleware/
│   │   │   ├── requestId.js
│   │   │   ├── requestLogger.js
│   │   │   ├── cors.js
│   │   │   ├── rateLimit.js
│   │   │   ├── validateAnalyticsQuery.js
│   │   │   ├── notFound.js
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── analyticsRoutes.js
│   │   │   └── healthRoutes.js
│   │   ├── errors/AppError.js
│   │   └── utils/logger.js
│   └── tests/
│       ├── analyticsService.test.js
│       └── analyticsSummary.test.js
└── client/
    ├── package.json
    ├── vite.config.js               # Vite + Tailwind + Vitest + dev proxy
    ├── eslint.config.js
    ├── .env.example
    ├── index.html
    └── src/
        ├── main.jsx                   # BrowserRouter + CampaignProvider
        ├── App.jsx                    # lazy route table
        ├── index.css
        ├── api/campaignAnalyticsClient.js
        ├── pages/                     # Overview, Trends, Coverage, ranked views, table, 404
        ├── components/
        │   ├── layout/                # AppShell + Sidebar
        │   ├── common/                # PageHeader, FilterPanel, ChartCard, errors, skeletons
        │   └── analytics/             # charts, table, filters, summary cards, alerts
        ├── context/                   # campaign identity/options provider
        ├── hooks/                     # filters, request lifecycle, element width
        ├── constants/analytics.js
        └── utils/                     # currency, integer, labels, trend gap filling
```

## Prerequisites

- Node.js 20 or newer (tested on Node 24)
- npm 10 or newer
- PostgreSQL 14 or newer (tested on PostgreSQL 18)

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Create the database and read-only role

Run these as a PostgreSQL administrator. Replace the passwords.

```bash
psql "postgresql://postgres:YOUR_ADMIN_PASSWORD@127.0.0.1:5432/postgres" \
  -c "CREATE DATABASE plateau_campaign;"

psql "postgresql://postgres:YOUR_ADMIN_PASSWORD@127.0.0.1:5432/plateau_campaign" \
  -c "CREATE ROLE plateau_campaign_app LOGIN PASSWORD 'YOUR_APP_PASSWORD';"
```

If the role already exists, skip the `CREATE ROLE` command.

### 3. Configure the server

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

- `DATABASE_URL` — the **read-only** role connection string.
- `SEED_DATABASE_URL` — an admin connection string used only by setup and seeding. Remove it in production.
- `CANDIDATE_NAME` — the real candidate name.
- `PLATEAU_SENATORIAL_LGAS` — the official LGA list, comma-separated. **Do not keep the demo list.**
- `CORS_ALLOWED_ORIGINS` — the exact browser origin(s), for example `http://localhost:5173`.

### 4. Apply the schema

```bash
npm run db:setup
```

This creates `campaign_activities`, its indexes, and the `analytics_campaign_activities` view using `SEED_DATABASE_URL`.

### 5. Grant least privilege

Edit `server/setup/grant-read-only-role.sql`, replace `REPLACE_ME`, then run it as an administrator:

```bash
psql "postgresql://postgres:YOUR_ADMIN_PASSWORD@127.0.0.1:5432/plateau_campaign" \
  -f server/setup/grant-read-only-role.sql
```

Verify the runtime role can read the view but not the table:

```bash
psql "$DATABASE_URL" -c "SELECT count(*) FROM analytics_campaign_activities;"
psql "$DATABASE_URL" -c "SELECT count(*) FROM campaign_activities;"   # must fail
```

### 6. Seed synthetic data

```bash
npm run seed
```

The seed is deterministic and safe to re-run. It prints per-LGA, per-activity-type, and overall totals.

### 7. Run the app

Terminal 1:

```bash
npm run dev:server
```

Terminal 2:

```bash
cp client/.env.example client/.env
npm run dev:client
```

Open <http://localhost:5173>. The Vite dev proxy forwards `/api` to `http://localhost:4000`.

### 8. Production build

```bash
npm run build
```

Static assets are written to `client/dist`.

### Current workstation

This workstation is already configured:

- Database `plateau_campaign` exists with the local schema, view, and 45 synthetic activities.
- `plateau_campaign_app` has `SELECT` only on the view.
- `server/.env` and `client/.env` exist and are gitignored.
- The local candidate name is `DAVID BARJI` and the LGA list is the demo placeholder. **Both must be replaced for real use.**

## Environment variables

### Server (`server/.env`)

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `NODE_ENV` | no | `development` | `development`, `test`, or `production`. |
| `PORT` | no | `4000` | HTTP port. |
| `DATABASE_URL` | yes | — | Read-only runtime connection string. |
| `SEED_DATABASE_URL` | setup/seed only | — | Admin connection for schema and seed. Remove in production. |
| `CANDIDATE_NAME` | yes | — | Shown in the dashboard header. |
| `PARTY_NAME` | no | `APC` | Shown in the header. |
| `SENATORIAL_DISTRICT` | no | `Plateau` | Shown in the header. |
| `ELECTION_YEAR` | no | `2027` | Shown in the header. |
| `PLATEAU_SENATORIAL_LGAS` | yes | — | Comma-separated official LGA list. |
| `CORS_ALLOWED_ORIGINS` | in production | `http://localhost:5173` in dev | Comma-separated exact browser origins. |
| `DB_SSL` | no | `true` in production | Enable TLS to PostgreSQL. |
| `DB_SSL_REJECT_UNAUTHORIZED` | no | `true` | Verify the database certificate. |
| `DB_LOGGING` | no | `false` | Emits a query event marker; never logs SQL values. |
| `TRUST_PROXY` | no | `false` | Set `true` behind one trusted reverse proxy. |
| `LOG_LEVEL` | no | `info` | `debug`, `info`, `warn`, or `error`. |

The server validates all variables at boot and exits with a readable list of problems if any are invalid.

### Client (`client/.env`)

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `VITE_API_BASE_URL` | yes | `/` | `/` uses the Vite dev proxy. Use a full origin for direct API access. Never put secrets here. |

## Data dictionary

All fields come from the `analytics_campaign_activities` view.

| Field | Type | Meaning |
|---|---|---|
| `id` | integer | Activity record identifier. |
| `activity_type` | text | `rally`, `door_to_door`, `town_hall`, `market_outreach`, `radio`, `social_media`, or `billboard`. |
| `lga` | text | Local Government Area. Must be in `PLATEAU_SENATORIAL_LGAS`. |
| `ward` | text | Ward name within the LGA. |
| `polling_unit` | text, nullable | Synthetic code such as `PU-0142` in local data. May be null upstream; null groups are labelled `(not recorded)`. |
| `contact_count` | integer | People reached by the activity. Never negative. `0` for billboards. |
| `amount_spent` | numeric(12,2) | NGN spend. Never negative. |
| `activity_date` | date | Day the activity happened (campaign window 2026–2027 in synthetic data). |

No personal data fields exist in this schema.

## API

All analytics endpoints return the same envelope (`context`, `filters`, `currency`, `data`, `totals`, `generated_at`) and the same error shape.

### `GET /api/analytics/context`

Returns campaign identity and the filter options the client may offer. No query parameters.

```json
{
  "context": {
    "candidate": "DAVID BARJI",
    "party": "APC",
    "senatorial_district": "Plateau",
    "election_year": 2027,
    "lgas": ["Bokkos", "Kanam", "Kanke", "Mangu", "Pankshin"],
    "activity_types": ["rally", "door_to_door", "town_hall", "market_outreach", "radio", "social_media", "billboard"]
  },
  "currency": "NGN",
  "generated_at": "2026-10-24T13:41:08.758Z"
}
```

### `GET /api/analytics/summary`

All query parameters are optional and validated. Unknown parameters are rejected.

| Parameter | Values | Default | Notes |
|---|---|---|---|
| `group_by` | `lga`, `ward`, `polling_unit`, `activity_type` | `lga` | Maps to a fixed model column; never interpolated into SQL. |
| `lga` | configured LGA name | — | Exact match. |
| `ward` | string, max 100 chars | — | Exact match. |
| `activity_type` | activity enum | — | Exact match. |
| `from` | `YYYY-MM-DD` | — | Inclusive lower date bound. |
| `to` | `YYYY-MM-DD` | — | Inclusive upper date bound. Must be on/after `from`. |

Example response:

```json
{
  "context": {
    "candidate": "DAVID BARJI",
    "party": "APC",
    "senatorial_district": "Plateau",
    "election_year": 2027,
    "lgas": ["Bokkos", "Kanam", "Kanke", "Mangu", "Pankshin"],
    "activity_types": ["rally", "door_to_door", "town_hall", "market_outreach", "radio", "social_media", "billboard"]
  },
  "filters": {
    "group_by": "lga",
    "lga": null,
    "ward": null,
    "activity_type": null,
    "from": null,
    "to": null
  },
  "currency": "NGN",
  "data": [
    {
      "group": "Bokkos",
      "total_activities": 9,
      "total_contacts": 11715,
      "total_spend": 7715462,
      "cost_per_contact": 658.6
    }
  ],
  "totals": {
    "total_activities": 45,
    "total_contacts": 70155,
    "total_spend": 31717649,
    "cost_per_contact": 452.11
  },
  "generated_at": "2026-10-24T12:57:51.456Z"
}
```

`totals` covers every activity matching the filters, independent of the grouping dimension. `cost_per_contact` is `null` when `total_contacts` is `0` — it is never `Infinity` or `NaN`.

### `GET /api/analytics/trends`

Accepts every summary filter (`lga`, `ward`, `activity_type`, `from`, `to`) plus:

| Parameter | Values | Default | Notes |
|---|---|---|---|
| `bucket` | `week`, `month` | `month` | Also allowlisted; any other value is a `400`. |

`data` contains one row per period, ordered oldest to newest:

```json
{
  "period": "2026-07-01",
  "total_activities": 1,
  "total_contacts": 4829,
  "total_spend": 2005399,
  "cost_per_contact": 415.28
}
```

The API returns only periods with recorded activity. The client fills the gaps between the first and last period with zero rows so the chart does not imply unrecorded data points. `filters` echoes `bucket`.

### `GET /api/analytics/coverage`

Accepts the summary filters but no `group_by` or `bucket`. It returns one row per LGA × activity-type combination that has activity:

```json
{
  "lga": "Bokkos",
  "activity_type": "radio",
  "total_activities": 1,
  "total_contacts": 2975,
  "total_spend": 1702379,
  "cost_per_contact": 572.23
}
```

The client renders every configured LGA and activity type, so combinations missing from `data` appear as coverage gaps.

Error envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "group_by must be one of: lga, ward, polling_unit, activity_type.",
    "requestId": "6f8b0f2e-2b1e-4e1b-9c4b-2a8b7f0f1a11"
  }
}
```

| Code | Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Invalid query parameter, date, or JSON body. |
| `FORBIDDEN` | 403 | CORS origin not in the allowlist. |
| `NOT_FOUND` | 404 | Unknown route. |
| `RATE_LIMITED` | 429 | Rate limit exceeded. |
| `INTERNAL_ERROR` | 500 | Unexpected failure. Details are logged, not returned. |
| `DATABASE_UNAVAILABLE` | 503 | Readiness check could not reach the database. |

In `development`, error responses include a `stack` field. In `production`, they do not.

Curl examples:

```bash
# Default: group by LGA
curl -s http://localhost:4000/api/analytics/summary

# Ward-level rally performance in one LGA
curl -s "http://localhost:4000/api/analytics/summary?group_by=ward&lga=Bokkos&activity_type=rally"

# Activity types in a date window
curl -s "http://localhost:4000/api/analytics/summary?group_by=activity_type&from=2026-06-01&to=2026-12-31"

# Zero-contact case: billboard cost per contact is null
curl -s "http://localhost:4000/api/analytics/summary?group_by=activity_type"

# Campaign identity and filter options
curl -s http://localhost:4000/api/analytics/context

# Weekly trend for one LGA
curl -s "http://localhost:4000/api/analytics/trends?bucket=week&lga=Bokkos"

# Coverage matrix for one activity type
curl -s "http://localhost:4000/api/analytics/coverage?activity_type=radio"

# Expected 400 (invalid bucket)
curl -i "http://localhost:4000/api/analytics/trends?bucket=quarter"

# Expected 400
curl -i "http://localhost:4000/api/analytics/summary?group_by=region"

# Expected 404
curl -i "http://localhost:4000/api/not-a-route"
```

### `GET /health` and `GET /ready`

- `/health` is a liveness probe and does not touch the database.
- `/ready` verifies `sequelize.authenticate()` and returns `503 DATABASE_UNAVAILABLE` on failure.

## Security controls

| Control | Where |
|---|---|
| Security headers, `x-powered-by` disabled | `server/src/app.js:33` |
| Request ID correlation | `server/src/app.js:34`, `server/src/middleware/requestId.js` |
| Structured access logs without query values or row data | `server/src/middleware/requestLogger.js:6` |
| CORS allowlist; unknown origins rejected | `server/src/app.js:36`, `server/src/middleware/cors.js:10` |
| Global rate limit (100 req / 15 min / IP) | `server/src/app.js:40`, `server/src/middleware/rateLimit.js:21` |
| Stricter analytics rate limit (60 req / 15 min / IP) | `server/src/app.js:39`, `server/src/middleware/rateLimit.js:26` |
| JSON body limit (`10kb`) | `server/src/app.js:43` |
| Query allowlist, type checks, date checks | `server/src/middleware/validateAnalyticsQuery.js:32`, `server/src/routes/analyticsRoutes.js:13` |
| SQL-injection defense via bound Sequelize filters | `server/src/repositories/campaignRepository.js:57`, `:67` |
| Response-field allowlist; never `SELECT *` | `server/src/models/CampaignActivity.js:10`, `:54` |
| Read-only role; view-only grants; base table revoked | `server/setup/grant-read-only-role.sql:14-15` |
| Safe view exposes eight aggregate columns only | `server/setup/create-local-schema.sql:41` |
| No PII or sensitive columns | `server/setup/create-local-schema.sql:5-19` |
| Stable error envelope; production hides internals | `server/src/middleware/errorHandler.js:8` |
| Number normalization and null cost handling | `server/src/services/analyticsService.js` |
| No `dangerouslySetInnerHTML` | entire client (`grep` finds none) |
| Normalized API errors, abort/debounce, retry | `client/src/api/campaignAnalyticsClient.js`, `client/src/hooks/useAnalyticsRequest.js` |
| Charts always paired with tables or text values | `client/src/components/analytics/`, `client/src/pages/` |
| Accessible live status announcements | `client/src/components/analytics/StatusAlert.jsx:18` |
| Secrets only in gitignored `.env` files | `.gitignore` |

Deliberately **not** implemented: authentication, authorization, CSRF tokens, and write endpoints. This is an internal read-only reporting tool and must be deployed behind an authenticated proxy.

## How to debug

### Backend

1. Call `GET /health` and `GET /ready` to separate process issues from database issues.
2. Copy the `requestId` from the error response and search the logs for it.
3. Reproduce with `curl` and a narrow filter. Compare the response `filters` object with what you sent.

Startup and connection failures are logged with an `event` field (`config.invalid`, `db.connect_failed`, `seed.failed`, `schema.failed`). Stack traces are logged internally and returned in development only.

### Frontend

1. Open the browser network tab. The failing request includes an `x-request-id` response header; use it in the backend logs.
2. Check the console for `Analytics request failed` with `code`, `status`, and `requestId`.
3. Confirm `client/.env` has `VITE_API_BASE_URL=/` (proxy) or the correct API origin, then restart Vite after any env change.

## Tests

```bash
npm test          # server (node:test) + client (Vitest)
npm run lint      # ESLint for both workspaces
npm run build     # client production build
```

Server tests (29, no database required):

- decimal-string normalization and NGN rounding
- zero-contact `null` cost handling
- null polling-unit bucket
- invalid grouping, LGA, activity type, bucket, and reversed dates
- summary, context, trend, and coverage response contracts
- weekly/monthly trend filters and coverage aggregation
- filters echoed correctly and request ID echo
- unknown/array query parameters and impossible dates
- 404/500 envelopes and production detail hiding
- health and readiness (including database failure)

Client tests (8):

- NGN currency formatting and em-dash fallback
- assertive error and polite status rendering
- monthly/weekly trend gap filling with zero rows

The tests inject a fake analytics service, so the HTTP stack is exercised without PostgreSQL. Live database verification was performed manually with `curl` against the seeded local database.

Frontend component tests are intentionally limited: the Vitest environment is Node-only (no jsdom), so routed views and charts are verified by the production build plus desktop/mobile headless-browser checks. Add `jsdom` and Testing Library if interactive component tests become necessary.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Invalid environment configuration: ...` at boot | Missing or malformed `.env` values | Read every bullet in the error, fix `server/.env`, restart. |
| `relation "analytics_campaign_activities" does not exist` | Schema not applied | Run `npm run db:setup` with `SEED_DATABASE_URL` set. |
| `permission denied for table analytics_campaign_activities` | Grants missing or role not created | Run `server/setup/grant-read-only-role.sql` as admin, then verify with the app role. |
| `password authentication failed` / `ECONNREFUSED` | Wrong URL or PostgreSQL is down | Check `DATABASE_URL`, confirm PostgreSQL is running on the expected host/port. |
| Seed fails with `permission denied for table campaign_activities` | `SEED_DATABASE_URL` points at the read-only role | Use an admin/owner connection for seeding only. |
| Browser shows `FORBIDDEN` / CORS error | Origin not in `CORS_ALLOWED_ORIGINS` | Add the exact scheme + host + port, restart the API. |
| `429 RATE_LIMITED` during development | 60 analytics requests in 15 minutes | Wait, or restart the API (the limiter is in memory). |
| Spend or cost displays as a string downstream | A new query forgot normalization | Reuse `analyticsService` `buildAggregate`; PostgreSQL returns aggregates as strings. |
| Cost per contact shows `—` | `total_contacts` is `0` | Expected. The API returns `null` rather than dividing by zero. |
| Frontend error `CONFIG_ERROR` | `VITE_API_BASE_URL` missing | Set it to `/` for the proxy or the full API origin, then restart Vite. |
| `404` from the frontend but API works with curl | Vite proxy target/port mismatch | Ensure the API listens on `4000` or update `server.proxy` in `client/vite.config.js`. |
| App refuses to start after removing the demo list | `PLATEAU_SENATORIAL_LGAS` empty | Supply the official comma-separated LGA list. |

## Compliance and privacy

- The application stores and displays **aggregates only**. The view excludes every personal or sensitive column.
- The runtime role can read the view and **nothing else**; the base table is explicitly revoked.
- Development and test data are synthetic. No production dump belongs on a developer laptop.
- Logs exclude query values, row values, cookies, and authorization headers.
- The upstream database and any PII in it remain under the campaign's control and outside this application's trust boundary.
- Campaign analytics involving voter data can fall under the Nigeria Data Protection Act 2023 and NDPR. Obtain legal/data-protection review before connecting this app to any dataset containing personal data. This repository does not provide legal advice.
- No political persuasion content, targeting recommendations, or voter-level records are produced by this software.

## Deployment notes

- Serve the API over HTTPS and enable `DB_SSL=true` with certificate verification for managed PostgreSQL.
- Set `TRUST_PROXY=true` only when running behind exactly one trusted reverse proxy; otherwise rate limiting can be bypassed via forged forwarded headers.
- Restrict `CORS_ALLOWED_ORIGINS` to the dashboard origin.
- Put the API and dashboard behind SSO, a VPN, or authenticated reverse proxy. The app has no authentication by design.
- Remove `SEED_DATABASE_URL` and do not ship setup/seed scripts to production.
- The rate limiter uses the default in-memory store, so limits are per process. A multi-instance deployment needs a shared store (for example Redis); that is not implemented.
- Ship logs to your standard aggregator; JSON lines are written to stdout.
- Apply the analytics view and grants in the upstream database using a change-controlled migration, not this application.

## Known limitations

- No authentication or RBAC.
- No CSV export, drill-down, pagination, or saved reports (group counts are small by design).
- Trend buckets are limited to week and month; no custom period comparison.
- Charts use client-side gap filling, so the first and last period always come from the API response.
- In-memory rate limiting.
- The demo LGA list and candidate name are placeholders.
- Frontend tests cover formatting and alert semantics only; interactive flows are verified manually.
# data-analysis-demo
