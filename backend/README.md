# QualityOS — Backend

Node.js / Express / MongoDB API server for the QualityOS Quality Management System.

## Stack

- Node.js + Express.js
- MongoDB + Mongoose
- JWT authentication (jsonwebtoken)
- bcryptjs for password hashing
- dotenv, cors, morgan

## Folder structure

```
backend/
├── server.js                 # entry point
├── src/
│   ├── app.js                # express app + route mounting
│   ├── config/db.js          # mongoose connection
│   ├── models/               # mongoose schemas
│   ├── controllers/          # route handlers / business logic
│   ├── routes/                # express routers
│   ├── middleware/           # auth, error handling, async wrapper
│   ├── utils/                 # crud factory, token helper, id sequences
│   └── seed/seed.js           # demo data seeder
├── .env.example
└── package.json
```

## Setup

1. **Install MongoDB** locally (or use a free MongoDB Atlas cluster) and have it running on the URI you'll configure below.

2. **Install dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set `MONGO_URI`, `JWT_SECRET`, and `CLIENT_URL` (the frontend's dev URL, default `http://localhost:3000`).

4. **Seed demo data** (customers, production lines, models, operations, parameters, an inspection template, a sample in-progress IPIR report, a linked non-conformity, and login users)

   ```bash
   npm run seed
   ```

   This prints the seeded login credentials at the end, for example:

   ```
   Admin login:      admin@qualityos.local / Admin@12345
   Supervisor login: ravi.venkatesh@qualityos.local / Supervisor@123
   Quality Manager:  lakshmi.narayan@qualityos.local / Quality@123
   Auditor login:  priya.s@qualityos.local / Auditor@123
   ```

5. **Run the dev server**

   ```bash
   npm run dev
   ```

   The API starts on `http://localhost:5000` (configurable via `PORT`). Health check: `GET /api/health`.

## Re-seeding

`npm run seed` wipes and repopulates every collection. To only wipe data without reseeding:

```bash
npm run seed:destroy
```

## API overview

All routes except `/api/auth/login` and `/api/auth/register` require `Authorization: Bearer <token>`.

| Area | Base route | Notes |
|---|---|---|
| Auth | `/api/auth` | register, login, me |
| Users | `/api/users` | Admin-managed user accounts & roles |
| Customers | `/api/customers` | Customer Master |
| Series | `/api/series` | Series Master |
| Models | `/api/models` | Model Master (`ProductModel`) |
| Production Lines | `/api/production-lines` | Production Line Master |
| Operations | `/api/operations` | Operations / Process Master (OP 20, OP 30…) |
| Parameters | `/api/parameters` | Parameter Master (spec, unit, method, frequency) |
| Templates | `/api/templates` | Inspection Templates; `/:id/resolve` returns the fully denormalized sheet definition; `/auto-build` generates a template from Parameter Master |
| Inspections | `/api/inspections` | The Excel-replica IPIR reports: create from a template, `PATCH /:id/cell` for OK/NOK/CA clicks, `/:id/submit`, `/:id/approve`, `/:id/lock` |
| Non-Conformities | `/api/nc` | Auto-created on NOK; root cause, corrective action, impact, timeline, comments, attachments |
| Dashboard | `/api/dashboard` | Aggregated KPIs, line status, quality trend, top defects, today's log, recent NCs |

### Roles

`Admin`, `QualityManager`, `Supervisor`, `Auditor`, `Viewer` — enforced per-route via the `authorize()` middleware. Master data writes require Admin/QualityManager; inspection entry editing is open to Auditor and above; NC closure requires Admin/QualityManager.

## Notes on design decisions

- **Nothing is hardcoded in the inspection sheet.** `InspectionTemplate` stores an ordered list of Operations, each with an ordered list of Parameters (with optional spec/unit/method overrides). `POST /api/inspections` resolves a template into the exact row/column structure the frontend renders — add a new Operation or Parameter in Master Data and it flows through automatically the next time a template is built or auto-built.
- **Auto NC creation.** Marking any shift cell `NOK` on `PATCH /api/inspections/:id/cell` automatically creates a linked `NonConformity` document (if one doesn't already exist for that row) with a pre-populated 5-stage workflow timeline, exactly like the `NC-2025-089 · View NC` chip in the reference sheet.
- **Auto-calculated summary.** `InspectionEntry.recalculateSummary()` runs on every cell/row mutation and produces the same figures shown in the reference "Inspection Summary" card (total parameters, NC count, corrective actions, quality %).
