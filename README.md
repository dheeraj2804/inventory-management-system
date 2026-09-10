# Inventory Management System

A full-stack inventory management application developed by **Dheeraj Reddy Arjula** for **Gades Sales Co.**, and maintained as a personal software project. It brings product records, suppliers, purchasing, sales, stock movements, and business summaries into one web interface.

The project uses a Next.js frontend and an Express API backed by PostgreSQL and Prisma. This README describes the implementation currently in the repository, including the work still needed before a production rollout.

![Gades inventory dashboard showing sample sales, stock health, and recent activity](docs/overview.png)

*Dashboard preview with fictional demo data.*

## Contents

- [Try the demo](#try-the-demo)
- [Features](#features)
- [Technology stack](#technology-stack)
- [Architecture and project structure](#architecture-and-project-structure)
- [Local setup](#local-setup)
- [Using the application](#using-the-application)
- [Inventory calculations](#inventory-calculations)
- [Database models](#database-models)
- [API reference](#api-reference)
- [Development commands](#development-commands)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Current limitations and improvement priorities](#current-limitations-and-improvement-priorities)
- [Contributing](#contributing)
- [Author and licensing](#author-and-licensing)

## Try the demo

Run the frontend and choose **Explore the demo** on the login page. No database, API server, or account is required for demo mode:

```bash
cd client
npm ci
npm run dev
```

Open [localhost:3000/login](http://localhost:3000/login). The sample workspace includes 24 industrial-supply products, six categories, four suppliers, 34 purchases, 34 sales, and matching stock movements. Four products need attention, including one out of stock. Transaction dates are generated relative to the first demo visit.

Demo mode supports product/category/supplier management, purchases, sales, history, search, and CSV exports. Edits persist in this browser under `gades-demo-v1`. A visible banner identifies sample data; **Reset demo** restores it after confirmation. Log out and sign in to use the live API. Demo operations are intercepted locally and never sent to PostgreSQL. Treat the demo as a single-browser playground, not a shared database.

### Workspace experience

- Responsive sidebar, breadcrumbs, quick actions, and a mobile navigation drawer.
- **Cmd/Ctrl + K** opens keyboard-accessible search for pages, product names, and SKUs.
- Stock alerts link directly to filtered product lists.
- Dashboard charts use actual dated transaction totals, with 7/30/90-day and product filters.
- Inventory-health visualization, category breakdowns, recent activity, and restock links.
- Gentle page/card transitions and a floating login illustration; reduced-motion preferences disable animation.
- Loading skeletons, route prefetching, and hover/focus data prefetching.
- Live GET requests share an account-scoped, 15-second in-memory cache. Concurrent reads are deduplicated; successful writes and logout invalidate it. A dashboard refresh forces fresh data. Changes made by other clients may take up to the cache lifetime to appear when a page fetches again.

For representative navigation performance, use `npm run build` followed by `npm run start` inside `client/`. Development mode compiles routes on demand and does not provide the same prefetch behavior as a production build.

## Features

| Area | Current functionality |
| --- | --- |
| Dashboard | Product, category, and supplier counts; stock totals; inventory value; purchase and sales totals; recorded profit; low-stock items; recent activity; charts with optional product filtering. |
| Products | Create, view, edit, and delete products; unique SKU; optional barcode and description; category and supplier associations; cost and selling prices; stock thresholds and units. |
| Product discovery | Search by product name or SKU, filter by category or supplier, show low-stock products, and export the filtered list to CSV. |
| Categories | Create, list, edit, and delete product categories. |
| Suppliers | Manage supplier names, contact information, and addresses. |
| Purchases | Record purchases with multiple line items, increase stock, update product cost, and view purchase history. |
| Sales | Record multi-item sales with an optional customer name, check available stock, decrease stock, capture cost at sale, and view sales history. |
| Stock movements | View purchase-related stock entries and sale-related stock exits; search, filter, and export movement records to CSV. |
| Login | Register through the API, log in through the UI, issue JWTs, store a browser session, and log out. Backend access enforcement remains unfinished; see [current limitations](#current-limitations-and-improvement-priorities). |

## Technology stack

Versions below reflect the package manifests; the committed lockfiles determine the installed dependency versions.

| Layer | Technologies |
| --- | --- |
| Frontend | Next.js 16.2.1, React 19.2.4, TypeScript |
| Styling | Tailwind CSS 4 |
| Charts and notifications | Recharts 3, React Hot Toast 2 |
| HTTP client | Axios 1 |
| Backend | Node.js, Express 5, TypeScript, `tsx` |
| Database | PostgreSQL |
| Data access | Prisma 7.6, PostgreSQL driver adapter, `pg` |
| Login primitives | JSON Web Tokens and bcrypt password hashing |
| Tooling | npm lockfiles, ESLint, Prisma migrations and Studio |

## Architecture and project structure

```mermaid
flowchart LR
    Browser[Browser] --> UI[Next.js frontend: localhost:3000]
    UI -->|Axios HTTP requests| API[Express API: localhost:5001/api]
    API --> Prisma[Prisma with PostgreSQL adapter]
    Prisma --> DB[(PostgreSQL)]
```

The frontend and backend are separate npm projects. There is no root-level package script that starts both services.

```text
inventory-management-system/
├── README.md
├── .gitignore
├── client/
│   ├── app/                    # Next.js pages and global styles
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── products/           # Includes products/add
│   │   ├── categories/
│   │   ├── suppliers/
│   │   ├── purchases/          # Includes purchases/history
│   │   ├── sales/              # Includes sales/history
│   │   └── stock-movements/
│   ├── components/             # AppShell, Sidebar, AuthGuard
│   ├── src/lib/                # Axios instance and browser auth helpers
│   ├── public/                 # Static assets
│   └── package.json
└── server/
    ├── prisma/
    │   ├── schema.prisma       # Database models and client generator
    │   └── migrations/         # Committed database migrations
    ├── prisma.config.ts        # Prisma CLI configuration
    ├── src/
    │   ├── config/             # Database client setup
    │   ├── controllers/        # Request handlers and business logic
    │   ├── routes/             # API route declarations
    │   ├── middleware/         # Authentication middleware placeholder
    │   ├── generated/prisma/   # Generated locally; excluded from Git
    │   └── server.ts           # Express entry point
    └── package.json
```

## Local setup

### 1. Prerequisites

- Git and access to this private GitHub repository.
- A Node.js version supported by the committed Next.js and Prisma dependencies, such as **Node.js 22.12 or newer within the 22.x release line**, with npm.
- A running PostgreSQL instance and credentials for a dedicated development database.
- Two terminal windows, one for each service.

No live database contents, preconfigured live user accounts, or secrets are included in the repository. A PostgreSQL seed script is not provided; browser demo fixtures are available separately.

### 2. Clone the repository

```bash
git clone https://github.com/dheeraj2804/inventory-management-system.git
cd inventory-management-system
```

### 3. Install dependencies

Run from the repository root:

```bash
npm ci --prefix server
npm ci --prefix client
```

Use `npm ci` for an installation based on the committed lockfiles. Run commands for a specific service inside its directory or supply the corresponding npm prefix.

### 4. Configure the database and environment

Create a PostgreSQL database named `inventory_management` using your database administration tool. If the PostgreSQL CLI is installed and your local role has permission, you can use:

```bash
createdb inventory_management
```

Create a file named `server/.env` with the following values, replacing the placeholders with your own local credentials:

```dotenv
DATABASE_URL="postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@localhost:5432/inventory_management"
JWT_SECRET="REPLACE_WITH_A_LONG_RANDOM_SECRET"
PORT=5001
```

| Variable | Purpose | Required/default |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma CLI and the application. URL-encode special characters in credentials. | Required |
| `JWT_SECRET` | Secret used to sign login tokens. | Required for login |
| `PORT` | Express listening port. | Defaults to `5001` |

To generate a random JWT secret locally:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Paste the generated value into your local `.env`. Environment files are excluded from version control.

The frontend defaults to `http://localhost:5001/api`. To use a different API address, create `client/.env.local` with:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

This is a public frontend setting; never put secrets in `NEXT_PUBLIC_` variables. Restart the dev server or rebuild the production frontend after changing it. The API is not needed in demo mode.

### 5. Apply migrations and generate Prisma Client

```bash
cd server
npx prisma migrate deploy
npx prisma generate
```

`migrate deploy` applies the migrations already committed to the repository. `prisma generate` creates the client in `server/src/generated/prisma`, which is intentionally absent from a fresh clone. Run generation again after changes to the Prisma schema.

For future schema changes during development, use `npm run prisma:migrate -- --name describe_your_change`, then run `npx prisma generate`. Commit the resulting migration along with the schema change.

### 6. Start the API

From `server/`:

```bash
npm run dev
```

The API binds to `127.0.0.1` and defaults to port `5001`. Check it with:

```bash
curl http://127.0.0.1:5001/
```

Expected response:

```text
Inventory Management System API is running
```

This root endpoint checks that the HTTP server responds; it does not test database connectivity.

### 7. Create a local account

There is no registration page or seeded administrator. With the API running, register a development account through the API:

```bash
curl -X POST http://127.0.0.1:5001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Local Developer",
    "email": "developer@example.com",
    "password": "REPLACE_WITH_YOUR_LOCAL_PASSWORD",
    "role": "admin"
  }'
```

Replace the sample password before running the command. Reusing the same email returns `User already exists`. The role is currently stored as a string; it does not enforce permissions.

### 8. Start the frontend

In a second terminal, from the repository root:

```bash
cd client
npm run dev
```

Open [the login page](http://localhost:3000/login) and sign in using the account created above. The frontend development script uses Webpack and binds to `localhost:3000`.

## Using the application

Start with the following workflow on a new database:

1. **Create a category** to organize products.
2. **Create a supplier** for purchase records.
3. **Add a product** with a unique SKU, category, unit, prices, and minimum stock level. Use zero initial stock if you want incoming units represented by a purchase movement.
4. **Record a purchase** with a supplier and one or more product lines. Each line contains a quantity and unit cost.
5. **Record a sale** with one or more product lines. The API checks product availability and records stock exits.
6. **Review history and stock movements** to inspect the recorded transactions.
7. **Open the dashboard** to review totals, low-stock products, and charts.

Purchase and sale forms currently accept a numeric `Created By` value and default it to `1`. Use the ID returned for your local account; the backend does not yet derive this value from the login token.

| Page | Route |
| --- | --- |
| Login | `/login` |
| Dashboard | `/dashboard` |
| Products | `/products` |
| Add product | `/products/add` |
| Categories | `/categories` |
| Suppliers | `/suppliers` |
| Record purchase | `/purchases` |
| Purchase history | `/purchases/history` |
| Record sale | `/sales` |
| Sales history | `/sales/history` |
| Stock movements | `/stock-movements` |

## Inventory calculations

Purchase and sale writes use Prisma transactions to group each transaction record, its line items, and stock updates.

| Calculation | Current behavior |
| --- | --- |
| Purchase subtotal | `quantity × unitCost` |
| Purchase total | Sum of purchase line subtotals. |
| Stock after purchase | Existing stock plus purchased quantity. |
| Product cost after purchase | Replaced by that purchase line's unit cost; no weighted-average costing. |
| Sale subtotal | `quantity × unitPrice`; omitted unit price defaults to the product selling price. |
| Stock after sale | Existing stock minus sold quantity. |
| Recorded line profit | `quantity × (unitPrice − unitCostAtSale)` |
| Inventory value | Sum of `currentStock × costPrice` across products. |
| Low stock | `currentStock <= minStockLevel` |

Sale items retain `unitCostAtSale`, so their recorded profit does not change when a later purchase changes the product's cost. This profit calculation does not account for taxes, operating expenses, or other accounting adjustments.

Purchases generate `IN` movements with a `PURCHASE` reference; sales generate `OUT` movements with a `SALE` reference. Directly setting initial stock or editing product stock does not currently generate a movement record. Transactions alone do not resolve the concurrent stock-update limitations described below.

## Database models

The schema is defined in [`server/prisma/schema.prisma`](server/prisma/schema.prisma).

| Model | Purpose and relationships |
| --- | --- |
| `User` | Name, unique email, hashed password, role, and creation time. |
| `Category` | Product grouping; one category can contain many products. |
| `Supplier` | Supplier contact details; linked to products and purchases. |
| `Product` | Unique SKU, optional barcode, prices, stock, unit, required category, and optional supplier. |
| `Purchase` | Supplier, total, date, creator ID, and purchase items. |
| `PurchaseItem` | Product, quantity, unit cost, and subtotal for a purchase. |
| `Sale` | Optional customer name, total, date, creator ID, and sale items. |
| `SaleItem` | Product, quantity, price, captured cost, subtotal, and profit for a sale. |
| `StockMovement` | Product, movement direction, quantity, transaction reference, note, creator ID, and timestamp. |

Monetary values currently use Prisma `Float`. Creator IDs and movement reference IDs are stored as scalar fields rather than foreign-key relationships to users or transaction records. Products referenced by transaction history cannot simply be deleted because the database restricts those deletions.

## API reference

Default base URL: `http://localhost:5001/api`. Send JSON bodies with `Content-Type: application/json`.

The frontend attaches `Authorization: Bearer <token>` when a token is stored. The API routes currently do **not** verify that token; see [current limitations](#current-limitations-and-improvement-priorities).

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/auth/register` | Register a user. |
| `POST` | `/auth/login` | Authenticate credentials and issue a token valid for one day. |
| `GET` | `/categories` | List categories. |
| `POST` | `/categories` | Create a category. |
| `PUT` | `/categories/:id` | Update a category. |
| `DELETE` | `/categories/:id` | Delete a category. |
| `GET` | `/suppliers` | List suppliers. |
| `POST` | `/suppliers` | Create a supplier. |
| `PUT` | `/suppliers/:id` | Update a supplier. |
| `DELETE` | `/suppliers/:id` | Delete a supplier. |
| `GET` | `/products` | List products with category and supplier details. |
| `POST` | `/products` | Create a product. |
| `PUT` | `/products/:id` | Update a product. |
| `DELETE` | `/products/:id` | Delete an eligible product. |
| `GET` | `/purchases` | List purchases with supplier and item details. |
| `POST` | `/purchases` | Record a purchase and incoming stock. |
| `GET` | `/sales` | List sales with item details. |
| `POST` | `/sales` | Record a sale and outgoing stock. |
| `GET` | `/stock-movements` | List stock movements. |
| `GET` | `/dashboard/summary` | Retrieve inventory and transaction totals. |
| `GET` | `/dashboard/recent-purchases` | Retrieve the five most recent purchases. |
| `GET` | `/dashboard/recent-sales` | Retrieve the five most recent sales. |
| `GET` | `/dashboard/recent-movements` | Retrieve recent stock movements. |
| `GET` | `/dashboard/analytics` | Retrieve chart data and totals; optional `?productId=1`. |

List endpoints do not currently implement server-side pagination. Purchase and sale edit/delete endpoints are not implemented.

### Example request bodies

Replace example IDs with existing records in your database.

**Create a product — `POST /api/products`:**

```json
{
  "name": "Sample Product",
  "sku": "SAMPLE-001",
  "description": "Development example",
  "categoryId": 1,
  "supplierId": 1,
  "costPrice": 10,
  "sellingPrice": 15,
  "currentStock": 0,
  "minStockLevel": 5,
  "unit": "pcs"
}
```

**Record a purchase — `POST /api/purchases`:**

```json
{
  "supplierId": 1,
  "createdBy": 1,
  "items": [
    { "productId": 1, "quantity": 20, "unitCost": 10 }
  ]
}
```

**Record a sale — `POST /api/sales`:**

```json
{
  "customerName": "Sample Customer",
  "createdBy": 1,
  "items": [
    { "productId": 1, "quantity": 3, "unitPrice": 15 }
  ]
}
```

With a starting stock of zero, these example transactions leave 17 units, a purchase total of 200, a sale total of 45, and recorded sale profit of 15.

Successful purchase and sale creation return status `201` with a message and the created transaction header. Their list endpoints include line-item details. Error responses commonly contain a `message` and sometimes an `error`; validation and status-code handling are not yet consistent across endpoints.

## Development commands

### Frontend — run inside `client/`

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the development server on `localhost:3000` with Webpack. |
| `npm run build` | Attempt a production frontend build. |
| `npm run start` | Serve an existing production frontend build. |
| `npx eslint .` | Invoke ESLint directly using the checked-in configuration. |
| `npx tsc --noEmit` | Check TypeScript without emitting files. |

`npm run lint` runs ESLint, and `npm run typecheck` runs TypeScript checks. Additional frontend checks:

```bash
npm test
npm run format:check
npx playwright install chromium
npm run test:e2e
```

The unit suite checks demo inventory reconciliation, transaction validation, historical costing, deletion rules, and cache isolation/invalidation. Browser tests build the production frontend and start it on port 3100, then exercise demo CRUD, purchases/sales, persistence, CSV downloads, search, chart controls, mobile navigation, and reduced motion. The tests block API calls to verify demo isolation. A frontend GitHub Actions workflow runs these checks on pushes and pull requests. Tests do not certify the existing live backend.

### Backend — run inside `server/`

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the API with `tsx watch`. |
| `npm run prisma:migrate -- --name change_name` | Create/apply a migration during local schema development. |
| `npm run prisma:studio` | Open Prisma Studio to inspect the configured database. |
| `npx prisma migrate deploy` | Apply committed migrations. |
| `npx prisma generate` | Generate the application database client. |
| `npx prisma validate` | Validate the Prisma schema and configuration. |
| `npx tsc --noEmit` | Check backend TypeScript without emitting files. |

There is no backend production build/start script or root workspace configuration. The frontend has unit/browser tests and CI; the backend still needs its own integration and authorization suite.

## Verification

For a manual check using a fresh development database:

1. Start both services and confirm that the API root responds.
2. Register an account and log in through the browser.
3. Create a category, supplier, and product with zero initial stock.
4. Purchase 20 units at a cost of 10 each; verify stock becomes 20 and an `IN` movement appears.
5. Sell 3 units at 15 each; verify stock becomes 17, an `OUT` movement appears, and recorded profit is 15.
6. Check purchase history, sales history, and dashboard totals against those transactions.
7. Try a single sale line exceeding available stock; confirm that it is rejected and stock remains unchanged.
8. Exercise product search/filtering and inspect an exported CSV.
9. Log out and confirm the browser redirects to login when opening a protected page.

Use a dedicated test database for these writes. The automated browser suite covers the corresponding demo flow. This manual live-data checklist does not verify concurrent requests or server-side authorization.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Private repository cannot be cloned | Verify GitHub authentication and repository access. |
| Dependency installation reports an unsupported Node version | Check the `engines` requirements for the installed Next.js and Prisma packages and use a compatible Node version. |
| Missing `DATABASE_URL` | Create `server/.env` and run Prisma/backend commands from `server/`. |
| Cannot connect to PostgreSQL | Check that PostgreSQL is running and that the database, credentials, host, port, and any required SSL settings match the connection string. |
| Missing database tables | Apply committed migrations against the database configured in `DATABASE_URL`. |
| Cannot find the generated Prisma client | Run `npx prisma generate` inside `server/`, then restart the API. |
| Login fails on an empty database | Register an account through the API; no default account is included. |
| Token signing fails | Set a nonempty `JWT_SECRET` in `server/.env` and restart the API. |
| Browser reports a network error | Confirm the backend is running and the URL in `client/src/lib/api.ts` matches its port. |
| Port is already in use | Stop the conflicting local service or select another port; keep the frontend API URL in sync. |
| Product deletion fails | Check whether the product is referenced by purchases, sales, or stock movement history. |
| First navigation is slow in development | Routes compile on demand. Use `npm run build` and `npm run start` to check production behavior. |
| API works locally but cannot be reached from another device | It currently binds to `127.0.0.1`. Deployment requires an explicit host/network configuration change and the access-control work below. |

## Current limitations and improvement priorities

This is an actively developed application. The repository does not establish production readiness or compliance certification. The following priorities come from the current implementation:

1. **Backend authentication and authorization:** `server/src/middleware/auth.middleware.ts` is empty and business routes do not verify JWTs. The browser guard checks only whether a token exists; demo mode uses a clearly separate local token. Registration accepts a caller-supplied role and defaults to `admin`. Implement server-side token verification, controlled account creation, and role enforcement before exposing business data.
2. **Account response handling:** Registration and login return the full database user object, including the password hash. Return only approved public fields and improve session expiry handling; tokens and user data currently live in browser local storage.
3. **Input validation and attribution:** Enforce positive integer quantities, valid prices and IDs, and consistent error responses on the backend. Derive `createdBy` from the authenticated user instead of trusting form input.
4. **Concurrent stock updates:** Purchase and sale handlers read stock and then write a calculated value. Add concurrency-safe updates and handle duplicate product lines so simultaneous or repeated requests cannot corrupt stock or oversell.
5. **Money and stock history:** Replace floating-point monetary storage with an appropriate decimal representation. Record explicit movements for opening stock and manual adjustments so history reconciles with product balances.
6. **Live backend verification:** Frontend builds, type checks, linting, demo transaction/cache tests, and browser tests are now configured. Add integration and authorization tests against a dedicated PostgreSQL test database.
7. **Deployment configuration:** The frontend API URL is configurable. Add backend production scripts, explicit allowed origins, appropriate network binding, secret management, and database backup procedures. The API currently uses unrestricted `cors()`.
8. **Scale and maintainability:** Add server-side pagination and database-side aggregation where appropriate; list and summary handlers currently retrieve collections into application memory.

## Contributing

Keep improvements reviewable through feature branches and pull requests:

```bash
git switch main
git pull --ff-only
git switch -c feature/describe-your-change
```

Make a focused change, run the applicable checks, and include setup or schema changes in the documentation. Commit Prisma migrations when changing the database schema. Keep credentials, database exports, `node_modules`, build output, and generated Prisma files out of commits.

A pull request should explain the problem, resulting behavior, verification performed, and any remaining limitations. Do not claim tests passed unless they were run successfully.

## Author and licensing

Developed by **Dheeraj Reddy Arjula** during my time at **Gades Sales Co.**, and maintained as a personal project.

GitHub: [dheeraj2804](https://github.com/dheeraj2804)

The repository currently has no root `LICENSE` file. Although `server/package.json` declares `ISC`, a repository-wide license has not been documented. Confirm the intended licensing and usage terms before redistribution.
