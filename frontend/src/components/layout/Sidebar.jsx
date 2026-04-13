import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, UserCheck, Building2,
  CalendarOff, Settings, LogOut, ChevronRight,
  TrendingUp
} from 'lucide-react'
import useAuthStore from '../../store/authStore.js'
import { getInitials } from '../../utils/formatters.js'
import { ROLE_LABELS } from '../../utils/constants.js'

const NAV = [
  { label: 'Dashboard',   path: '/dashboard',  icon: LayoutDashboard },
  { label: 'Leads',       path: '/leads',       icon: TrendingUp,    roles: ['admin','sales_manager','sales_executive'] },
  { label: 'Customers',   path: '/customers',   icon: Building2,     roles: ['admin','sales_manager','sales_executive'] },
  { label: 'Employees',   path: '/employees',   icon: UserCheck,     roles: ['admin','hr_executive'] },
  { label: 'Leave Mgmt',  path: '/leaves',      icon: CalendarOff },
  { label: 'Users',       path: '/users',        icon: Settings,      roles: ['admin'] },
]

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuthStore()

  const visible = NAV.filter(
    (n) => !n.roles || n.roles.includes(user?.role)
  )

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <span>M</span>
        </div>
        <div>
          <div className="sidebar-brand-name">{import.meta.env.VITE_APP_TITLE || 'MiniCRM'}</div>
          <div className="sidebar-brand-sub">{import.meta.env.VITE_APP_DESCRIPTION || 'Cloud CRM'}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {visible.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' sidebar-link--active' : ''}`
            }
            onClick={onClose}
          >
            <Icon size={18} />
            <span>{label}</span>
            <ChevronRight size={14} className="sidebar-chevron" />
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar avatar--sm">
            {getInitials(user?.full_name)}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.full_name}</div>
            <div className="sidebar-user-role">{ROLE_LABELS[user?.role]}</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={logout} title="Logout">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  )
}
