# Freelance Project & Client Escrow — Full-Stack Mini Project

Topic 27 — *Freelance Project Freelancer & Client Escrow*.
**ISA-II** = backend (`/backend`) · **ISA-III** = React frontend (`/frontend`).

A client posts a project and splits the budget into **milestones**. The client **funds** a milestone into escrow, the freelancer **submits** the work, and the client **releases** the payment (or disputes / refunds it). Every movement of money is written to an immutable **ledger**. Each milestone also tracks **tasks**.

---

## Step-by-step: run it

### 0. Install once
| Tool | Version | Check |
|------|---------|-------|
| Node.js | 18 or newer | `node -v` |
| MySQL Server | 8.x (or MariaDB 10.x) | `mysql --version` |

Make sure MySQL is **running** (Windows: *Services → MySQL*, or XAMPP/WAMP "Start" button).

### 1. Unzip
```
freelance-escrow/
├── backend/
├── frontend/
└── README.md
```

### 2. Configure the database login
Open `backend/.env` and set your MySQL password:
```
DB_USER=root
DB_PASS=your_mysql_password     # leave empty if root has no password (XAMPP default)
DB_NAME=freelance_escrow
```

### 3. Backend — install, create DB, create tables, load demo data
```bash
cd backend
npm install
npm run setup
```
`npm run setup` does three things: creates the database → runs the **migration** → runs the **seed**.
You should see `✔ Database "freelance_escrow" is ready` and `✔ Demo data inserted…`.

> If the migration step ever complains, use the fallback which builds the tables straight from the Sequelize models:
> `npm run setup:sync`

### 4. Start the backend (keep this terminal open)
```bash
npm start
```
Expect: `✔ MySQL connection established` and `✔ API running on http://localhost:5000/api`.
Quick check in the browser: <http://localhost:5000/api/health> → `{"status":"ok"}`.

### 5. Frontend — new terminal
```bash
cd frontend
npm install
npm run dev
```
Open **<http://localhost:5173>**.

### 6. Use it
1. **Sign in** → choose *Client* → pick *Aarav Mehta* (the demo session is stored in React context).
2. **Dashboard** → escrow totals (raw-SQL report).
3. **Projects** → filter / search / sort / paginate.
4. Open *E-commerce website redesign* → press **Release payment** on the "submitted" milestone.
5. Sign out → sign in as Freelancer *Priya Kamat* → open a project with a *funded* milestone → **Submit work**.
6. **Ledger** shows every deposit / release / refund.

### Optional: automated API check
With the backend running: `cd backend && npm run smoke` (≈30 assertions covering validation, escrow flow, filters, raw SQL, integrity rules).

### Troubleshooting
| Message | Fix |
|---------|-----|
| `Access denied for user 'root'` | Wrong `DB_PASS` in `backend/.env` |
| `ECONNREFUSED 127.0.0.1:3306` | MySQL isn't running |
| `Port 5000 already in use` | Change `PORT` in `backend/.env` **and** the proxy target in `frontend/vite.config.js` |
| Frontend shows "Is the backend running?" | Start the backend (step 4) |
| `Database already has data` on seed | `npm run seed -- --reset` (wipes and reseeds) |

---

## Database design

```
clients 1 ──< projects >── 1 freelancers (optional, SET NULL on delete)
                 │
                 1
                 │
                 M
             milestones ──< tasks
                 │
                 M
        escrow_transactions  (deposit / release / refund ledger)
```

| Association | Type | On delete |
|-------------|------|-----------|
| Client → Projects | 1:M | RESTRICT |
| Freelancer → Projects | 1:M | SET NULL |
| Project → Milestones | 1:M | CASCADE |
| Milestone → Tasks | 1:M | CASCADE |
| Milestone → EscrowTransactions | 1:M | RESTRICT |

**Validations / constraints:** non-null fields, unique emails, `isEmail`, length checks, positive budget & amounts (custom validators), ENUM statuses, no past deadline for a new project (model-level validator), foreign keys.
**Business rules (controllers):** milestones may not exceed the project budget (422); a milestone is only editable/deletable while *pending*; escrow actions follow a strict state machine inside a DB transaction (409 on illegal transition); a project becomes *completed* when all active milestones are released.

### Escrow state machine
```
pending --fund--> funded --submit--> submitted --release--> released
                    |                    |
                    +----dispute---------+--> disputed --refund--> refunded
                    +----refund (funded / submitted) -----------> refunded
```

---

## REST API (base URL `http://localhost:5000/api`)

Errors are always JSON: `{ "error": "message", "details": [{ "field", "message" }] }`.

| Status | Meaning |
|--------|---------|
| 200 | OK |
| 201 | Created |
| 204 | Deleted (no body) |
| 400 | Validation failed / bad id or parameter |
| 404 | Record or route not found |
| 409 | Duplicate value, illegal escrow transition, or record still in use |
| 422 | Business rule broken (e.g. milestones exceed budget) |
| 500 | Server error |

### Clients
| Method | Path | Notes |
|--------|------|-------|
| GET | `/clients` | list |
| GET | `/clients/:id` | includes their projects |
| POST | `/clients` | `{ "name": "Aarav Mehta", "email": "aarav@x.in", "company": "Mehta Textiles" }` → 201 |
| PUT | `/clients/:id` | any of name / email / company |
| DELETE | `/clients/:id` | 409 if the client still owns projects |

