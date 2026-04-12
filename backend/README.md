# Lead management,CRM and HRM Backend — FastAPI

## Stack
- **FastAPI** + **Uvicorn**
- **PostgreSQL 16** + **SQLAlchemy 2 (async)**
- **Alembic** migrations
- **JWT** auth (access + refresh tokens)
- **Docker** + **docker-compose**

## Quick Start (Docker)

```bash
# 1. Clone and enter project
cd backend

# 2. Copy env file
cp .env.example .env
# Edit .env with your values

# 3. Start everything
docker-compose up --build

# App: http://localhost:8000
# Docs: http://localhost:8000/api/v1/docs
```

## Local Dev (without Docker)

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set up .env
cp .env.example .env
# Update DATABASE_URL and SYNC_DATABASE_URL

# 4. Run migrations
alembic upgrade head

# 5. Start server
uvicorn app.main:app --reload --port 8000
```

## Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "your message"

# Apply all migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1
```

## Running Tests

```bash
pip install aiosqlite pytest-asyncio
pytest tests/ -v
```

## Default Admin Credentials
```
Email:    admin@minicrm.com
Password: Admin@123456
```

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/login | Login |
| POST | /api/v1/auth/refresh | Refresh token |
| GET  | /api/v1/auth/me | Current user |
| POST | /api/v1/auth/users | Create user (Admin) |
| GET  | /api/v1/leads | List/search leads |
| POST | /api/v1/leads | Create lead |
| PATCH| /api/v1/leads/{id} | Update lead |
| POST | /api/v1/leads/{id}/assign | Assign lead |
| POST | /api/v1/leads/{id}/convert | Convert to customer |
| GET  | /api/v1/customers | List customers |
| GET  | /api/v1/customers/{id}/activities | Activity history |
| GET  | /api/v1/employees | List employees (HR) |
| POST | /api/v1/employees | Create employee (HR) |
| POST | /api/v1/leaves | Apply for leave |
| PATCH| /api/v1/leaves/{id}/review | Approve/Reject leave (HR) |
| GET  | /api/v1/dashboard/summary | Dashboard stats |

## Database Backup Plan

**Frequency:** Daily at 02:00 AM  
**Method:** `pg_dump` via cron  
**Retention:** 7 days rolling  
**Storage:** Compressed `.sql.gz` on S3 / mounted volume  

```bash
# Cron job example (add to crontab)
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/minicrm_$(date +\%Y\%m\%d).sql.gz

# Restore
gunzip -c minicrm_20240101.sql.gz | psql $DATABASE_URL
```

## Role Permissions

| Action | Admin | Sales Mgr | Sales Exec | HR Exec | Employee |
|--------|-------|-----------|------------|---------|----------|
| Manage users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create/edit leads | ✅ | ✅ | ✅ | ❌ | ❌ |
| Convert lead | ✅ | ✅ | ❌ | ❌ | ❌ |
| View customers | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage employees | ✅ | ❌ | ❌ | ✅ | ❌ |
| Apply leave | ✅ | ✅ | ✅ | ✅ | ✅ |
| Review leave | ✅ | ❌ | ❌ | ✅ | ❌ |
| View dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
