# Neon Ledger Frontend

Modern, responsive frontend for an expense tracking platform built with **Next.js App Router + TypeScript**.

Track daily spending, manage recurring charges, organize custom categories, and monitor budget buckets (`needs`, `wants`, `investments`) with a clean neon UI.

---

## Stack

- `Next.js 16` (App Router)
- `React 19`
- `TypeScript`
- `Tailwind CSS v4`

---

## Features

- Secure auth pages (register/login) integrated with cookie-based backend auth
- Protected application routes
- Dashboard with:
  - Monthly totals
  - Category mix
  - Budget bucket status cards
- Expense management:
  - Create, update, delete
  - Filter/search
  - Mobile-friendly listing
- Recurring charges:
  - Create, edit, stop
  - Animated modal workflow
- Category management:
  - Add/remove categories
  - Assign budget type (`needs`, `wants`, `investments`)
- Budget settings:
  - Set `needs/wants/investments` independently
- Global loading/error states and improved empty states

---

## Project Structure

```bash
src/
  app/
    auth/
    (protected)/
      dashboard/
      expenses/
      profile/
      settings/
  components/
    app/
    auth/
    ui/
  lib/
    apiClient.ts
    auth.api.ts
    user.api.ts
    expense.api.ts
    category.api.ts
    budget.api.ts
  types/
```

---

## Environment Variables

Create `frontend3/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

---

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

---

## Scripts

```bash
npm run dev      # start dev server
npm run build    # production build
npm run start    # run production server
npm run lint     # lint codebase
```

---

## Design Notes

- Dark neon theme (`#0D0D0D`, `#00FF85`, `#1E90FF`, `#FF0099`)
- Responsive layout with mobile bottom navigation
- Background fixed and non-repeating across scroll

---

## Backend Integration

This frontend is designed to work with a REST backend that exposes:

- `/auth/*`
- `/user/*`
- `/expenses/*`
- `/categories/*`
- `/budget/*`

All requests are routed through `src/lib/apiClient.ts`.

---

## License

Internal project use.
