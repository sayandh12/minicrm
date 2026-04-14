# MiniCRM — Full Stack Business Application

> Built for the **Code7 Information Technology** Technical Assessment  
> Stack: FastAPI · PostgreSQL · React · Docker

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Running with Docker (Recommended)](#running-with-docker-recommended)
  - [Running Locally (Without Docker)](#running-locally-without-docker)
- [Demo Credentials](#demo-credentials)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Role-Based Access Control](#role-based-access-control)
- [Security](#security)
- [Backup Plan](#backup-plan)
- [Known Limitations](#known-limitations)

---

## Overview

MiniCRM is a mini business application covering three core modules:

| Module | Description |
|--------|-------------|
| **Lead Management** | Create, assign, update, search, filter, and track lead status through a full pipeline |
| **CRM** | Convert qualified leads into customers and maintain a full activity history |
| **HRM Lite** | Employee records with a complete leave request and approval workflow |

A role-based access system controls what each user can see and do, and a real-time dashboard surfaces key metrics, follow-up reminders, and recent activity.

---

## Features

### Lead Management
- Create and edit lead records with contact info, source, estimated value, and notes
- Track leads through 7 pipeline stages: New → Contacted → Qualified → Proposal → Negotiation → Converted → Lost
- Assign leads to sales users; auto-log status changes as activity entries
- Set follow-up dates; dashboard highlights leads due today
- Search by name, email, or company; filter by status or source
- One-click lead-to-customer conversion (atomic, with audit trail)

### CRM
- Customer records auto-populated from converted leads
- Full activity history: calls, emails, meetings, notes, follow-ups
- Edit customer details and total deal value
- Paginated and searchable customer list

### HRM Lite
- Employee profiles linked to user accounts with department, designation, salary, and employment type
- Leave request workflow: submit → pending → approved/rejected
- HR executives review and act on pending requests with optional rejection reasons
- Employees can view their own leave history; HR sees all requests
- Cancellation of pending requests by the employee

### Dashboard
- Live counts: total leads by status, customers, pending leaves, pipeline value
- Bar chart of lead distribution across stages
- Recent activity feed (last 8 entries across all modules)
- Today's follow-up reminders

### Administration
- Admin-only user management: create users, assign roles, activate/deactivate accounts
- Auto-seeded admin account on first startup

---

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | Async REST API framework |
| **SQLAlchemy 2.x** (async) | ORM with full async support |
| **PostgreSQL 16** | Primary database |
| **Alembic** | Database migrations |
| **Pydantic v2** | Request/response validation |
| **python-jose** | JWT token generation and validation |
| **passlib[bcrypt]** | Password hashing |
| **asyncpg** | Async PostgreSQL driver |
| **uvicorn** | ASGI server |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **Vite** | Build tool and dev server |
| **React Router v6** | Client-side routing with protected routes |
| **Zustand** | Auth state management (persisted) |
| **TanStack Query** | Server state, caching, background sync |
| **Axios** | HTTP client with JWT interceptors |
| **React Hook Form + Zod** | Form handling and validation |
| **Recharts** | Dashboard data charts |
| **react-hot-toast** | Notification toasts |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **Docker + Docker Compose** | Local development and production deployment |
| **Nginx** | Frontend static file serving and API proxy |

---

## Project Structure

```
minicrm/
├── docker-compose.yml
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── endpoints/       # auth, leads, customers, employees, leaves, dashboard
│   │   │   └── router.py
│   │   ├── core/
│   │   │   ├── config.py        # Pydantic settings from .env
│   │   │   ├── security.py      # JWT creation and verification
│   │   │   └── dependencies.py  # get_current_user, RBAC role guards
│   │   ├── db/
│   │   │   ├── base.py          # DeclarativeBase + AuditMixin
│   │   │   ├── session.py       # Async engine and session factory
│   │   │   └── init_db.py       # Admin user seed on startup
│   │   ├── models/              # SQLAlchemy ORM: User, Lead, Customer, Activity, Employee, LeaveRequest
│   │   ├── schemas/             # Pydantic v2 request/response schemas
│   │   ├── crud/                # Generic CRUDBase + model-specific operations
│   │   ├── services/            # Business logic: lead creation, conversion, leave workflow
│   │   └── main.py              # FastAPI app, CORS, lifespan, global error handler
│   ├── alembic/                 # Database migration scripts
│   ├── tests/                   # pytest-asyncio test suite
│   ├── schema.sql               # Raw PostgreSQL DDL with indexes and triggers
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/                 # Axios client + per-module API functions
    │   ├── store/               # Zustand auth store (JWT + user persisted)
    │   ├── routes/              # AppRouter + ProtectedRoute (role-aware)
    │   ├── components/
    │   │   ├── common/          # Button, Input, Badge, Modal, Table, Pagination...
    │   │   └── layout/          # AppLayout, Sidebar, Topbar + global styles
    │   ├── pages/
    │   │   ├── Auth/            # Login, UserManagement
    │   │   ├── Dashboard/       # Stats, charts, activity feed
    │   │   ├── Leads/           # LeadList, LeadForm, LeadDetail
    │   │   ├── CRM/             # CustomerList, CustomerDetail
    │   │   └── HRM/             # EmployeeList, LeaveList
    │   └── utils/               # Constants (enums/labels) + formatters (date, currency)
    ├── Dockerfile
    ├── nginx.conf
    └── package.json
```

---

## Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Docker | 24+ |
| Docker Compose | v2+ |
| Node.js *(local only)* | 20+ |
| Python *(local only)* | 3.11+ |
| PostgreSQL *(local only)* | 16+ |

---

### Running with Docker (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/minicrm.git
cd minicrm

# 2. Configure backend environment
cp backend/.env.example backend/.env
# Edit backend/.env — at minimum set a strong SECRET_KEY

# 3. Start all services
docker-compose up --build

# Services:
#   Frontend  →  http://localhost:3000
#   Backend   →  http://localhost:8000
#   API Docs  →  http://localhost:8000/api/v1/docs
#   DB        →  localhost:5432
```

> On first startup the backend automatically runs Alembic migrations and seeds the admin user.

---

### Running Locally (Without Docker)

#### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL, SYNC_DATABASE_URL, and SECRET_KEY

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
# Edit .env — set VITE_API_URL=http://localhost:8000

# Start development server
npm run dev
# App: http://localhost:3000
```

#### Run Tests

```bash
cd backend
pip install aiosqlite pytest-asyncio
pytest tests/ -v
```

---


## API Reference

Interactive Swagger UI is available at `/api/v1/docs` when the backend is running.

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/api/v1/auth/login` | Login, returns JWT tokens | Public |
| `POST` | `/api/v1/auth/refresh` | Refresh access token | Public |
| `GET` | `/api/v1/auth/me` | Current user profile | All |
| `POST` | `/api/v1/auth/users` | Create new user | Admin |
| `GET` | `/api/v1/auth/users` | List all users | Admin |
| `PATCH` | `/api/v1/auth/users/{id}` | Update user | Admin |

### Lead Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/api/v1/leads` | List/search/filter leads | All sales |
| `POST` | `/api/v1/leads` | Create new lead | Sales+ |
| `GET` | `/api/v1/leads/{id}` | Get lead details | All sales |
| `PATCH` | `/api/v1/leads/{id}` | Update lead | Sales+ |
| `DELETE` | `/api/v1/leads/{id}` | Delete lead | Manager+ |
| `POST` | `/api/v1/leads/{id}/assign` | Assign to sales user | Manager+ |
| `POST` | `/api/v1/leads/{id}/convert` | Convert to customer | Manager+ |
| `GET` | `/api/v1/leads/{id}/activities` | Lead activity log | All sales |
| `POST` | `/api/v1/leads/{id}/activities` | Log an activity | All |
| `GET` | `/api/v1/leads/follow-ups` | Today's follow-ups | All |

### CRM — Customers

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/api/v1/customers` | List customers | All sales |
| `GET` | `/api/v1/customers/{id}` | Customer details | All sales |
| `PATCH` | `/api/v1/customers/{id}` | Update customer | Sales+ |
| `DELETE` | `/api/v1/customers/{id}` | Delete customer | Manager+ |
| `GET` | `/api/v1/customers/{id}/activities` | Activity history | All sales |
| `POST` | `/api/v1/customers/{id}/activities` | Log activity | All |

### HRM

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/api/v1/employees` | List employees | HR+ |
| `POST` | `/api/v1/employees` | Create employee | HR+ |
| `GET` | `/api/v1/employees/me` | My employee profile | All |
| `GET` | `/api/v1/employees/{id}` | Employee details | HR+ |
| `PATCH` | `/api/v1/employees/{id}` | Update employee | HR+ |
| `DELETE` | `/api/v1/employees/{id}` | Delete employee | Admin |
| `POST` | `/api/v1/leaves` | Apply for leave | All |
| `GET` | `/api/v1/leaves` | List all leaves | HR+ |
| `GET` | `/api/v1/leaves/my-leaves` | My leave history | All |
| `GET` | `/api/v1/leaves/pending` | Pending approvals | HR+ |
| `PATCH` | `/api/v1/leaves/{id}/review` | Approve/reject | HR+ |
| `DELETE` | `/api/v1/leaves/{id}` | Cancel (pending only) | Owner |

### Dashboard

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/api/v1/dashboard/summary` | All counts, charts, activity | All |

---

## Database Schema

Six tables with full audit fields (`created_at`, `updated_at`, `created_by`, `updated_by`) on every row.

```
users
  └── leads          (assigned_to_id → users)
        └── activities  (lead_id → leads)
        └── customers   (lead_id → leads, 1:1)
              └── activities  (customer_id → customers)
  └── employees       (user_id → users, 1:1)
        └── leave_requests  (employee_id → employees)
```

**Enums defined in PostgreSQL:**
- `user_role`: admin, sales_manager, sales_executive, hr_executive, employee
- `lead_status`: new, contacted, qualified, proposal, negotiation, converted, lost
- `lead_source`: website, referral, social_media, cold_call, email_campaign, other
- `activity_type`: call, email, meeting, note, status_change, converted, follow_up
- `employment_type`: full_time, part_time, contract, intern
- `employee_status`: active, on_leave, resigned, terminated
- `leave_type`: annual, sick, casual, maternity, paternity, unpaid
- `leave_status`: pending, approved, rejected, cancelled

An `update_updated_at()` trigger on every table keeps `updated_at` accurate without application-side intervention.

---

## Role-Based Access Control

Roles are enforced server-side via FastAPI dependencies on every endpoint.

| Action | Admin | Sales Manager | Sales Exec | HR Exec | Employee |
|--------|:-----:|:-------------:|:----------:|:-------:|:--------:|
| Manage users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create / edit leads | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete leads | ✅ | ✅ | ❌ | ❌ | ❌ |
| Assign leads | ✅ | ✅ | ❌ | ❌ | ❌ |
| Convert lead → customer | ✅ | ✅ | ❌ | ❌ | ❌ |
| View customers | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage employees | ✅ | ❌ | ❌ | ✅ | ❌ |
| Review leave requests | ✅ | ❌ | ❌ | ✅ | ❌ |
| Apply for leave | ✅ | ✅ | ✅ | ✅ | ✅ |
| View dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Security

| Concern | Implementation |
|---------|---------------|
| **Authentication** | JWT Bearer tokens — access token (30 min) + refresh token (7 days) |
| **Password storage** | bcrypt hashing via `passlib` — plaintext never stored |
| **Authorization** | Role guards as FastAPI `Depends()` on every endpoint |
| **Input validation** | Pydantic v2 schemas reject malformed requests before they reach business logic |
| **SQL injection** | SQLAlchemy ORM with parameterized queries throughout |
| **CORS** | Configurable allowlist in `.env` — defaults to localhost only |
| **Secrets** | All credentials via environment variables — no hardcoded secrets in source |
| **Container security** | Backend Docker image runs as a non-root `appuser` |
| **Audit trail** | Every record carries `created_by` and `updated_by` foreign keys |

---

## Backup Plan

| Property | Detail |
|----------|--------|
| **Frequency** | Daily at 02:00 AM |
| **Method** | `pg_dump` compressed with gzip |
| **Retention** | 7 rolling days |
| **Storage** | S3 bucket or mounted volume |
| **Restore** | `gunzip -c dump.sql.gz \| psql $DATABASE_URL` |

```bash
# Example cron entry (add to server crontab)
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/minicrm_$(date +\%Y\%m\%d).sql.gz

# Restore a specific backup
gunzip -c /backups/minicrm_20240101.sql.gz | psql $DATABASE_URL
```

---

## Known Limitations

- **No email notifications** — leave approvals and lead assignments do not trigger emails; a notification service (e.g. SendGrid) can be wired into the service layer.
- **No file attachments** — activity logs and lead records cannot store uploaded files; S3 integration would be needed.
- **Single-organisation** — the schema has no multi-tenancy; all data is shared within one instance.
- **No real-time updates** — the dashboard auto-refreshes every 60 seconds but does not use WebSockets for live push.
- **Basic reporting** — analytics beyond the dashboard summary (e.g. conversion rate over time, revenue trends) are not yet implemented.
- **Leave balance tracking** — the system records leave requests and approvals but does not enforce or deduct from a per-employee leave balance quota.

---
