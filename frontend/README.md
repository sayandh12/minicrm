# MiniCRM Frontend — React + Vite

## Stack
- **React 18** + **Vite**
- **React Router v6** — protected routes, nested layouts
- **Zustand** — auth state (persisted to localStorage)
- **TanStack Query** — data fetching, caching, background sync
- **React Hook Form** + **Zod** — form validation
- **Recharts** — dashboard charts
- **Axios** — HTTP client with JWT interceptors + auto-refresh

## Project Structure

```
src/
├── api/             # Axios client + per-module API functions
│   ├── axiosClient.js    # Base client with JWT attach + refresh logic
│   ├── authApi.js
│   ├── leadsApi.js
│   ├── crmApi.js
│   ├── hrmApi.js
│   └── dashboardApi.js
├── store/
│   └── authStore.js      # Zustand auth store (persisted)
├── routes/
│   ├── AppRouter.jsx     # All routes
│   └── ProtectedRoute.jsx
├── components/
│   ├── common/           # Button, Input, Badge, Modal, Table...
│   └── layout/           # AppLayout, Sidebar, Topbar + all CSS
├── pages/
│   ├── Auth/             # Login, UserManagement
│   ├── Dashboard/        # Stats, charts, activity feed
│   ├── Leads/            # LeadList, LeadForm, LeadDetail
│   ├── CRM/              # CustomerList, CustomerDetail
│   └── HRM/              # EmployeeList, LeaveList
└── utils/
    ├── constants.js      # Enums, labels
    └── formatters.js     # Date, currency, text helpers
```

## Quick Start

```bash
# Install dependencies
npm install

# Create env file
cp .env .env.local
# Edit VITE_API_URL if backend runs on a different port

# Start dev server
npm run dev
# App: http://localhost:3000

# Production build
npm run build
```

## Docker

```bash
# From project root
docker-compose up --build
# Frontend: http://localhost:3000
```

## Authentication Flow

1. User logs in → receives `access_token` (30 min) + `refresh_token` (7 days)
2. Zustand stores both tokens in `localStorage`
3. Axios interceptor attaches `Bearer` token to every request
4. On 401 response → interceptor auto-refreshes token in background
5. Failed refresh → logout + redirect to `/login`

## Role-Based Access

| Role           | Leads | Customers | Employees | Leave Review | Users |
|----------------|-------|-----------|-----------|-------------|-------|
| Admin          | ✅    | ✅        | ✅        | ✅          | ✅   |
| Sales Manager  | ✅    | ✅        | ❌        | ❌          | ❌   |
| Sales Exec     | ✅    | ✅        | ❌        | ❌          | ❌   |
| HR Executive   | ❌    | ❌        | ✅        | ✅          | ❌   |
| Employee       | ❌    | ❌        | ❌        | ❌          | ❌   |

All employees can apply for leave and see their own leave history.
