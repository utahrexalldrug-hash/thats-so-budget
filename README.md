# That's So Budget

Your household budget, simplified.

A progressive web app for tracking expenses, income, bills, and budgets with envelope-style category management, receipt scanning, and real-time sync.

## Features

- Monthly dashboard with spending breakdown, pie charts, and income vs expenses
- Envelope-style budget categories with progress tracking
- Smart receipt scanner powered by Claude API (whole receipt or per-item split)
- Split expenses across multiple categories with receipt grouping
- Fixed bills & income tracker with recurring bills, due dates, and subscription tagging
- Activity feed with search by name, amount, or date
- Trends page with budget vs actual and payment method reconciliation
- Debt snowball/avalanche tracker with payoff projections
- Firebase Auth with Firestore real-time sync across devices
- PWA — installable on iPhone and Android home screens

## Tech Stack

- **Frontend:** React 19, Tailwind CSS 4, Framer Motion, Recharts
- **Backend:** Firebase Auth + Firestore
- **AI:** Claude API for receipt scanning
- **Build:** Vite 7
- **Hosting:** Vercel (auto-deploys from GitHub)

## Getting Started

```bash
npm install
npm run dev
```

Create a `.env` file with your Firebase config:

```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Deploy

Push to `main` and Vercel auto-deploys. Environment variables are configured in the Vercel dashboard.
