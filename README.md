# QualityOS — Enterprise Quality Management System

A full-stack QMS for manufacturing, built to digitize an existing Excel-based in-process
inspection report (IPIR) without changing how Auditors work — while modernizing everything
around it (dashboard, admin, reports, analytics).

```
quality-os/
├── frontend/   React 18 + Vite + Tailwind CSS + React Router v6 + Axios + Framer Motion + ExcelJS
└── backend/    Node.js + Express + MongoDB + Mongoose + JWT
```

## What's inside

- **Inspection Entry** (`/inspections/:id`) — an interactive, Excel-style grid generated entirely
  from database configuration (Inspection Templates → Operations → Parameters). Click-to-set
  OK / NOK / Corrective-Action cells, keyboard navigation (Tab, Arrow keys, Enter-to-confirm-and-
  move-down), sticky header, auto-calculated summary, auto-save, and automatic Non-Conformity
  creation the moment a parameter is marked NOK.
- **Dashboard** — live KPIs, per-line status, 7-day quality trend, shift-by-shift inspection
  status, top defects, recent NCs and today's inspection log, all backed by real aggregation
  endpoints (no mock data once you've seeded the database).
- **Non-Conformity workflow** — root cause analysis, corrective action, a 5-stage approval
  timeline, impact assessment, comments and attachments, plus a live view into the Parameter
  Master configuration behind the flagged parameter.
- **Master Data** — Customer, Series, Model, Production Line, Process (Operations), Parameter,
  Inspection Templates (with an "auto-build from Parameter Master" one-click generator), and
  User Management with role-based access (Admin, Quality Manager, Supervisor, Auditor, Viewer).
- **Reports & Analytics** — Daily Report, Monthly Report, Pareto Analysis (defect bars +
  cumulative % line), and a longer-range Analytics view.
- Dark/light mode, notification center, breadcrumbs, and Excel export (via ExcelJS) on every
  inspection report.

## Quick start

You'll need **Node.js 18+** and a running **MongoDB** instance (local install or a free
[MongoDB Atlas](https://www.mongodb.com/atlas) cluster).

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # then edit MONGO_URI / JWT_SECRET if needed
npm run seed               # populates demo customers, lines, models, parameters, users…
npm run dev                 # starts the API on http://localhost:5000
```

The seed command prints login credentials at the end — copy the Admin one for your first login.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env      # defaults to http://localhost:5000/api, adjust if you changed PORT
npm run dev                 # starts the app on http://localhost:5173
```

Open `http://localhost:5173`, sign in with the seeded Admin credentials, and you'll land on a
fully populated dashboard with a sample in-progress inspection report and a linked
non-conformity ready to explore.

## How the "no hardcoding" requirement is implemented

1. **Parameter Master** — every inspection parameter (name, spec, unit, method, frequency) lives
   in the database, scoped to a Model + Operation.
2. **Inspection Templates** — an admin composes an ordered list of Operations, each with an
   ordered list of Parameters, for a given Customer + Production Line + Model. The
   "Auto-build from Parameter Master" button does this automatically from whatever's already
   configured.
3. **Inspection Entry** — starting a new inspection resolves the chosen template into the exact
   row/column structure the Excel-replica grid renders. Add a new Operation or Parameter in
   Master Data, rebuild (or auto-build) the template, and the sheet picks it up automatically —
   nothing about the grid's shape is hardcoded in the frontend.

## Roles

| Role | Can do |
|---|---|
| Admin | Everything, including user management |
| QualityManager | Master data, templates, approve/close NCs, all reports |
| Supervisor | Approve inspections, lock reports, manage NCs, view users |
| Auditor | Fill in inspection sheets, raise NCs, comment |
| Viewer | Read-only access |

## Notes for going to production

- Swap the NC attachment "URL" field for a real object-storage upload (S3, Azure Blob, GCS) —
  it currently stores metadata only, by design, to keep the local demo dependency-free.
  See `POST /api/nc/:id/attachments`.
- Rotate `JWT_SECRET` and set `NODE_ENV=production` in the backend `.env`.
- Point `MONGO_URI` at a managed cluster with backups enabled.
- Consider adding rate limiting (e.g. `express-rate-limit`) in front of `/api/auth/login`.

See `backend/README.md` and the inline code comments for further detail on the data model.
