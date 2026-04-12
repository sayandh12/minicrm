from fastapi import APIRouter
from app.api.v1.endpoints import auth, leads, customers, employees, leaves, dashboard

api_router = APIRouter()

api_router.include_router(auth.router,       prefix="/auth",       tags=["Auth & Users"])
api_router.include_router(leads.router,      prefix="/leads",      tags=["Lead Management"])
api_router.include_router(customers.router,  prefix="/customers",  tags=["CRM - Customers"])
api_router.include_router(employees.router,  prefix="/employees",  tags=["HRM - Employees"])
api_router.include_router(leaves.router,     prefix="/leaves",     tags=["HRM - Leave Requests"])
api_router.include_router(dashboard.router,  prefix="/dashboard",  tags=["Dashboard"])
