# QualityOS — Frontend

React 18 single-page app for the QualityOS Quality Management System.

## Stack

- React 18 + Vite
- React Router DOM v6
- Tailwind CSS (with dark mode via the `dark` class strategy)
- Axios
- React Icons (Tabler icon set, `react-icons/tb`)
- Framer Motion (modals, dropdowns, page transitions)
- ExcelJS + File-Saver (exporting inspection reports to `.xlsx`)

## Setup

```bash
npm install
cp .env.example .env      # VITE_API_URL should point at your running backend, default http://localhost:5000/api
npm run dev
```

The app runs on `http://localhost:5173` by default and expects the backend from `../backend` to
be running (see its README for `npm run seed` + `npm run dev`).

## Folder structure

```
src/
├── api/                  one thin client module per backend resource (axios wrappers)
├── components/
│   ├── common/            ProtectedRoute, Modal, ConfirmDialog, MasterDataPage (generic CRUD),
│   │                      KpiCard, StatusChip, Loader
│   ├── layout/             Sidebar, Topbar, AppLayout (route → title/breadcrumb mapping)
│   └── inspection/         InspectionHeaderCard, SummaryPanel (used by the Excel-replica page)
├── context/                AuthContext, ThemeContext, ToastContext
├── pages/                  one file per route; reports/ holds Daily/Monthly/Pareto
└── utils/exportExcel.js    builds a formatted .xlsx from an inspection entry
```

## Design system

Colors, spacing and the Excel-sheet-specific classes (`.ipir`, `.chk`, `.op-header`, …) are
defined once in `src/index.css` and `tailwind.config.js`, matching the supplied reference HTML
files pixel-for-pixel for the Inspection Entry screen. Everything outside the inspection sheet
(sidebar, topbar, dashboard, admin pages) uses the same token set but with rounded cards and
modern component patterns, per the brief.

## Key implementation notes

- **`MasterDataPage`** (`components/common/MasterDataPage.jsx`) is a fully generic list +
  create/edit-modal component driven by a `columns` and `fields` schema. Every master data page
  (Customer, Series, Model, Production Line, Operation, Parameter, Users) is a ~40-line wrapper
  around it — add a new master data screen by describing its columns/fields, not by rewriting
  CRUD UI.
- **`InspectionEntry.jsx`** is the Excel-replica grid. Keyboard navigation works by giving every
  OK/NOK/CA button a predictable `id` (`chk-{rowId}-{colIndex}`) and moving `document.activeElement`
  via `focus()` on Arrow keys / Enter / Tab, rather than a virtualization library — this keeps the
  grid's DOM structure identical to a real HTML table (so printing and Excel export both work
  from the same markup).
- **Dark mode** is a `dark` class toggled on `<html>`, persisted to `localStorage`, with Tailwind
  `dark:` variants baked into the shared component classes in `index.css` — most pages get dark
  mode "for free" by using `.card`, `.input`, `.btn-outline`, `table.master-table`, etc. The
  Inspection Entry sheet intentionally stays light even in dark mode, matching how printed/paper
  inspection forms are conventionally kept high-contrast and unambiguous on the shop floor.
