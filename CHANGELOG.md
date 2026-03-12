# That's So Budget — Changelog

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
