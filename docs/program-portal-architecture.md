# Program Portal — Architecture Plan

## 1. What this is

Today, the `Program_Portal` VBA macro runs on Ryan's desktop, opens a handful of Excel workbooks synced from OneDrive/SharePoint, and emails each Program Specialist (PS) a "Daily Brief" via Outlook. This plan covers replacing the *viewing and interaction* layer with a web dashboard so PS staff can:

- See the same flagged items they get in email today (missed PRNs, expiring HRST assessments, missed charts, new ICM STA issues, appointments, FMLA/leave status).
- Click an item as **reviewed**, so it stops showing up on subsequent days once handled.

The email keeps going out (at least initially) but shrinks to a summary + a link into the portal, instead of the full HTML report.

This plan does **not** implement code yet — it lays out the approach so we agree on it before building, since several choices (auth model, data retention policy, hosting shape) are expensive to reverse later.

## 2. Hosting shape (Azure free tier)

| Component | Service | Why |
|---|---|---|
| Frontend + API | **Azure Static Web Apps (Free plan)** | Hosts the dashboard and its backend Azure Functions together, free SSL, and — critically — **built-in Entra ID authentication** with zero custom auth code needed. |
| Backend logic | **Azure Functions (Consumption plan)**, bundled into the SWA app | 1M free executions + 400,000 GB-s/month, plenty for a nightly data-refresh job and on-demand API calls from a few dozen users. |
| "Reviewed" state + daily item data | **Azure Cosmos DB (Free tier, Core/SQL API)** | 1000 RU/s + 25GB storage forever free (one per subscription). Good fit for small per-item documents keyed by PS + date. |
| Secrets (Graph API app credentials) | **Azure Key Vault** | Near-zero cost at this volume (~$0.03/10k operations). Static Web Apps/Functions pull the Graph client secret or certificate from here rather than app settings in plaintext. |
| Identity | **Microsoft Entra ID** (your existing M365 tenant) | Already free with your org's Microsoft 365 subscription — no separate identity system to run. |

Total expected cost: **$0/month** at this scale. Nothing above requires a paid tier for a caseload dashboard used by a few dozen internal staff.

## 3. Reading the OneDrive/SharePoint files

Your note — "files should be accessible from staff computers" — is compatible with a cloud backend: the Excel workbooks (Appointment Report, BM-PRN Report, Chart Compliance Audit, HRST Expiration Report, FMLA Tracker, DCI Verification Report, etc.) already live in **SharePoint** and are just *synced* to Ryan's OneDrive folder locally. Staff keep using them exactly as they do now — nothing about that workflow changes.

The Azure Function reads the **same SharePoint library** directly via the **Microsoft Graph API**, using **application (app-only) permissions**:

- Register one Entra ID app (e.g. "Program Portal Data Service").
- Grant it `Files.Read.All` (or narrower, `Sites.Selected` scoped just to the specific SharePoint site, which is better security practice) as an **application permission**, admin-consented once by a tenant admin.
- The Function authenticates with a client credentials flow (certificate preferred over a secret) — no user has to be logged in for this job to run, so it can run on a schedule (e.g. nightly at the same time the VBA does today) independent of anyone's desktop being on.
- Parse the `.xlsx`/`.xlsm` files server-side (Node.js: `exceljs`; Python: `openpyxl`/`pandas` — pick based on team familiarity) using the same logic currently in the VBA (`BuildApptSection`, `BuildBMSection`, `BuildDCISection`, `BuildAssessmentSection`, `BuildFMLASection`, `BuildChartComplianceSection`, etc.), ported to whichever backend language we pick.

This also removes the current single point of failure where the whole pipeline depends on Ryan's machine being on with Outlook and Excel installed.

## 4. Data model

A Cosmos DB container `DailyItems`, one document per flagged item, partitioned by `psEmail`:

```json
{
  "id": "psEmail|category|stableKey",
  "psEmail": "jsmith@sharedsupport.org",
  "psName": "Jane Smith",
  "category": "BM_PRN_MISSED | HRST_EXPIRING | CHART_MISSED | DCI_ISSUE | APPOINTMENT | FMLA",
  "severity": "red | amber | info",
  "individual": "JOHN DOE",
  "description": "MISSED PRN (4 days since last BM)",
  "sourceDate": "2026-07-08",
  "firstSeenDate": "2026-07-06",
  "status": "pending | reviewed",
  "reviewedBy": null,
  "reviewedAt": null
}
```

