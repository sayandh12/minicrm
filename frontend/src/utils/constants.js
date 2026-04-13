export const ROLES = {
  ADMIN: 'admin',
  SALES_MANAGER: 'sales_manager',
  SALES_EXECUTIVE: 'sales_executive',
  HR_EXECUTIVE: 'hr_executive',
  EMPLOYEE: 'employee',
}

export const ROLE_LABELS = {
  admin: 'Admin',
  sales_manager: 'Sales Manager',
  sales_executive: 'Sales Executive',
  hr_executive: 'HR Executive',
  employee: 'Employee',
}

export const LEAD_STATUSES = ['new','contacted','qualified','proposal','negotiation','converted','lost']

export const LEAD_STATUS_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  converted: 'Converted',
  lost: 'Lost',
}

export const LEAD_SOURCES = ['website','referral','social_media','cold_call','email_campaign','other']

export const LEAD_SOURCE_LABELS = {
  website: 'Website',
  referral: 'Referral',
  social_media: 'Social Media',
  cold_call: 'Cold Call',
  email_campaign: 'Email Campaign',
  other: 'Other',
}

export const ACTIVITY_TYPES = ['call','email','meeting','note','follow_up']

export const ACTIVITY_TYPE_LABELS = {
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
  note: 'Note',
  status_change: 'Status Changed',
  converted: 'Converted',
  follow_up: 'Follow Up',
}

export const LEAVE_TYPES = ['annual','sick','casual','maternity','paternity','unpaid']

export const LEAVE_TYPE_LABELS = {
  annual: 'Annual',
  sick: 'Sick',
  casual: 'Casual',
  maternity: 'Maternity',
  paternity: 'Paternity',
  unpaid: 'Unpaid',
}

export const LEAVE_STATUSES = ['pending','approved','rejected','cancelled']

export const EMPLOYMENT_TYPES = ['full_time','part_time','contract','intern']

export const EMPLOYMENT_TYPE_LABELS = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  intern: 'Intern',
}

export const EMPLOYEE_STATUSES = ['active','on_leave','resigned','terminated']