### Freelancers
| Method | Path | Notes |
|--------|------|-------|
| GET | `/freelancers` | list |
| GET | `/freelancers/:id` | includes their projects |
| POST | `/freelancers` | `{ "name": "Priya Kamat", "email": "p@x.in", "skills": "React, Node", "hourlyRate": 1200 }` → 201 |
| PUT | `/freelancers/:id` | |
| DELETE | `/freelancers/:id` | projects keep existing, freelancer set to null |

### Projects
| Method | Path | Notes |
|--------|------|-------|
| GET | `/projects` | **advanced filtering** — `status`, `clientId`, `freelancerId`, `minBudget`, `maxBudget`, `search`, `sortBy` (`createdAt\|budget\|deadline\|title`), `order` (`asc\|desc`), `page`, `limit`. Returns `{ total, page, limit, data: [...] }` |
| GET | `/projects/:id` | client, freelancer, milestones → tasks, plus `escrow: { allocated, inEscrow, released, unfunded }` |
| POST | `/projects` | `{ "title": "Landing page", "description": "...", "budget": 50000, "deadline": "2026-12-31", "clientId": 1, "freelancerId": 2 }` → 201 (`freelancerId` optional; if given, status = `in_progress`) |
| PUT | `/projects/:id` | `title, description, budget, deadline, freelancerId, status` — budget can't drop below planned milestones; can't cancel while money is in escrow |
| DELETE | `/projects/:id` | only if every milestone is still *pending* (else 409) |

### Milestones (escrow payments)
| Method | Path | Notes |
|--------|------|-------|
| GET | `/projects/:projectId/milestones` | with tasks |
| POST | `/projects/:projectId/milestones` | `{ "title": "Design", "amount": 15000, "dueDate": "2026-11-30" }` → 201, 422 if over budget |
| GET | `/milestones/:id` | with tasks + ledger entries |
| PUT | `/milestones/:id` | only while *pending* |
| DELETE | `/milestones/:id` | only while *pending* |
| POST | `/milestones/:id/action` | `{ "action": "fund" \| "submit" \| "release" \| "dispute" \| "refund" }` → updated milestone; 409 if not allowed from the current status |

### Tasks
| Method | Path | Body |
|--------|------|------|
| POST | `/milestones/:milestoneId/tasks` | `{ "title": "Build login page" }` → 201 |
| PUT | `/tasks/:id` | `{ "title": "...", "isDone": true }` |
| DELETE | `/tasks/:id` | → 204 |

### Ledger & raw-SQL reports
| Method | Path | Notes |
|--------|------|-------|
| GET | `/transactions` | `?projectId=&type=deposit\|release\|refund`, newest first |
| GET | `/reports/escrow-summary` | **raw SQL** (JOINs + conditional aggregation + GROUP BY); optional `clientId`, `freelancerId` → `{ totals, projects[] }` |
| GET | `/reports/freelancer-earnings` | **raw SQL** leaderboard: projects, total earned, currently in escrow |

---

## Folder structure

```
backend/
├── config/        config.js (env), database.js (Sequelize + MySQL)
├── models/        client, freelancer, project, milestone, task, escrowTransaction, index (associations)
├── controllers/   one file per resource + reportController (raw SQL)
├── routes/        index.js (all endpoints)
├── middleware/    errorHandler.js (validation / 404 / 409 mapping)
├── services/      escrow.js (budget & escrow totals)
├── migrations/    20261013000000-create-escrow-tables.js
├── scripts/       createDb.js, seed.js
├── tests/         smoke.js
├── app.js  server.js  .env  .sequelizerc

frontend/src/
├── components/    Navbar, ProjectCard, MilestoneCard, TaskList, MilestoneForm, StatusBadge, Toast, StateMessage, ProtectedRoute
├── context/       AppContext.jsx   (useReducer + useContext: session + toasts)
├── hooks/         useFetch.js      (useEffect data fetching)
├── pages/         Login, Dashboard, Projects, NewProject, ProjectDetail, People, Ledger, NotFound
├── api.js  App.jsx  main.jsx  styles.css
```

## Where each rubric item lives

**ISA-II:** DB connection `config/database.js` + `server.js` · migration `migrations/…` · associations `models/index.js` · validations `models/*.js` · CRUD with `findAll / findByPk / create / update / destroy` in `controllers/` · raw SQL `reportController.js` · advanced filtering `projectController.list`.

**ISA-III:** component hierarchy & props (`MilestoneCard → TaskList`, `ProjectCard`) · `useState` everywhere · global state `useReducer + useContext` (`AppContext.jsx`) · `useEffect` data fetching (`useFetch.js`) · routing with `Routes`/`Route`/`NavLink`/protected nested route (`App.jsx`) · `useRef` (autofocus in `NewProject`, `TaskList`, `MilestoneForm`) · `useMemo` (`Projects`, `Dashboard`, `Ledger`, `ProjectDetail`) · `useCallback` + `React.memo` (`ProjectDetail` → `MilestoneCard` / `TaskList`).

## 5-minute live demo script
1. Show the tables in MySQL Workbench / phpMyAdmin (`freelance_escrow`).
2. Sign in as Client → **New project** → submit the form → show the new row in MySQL.
3. Open it → **Add milestone** → show the row; try an amount above budget → red 422 message.
4. Assign a freelancer → **Fund escrow** → ledger row appears.
5. Sign out → sign in as Freelancer → **Submit work**.
6. Sign back in as Client → **Release payment** → project turns *completed*, Dashboard totals update.