`id` is a **stable key** derived from the same fields the VBA uses to identify an issue (individual + category + relevant date/trigger), *not* a random ID — that's what lets the nightly refresh recognize "this is the same issue as yesterday, still unresolved" versus "this is a new occurrence."

## 5. Open decision: what does "reviewed" actually suppress?

This is the one piece I don't think I should decide unilaterally, because getting it wrong has real consequences for a program-compliance tool:

- **Option A — Reviewed = permanently dismissed.** Once clicked, that exact item never reappears, even if the underlying condition (e.g., still-missed PRN) persists. Risk: a safety-relevant issue could get acknowledged once and then silently drop off everyone's radar even though it's still unresolved.
- **Option B — Reviewed = dismissed until the underlying data changes.** If the *same* missed PRN is still missed tomorrow, it reappears (since it's a live, unresolved problem); but a one-time item like "new DCI issue logged" stays dismissed once acknowledged since there's nothing further to resolve.
- **Option C — Category-dependent.** Safety/compliance-critical categories (missed PRN, overdue HRST, missed chart) always use Option B (reappear until resolved in the source system); administrative/informational categories (new DCI issue, upcoming appointment) use Option A (dismiss on click, since acknowledging it *is* the resolution).

**My recommendation is Option C**, since it matches how the VBA itself already treats these differently (e.g., a missed PRN keeps showing as "MISSED" in the source report until someone actually enters the BM, whereas a DCI issue just needs someone to see it and correct it in ICM). But this needs your sign-off before I build the suppression logic, since it directly affects what a PS can and can't safely stop worrying about.

## 6. Authorization model

- Entra ID SSO via Static Web Apps' built-in auth, restricted to your tenant.
- Each signed-in user's email (`x-ms-client-principal` claim SWA injects into every request) is matched against `psEmail` in Cosmos DB — a PS can only ever see and mark-reviewed items where `psEmail` matches their own signed-in identity. No client-side trust of "who am I" — the API enforces this server-side on every read/write.
- Exec/Admin/Training roles (who get the roll-up emails today) can be granted a custom SWA role (e.g. `program-admin`) via the Entra ID group they're already in, giving them a filtered "all PS" view — this is a natural Phase-2 addition once the per-PS view is solid, not needed for the first version.

## 7. Phased build plan

1. **Skeleton**: SWA app + Entra ID login working, empty dashboard shell, Cosmos DB provisioned, Key Vault + Graph app registration in place. No real data yet.
2. **First data slice**: Port BM/PRN + Appointments parsing into the nightly Function, populate Cosmos DB, render read-only on the dashboard.
3. **Mark-reviewed loop**: Add the click-to-review API + the suppression policy from §5, once you've confirmed the approach.
4. **Remaining sections**: Chart Compliance, HRST, DCI issues, FMLA — same pattern, one at a time, so each can be verified against a real day's data before moving to the next.
5. **Email shrink** (optional, later): Once the portal is trustworthy, cut the daily email down to a short overview + "View your full brief" link, instead of the full HTML report. This is also when we could optionally move email sending itself off the VBA/Outlook desktop dependency and onto Graph API `sendMail`, if that dependency becomes a problem.

## 8. What I need from you before Phase 1 starts

- **Tenant admin action**: someone with Global Admin or Application Admin in your Entra ID tenant needs to register the app and grant/consent the `Files.Read.All` (or `Sites.Selected`) application permission. I can produce exact step-by-step instructions, but I can't perform this myself — it requires your organization's Azure/M365 admin console access.
- **Exact SharePoint site/library path** for the source files (the OneDrive path in the VBA constants is a *local sync path* — I need the underlying SharePoint site URL/drive ID to point Graph API at it).
- **Sign-off on the suppression policy** in §5 (recommend Option C, category-dependent).
- **Backend language preference** — Node.js/TypeScript (my default recommendation, pairs cleanly with Static Web Apps and has a mature Graph SDK) or Python, if your team has stronger familiarity there.
