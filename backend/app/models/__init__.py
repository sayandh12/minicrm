# Import all models here so Alembic autogenerate can detect them
from app.models.user import User, UserRole                          # noqa: F401
from app.models.lead import Lead, LeadStatus, LeadSource            # noqa: F401
from app.models.customer import Customer                             # noqa: F401
from app.models.activity import Activity, ActivityType               # noqa: F401
from app.models.employee import Employee, EmploymentType, EmployeeStatus  # noqa: F401
from app.models.leave import LeaveRequest, LeaveType, LeaveStatus   # noqa: F401
