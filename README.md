# NovaPOS — POS & Inventory Management System

A Laravel-based Point of Sale and Inventory Management system for small
businesses: dashboard, POS terminal, products, inventory, sales, orders,
purchases, customers/suppliers/staff, accounts (profit & loss), reports,
settings, and notifications.

This README is the **build roadmap** — every phase we'll work through, in
order, to take this from a wired-up UI shell to a fully working app. Check
items off as we complete them so it always reflects real project status.

---

## Tech Stack

- **Backend:** Laravel (PHP)
- **Frontend:** Plain HTML/CSS/JS + Bootstrap 5 (no React/Vue, no npm build
  step for the app UI itself — see `public/assets/`)
- **Charts:** Chart.js (CDN)
- **Icons:** Bootstrap Icons (CDN)

## Current Architecture (as of now)

- `resources/views/app.blade.php` — single Blade shell shared by every
  screen. Each route passes in an initial `view` key.
- `app/Http/Controllers/*Controller.php` — one controller per screen,
  each just renders the shell with its `view` key. No business logic yet.
- `routes/web.php` — one named route per screen (real URLs, not just
  in-page JS navigation).
- `public/assets/js/views/*.js` — one file per screen; each registers
  itself with `registerView()` and renders its own HTML/behavior.
- `public/assets/js/data.js` — **mock data only**. This is what every
  screen currently reads from. Replacing this is Phase 1–2 below.
- Login is a **client-side demo gate** (`public/assets/js/views/login.js`
  + `app.js`), persisted in `sessionStorage`. Not real auth yet.

---

## Roadmap

### Phase 0 — Foundation ✅ Done
- [x] Restructure bolt.new export into proper Laravel layout
      (`public/assets/`, Blade shell, controllers, routes)
- [x] Fix nav-tabs CSS collision (`.nav-item` → `.sidebar-nav-item`)
- [x] Give every screen a real, bookmarkable Laravel route
- [x] Persist demo login across page loads (`sessionStorage`)
- [x] Fill in missing screens referenced by nav but never generated
      (Orders, Accounts, Reports, Settings, Notifications — currently
      placeholders)

### Phase 1 — Database Schema
- [ ] Design ERD: products, categories, brands, units, customers,
      suppliers, staff/users, roles & permissions, sales, sale_items,
      purchases, purchase_items, orders, order_items, expenses,
      expense_categories, stock_movements, cash_register_shifts,
      payments, taxes
- [ ] Write migrations for all tables above
- [ ] Write model classes with relationships (`Product belongsTo
      Category`, `Sale hasMany SaleItems`, etc.)
- [ ] Seed realistic demo data (replacing `data.js` as the source of
      truth) via seeders/factories

### Phase 2 — Real Authentication & Roles
- [ ] Replace the mock login gate with real Laravel auth (session-based)
- [ ] `users` table with roles: Admin, Cashier, Accountant, Manager
- [ ] Role & permissions matrix (per module: view/add/edit/delete)
- [ ] Route middleware to protect screens by role
- [ ] Real logout, password reset

### Phase 3 — Products, Categories, Brands, Units
- [ ] CRUD endpoints/controllers backed by the database
- [ ] Image upload handling
- [ ] Barcode/SKU generation + barcode label printing
- [ ] Wire `products.js` to real endpoints instead of `data.js`

### Phase 4 — Inventory / Stock
- [ ] Stock levels per product (and per warehouse, if multi-location)
- [ ] Stock adjustment flow (increase/decrease with reason + audit log)
- [ ] Stock transfer between locations (if applicable)
- [ ] Low-stock / out-of-stock triggers feeding the dashboard + notifications

### Phase 5 — POS Terminal (core business logic)
- [ ] Real checkout flow: cart → payment → sale record → stock deduction
- [ ] Split payments, discounts, tax calculation
- [ ] Held/parked orders persisted (not just in-memory)
- [ ] Cash register / shift open-close with expected vs counted cash
- [ ] Receipt generation (print + PDF)

### Phase 6 — Sales & Returns
- [ ] Sales history backed by real records
- [ ] Sale detail view with real itemized data
- [ ] Returns/refunds flow with restock toggle
- [ ] Fix known regression: dashboard "recent sale" row click should
      deep-link to `/sales?sale=ID` and auto-open that sale's detail

### Phase 7 — Purchases
- [ ] Purchase order creation against real suppliers/products
- [ ] Goods Received Note (partial receiving supported), auto stock update
- [ ] Purchase returns

### Phase 8 — People (Customers, Suppliers, Staff)
- [ ] Real CRUD for customers, suppliers, staff
- [ ] Customer ledger (purchase history + outstanding due)
- [ ] Supplier ledger (purchase history + outstanding payable)
- [ ] Make `/people` tabs deep-linkable (`/people?tab=suppliers`)

### Phase 9 — Orders
- [ ] Order lifecycle (pending → processing → ready → completed/cancelled)
- [ ] Order status board backed by real data
- [ ] Packing slip / invoice printing

### Phase 10 — Accounts (Finance)
- [ ] Real Profit & Loss calculation (revenue, COGS, gross/net profit)
      for a selectable date range
- [ ] Expenses CRUD + categories
- [ ] Accounts Receivable / Payable summaries with "Record Payment"
- [ ] Cash register shift history

### Phase 11 — Reports
- [ ] Sales report (by date/product/category/staff/customer)
- [ ] Inventory valuation report
- [ ] Best/worst selling products
- [ ] Export to PDF/CSV

### Phase 12 — Settings
- [ ] Business profile (name, logo, address, currency, invoice numbering)
- [ ] Tax rates, payment methods, units of measurement
- [ ] Receipt/invoice template settings
- [ ] Low-stock threshold + notification preferences

### Phase 13 — Notifications
- [ ] Real, database-backed notifications (not the current static mock list)
- [ ] Triggers: low stock, new order, payment received, shift reminders
- [ ] Mark as read/unread, filter by type

### Phase 14 — Polish & Launch Readiness
- [ ] Form validation on the backend for every module (matching the
      frontend validation already in place)
- [ ] Automated tests for core flows (checkout, stock deduction, P&L)
- [ ] Performance pass on large product/sales lists (pagination is
      already in the UI — wire it to real paginated queries)
- [ ] Production `.env` setup, deployment

---

## Local Setup

```bash
composer install
cp .env.example .env
php artisan key:generate
# configure your database in .env, then:
php artisan migrate --seed   # once Phase 1 migrations/seeders exist
npm install && npm run dev   # only needed for Laravel's own Vite pipeline;
                              # the POS UI itself (public/assets/) needs no build step
php artisan serve
```

---

## Working Agreement

We're going phase by phase, in the order above — not jumping ahead to a
later phase before the current one is solid. Each phase should end with
working, testable functionality before moving to the next. Update the
checkboxes in this file as we complete items so it stays an accurate
source of truth for project status.
