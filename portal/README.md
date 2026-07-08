# Program Portal

Web dashboard where Program Specialists review their daily flagged items (missed
PRNs, expiring HRST assessments, missed charts, ICM STA issues, appointments,
FMLA/leave status) and mark them reviewed, so handled items drop off the
following day's list. See `../docs/program-portal-architecture.md` for the full
design and open decisions.

Status: **skeleton stage**. The dashboard, auth, and mark-reviewed flow are
built and working end-to-end against sample data. The nightly refresh Function
that will actually read the ICM/HRST/BM-PRN workbooks from SharePoint via
Microsoft Graph is stubbed — see `api/src/lib/fetchCandidates.ts`.

## Layout

```
portal/
  src/            frontend (Vite + React + TypeScript)
  api/            Azure Functions backend (Node.js v4 programming model)
    src/functions/  HTTP + timer triggers
    src/lib/        auth, data store, refresh/suppression logic
  shared/         types shared by both sides (DailyItem, categories, etc.)
  staticwebapp.config.json   auth + routing config for Azure Static Web Apps
```

## Local development

Requires Node 20+.

```bash
# one-time
cd portal && npm install
cd api && npm install
```

**Frontend + API together (recommended — matches production auth behavior):**

```bash
npm install -g @azure/static-web-apps-cli azure-functions-core-tools@4
cd portal/api && npm run build
cd portal && swa start http://localhost:5173 --run "npm run dev" --api-location api
```

The SWA CLI serves everything through one origin, proxies `/api/*` to the
Functions host, and emulates `/.auth/*` with a local login picker (click a
provider, it fabricates a fake identity — no real Entra ID needed for local
dev). This is the only way to exercise the auth flow locally.

**Frontend only, against the Functions host directly (faster iteration on UI):**

```bash
cd portal/api && npm run start   # func start, on :7071
cd portal && npm run dev         # vite, on :5173, proxies /api to :7071
```

`/.auth/me` won't exist in this mode (no SWA CLI in front), so the app will
show the sign-in screen and never get past it — fine for styling work, not for
testing the authenticated dashboard.

By default the API runs against an **in-memory data store** seeded with sample
items (`api/src/lib/seedData.ts`) — no Azure resources required to develop
against. Copy `api/local.settings.json.example` to `api/local.settings.json` to
override.

## Deploying (once ready)

1. **Provision Azure resources** (all free-tier): a Static Web App (Free plan),
   a Cosmos DB account (Free tier, database `program-portal`, container
   `DailyItems` partitioned on `/psEmail`), and a Key Vault for secrets.
2. **Register an Entra ID app for Graph API access** (tenant admin required —
   see `docs/program-portal-architecture.md` §3 and §8): grants the nightly
   refresh Function permission to read the SharePoint-hosted report workbooks.
   Not needed until `fetchCandidates.ts` is implemented.
3. **Restrict sign-in to your tenant.** `staticwebapp.config.json` currently
   uses SWA's zero-config built-in Entra ID login, which by default accepts
   *any* Microsoft account, not just accounts in your organization. Before
   going live, register a dedicated Entra ID app for user sign-in (separate
   from the Graph API app in step 2) and add a custom `auth.identityProviders`
   block pointing at your tenant's issuer — otherwise anyone with a Microsoft
   account could sign in and see whatever `allowedRoles` grants them.
4. **Set app settings** on the Static Web App / linked Function app:
   `DATA_STORE=cosmos`, `COSMOS_ENDPOINT`, `COSMOS_KEY` (or use a managed
   identity instead of a key — preferred), `COSMOS_DATABASE`,
   `COSMOS_CONTAINER`.
5. Connect the GitHub repo to the Static Web App (Azure Portal → Static Web
   App → deployment source), pointing app location at `portal/`, api location
   at `portal/api`, output location at `dist`. This gets you the CI/CD
   GitHub Action automatically.

## What's still stubbed

- `api/src/lib/fetchCandidates.ts` — returns an empty list. This is where the
  Graph API + Excel-parsing logic (ported from the VBA's `Build*Section`
  functions) plugs in.
- Custom-tenant auth restriction (see deployment step 3).
- Admin/exec roll-up view (`program-admin` role is checked for in the API
  already, but nothing assigns that role to anyone yet — that's an Entra ID
  group → SWA role mapping to configure at deploy time).
