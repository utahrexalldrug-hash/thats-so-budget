# That's So Budget — Changelog

## v1.4.0 — March 12, 2026
**Deployment Migration**
- Migrated hosting from Netlify to Vercel with auto-deploy from GitHub
- Moved Firebase config to environment variables for security
- Added Firebase as explicit package.json dependency
- Created GitHub repo at utahrexalldrug-hash/thats-so-budget

**Deploy:** Vercel (auto-deploy from GitHub)

---

## v1.3.0 — March 10, 2026
**New Features**
- Split expenses: split a single receipt across multiple budget categories with receipt grouping
- Receipt group display in Activity tab — expandable grouped items showing store name, total, and per-category breakdown
- Search by amount in Activity tab (supports $, commas, partial matches)
- Search by date in Activity tab (short date, long date, numeric, ISO formats)
- Quick add floating action button on Activity page
- Search results banner showing match count and running total

**Bug Fixes**
- Fixed bill form amount field losing focus after every keystroke (extracted BillFormFields as standalone component)
- Fixed Bills tab showing "Feb 2026" instead of current month
- Fixed monthKey mismatch: transactions entered in Feb with March dates now correctly assigned to March
- Added fixMonthKeys() migration function to correct mismatched monthKeys on load
- Fixed AddTransaction to derive monthKey from transaction date instead of currentMonth state
- Fixed category percentage on Trends page — now shows % of budget used instead of % of total spending
- Progress bar caps at 100% width and turns red when over budget

**Deploy:** Netlify manual deploy

---

## v1.2.0 — March 4, 2026
**Bug Fixes**
- Fixed date picker defaulting to tomorrow instead of today (UTC timezone bug) — affected both manual entry and receipt scanner
- Fixed bill form focus jumping back to Name field while typing in other fields

**New Features**
- Added "Subscription" checkbox on bills — marks recurring expenses as subscriptions with a purple "SUB" badge
- Subscription flag persists through add/edit and syncs to Firestore

**Deploy:** Netlify manual deploy

---

## v1.1.0 — February 25, 2026
**Initial Netlify Deploy — Phase 1 & 2 Core Features**

- Monthly dashboard with running balance, spending breakdown, pie charts, income vs expenses bars
- Fixed bills & income tracker with recurring bills, due dates, paid/unpaid tracking
- Envelope categories (Food/Toiletries, Cleaning, Food Storage, K Money, S Money, Clothing, Family Entertainment, Dates, Gas)
- Smart receipt scanner powered by Claude API (whole receipt or per-item split modes)
- Manual quick-entry for expenses, income, and refunds
- Payment method tracking (SCC, KCC, debit, cash)
- Activity feed with search, filters by type/card/date range
- Trends page with budget vs actual, spending by category, payment method reconciliation
- Debt snowball/avalanche tracker with payoff projections
- Firebase Auth (email/password) with Firestore real-time sync
- PWA manifest for iPhone home screen install
- Bill categories (utilities, housing, giving, credit card, insurance, education, subscriptions, other) with custom category support
- Bill frequency options (monthly, biweekly, weekly) and recurrence (ongoing, one-time, 3/6/12 times)
- Variable bill amount tracking (estimate + adjust)
- Start date support for future bills
- Refund linking to original transactions
- Month navigation

**Deploy:** Netlify manual deploy

---

## v1.0.0 — February 24, 2026
**Project Spec Finalized**

- Project specification document created (Thats-So-Budget-Project-Spec.md)
- Tech stack decided: React + Tailwind CSS (PWA), Firebase (Auth + Firestore), Claude API (receipts), Netlify (hosting)
- Phase 1/2/3 feature roadmap defined
- Data model designed
- Budget categories and recurring bills imported from Budget.xlsx
