import { Menu, Bell } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { getInitials } from '../../utils/formatters.js'
import useAuthStore from '../../store/authStore.js'

const TITLES = {
  '/dashboard': 'Dashboard',
  '/leads': 'Lead Management',
  '/customers': 'Customers',
  '/employees': 'Employees',
  '/leaves': 'Leave Management',
  '/users': 'User Management',
}

export default function Topbar({ onMenuClick }) {
  const { pathname } = useLocation()
  const { user } = useAuthStore()

  const base = '/' + pathname.split('/')[1]
  const title = TITLES[base] || import.meta.env.VITE_APP_TITLE || 'MiniCRM'

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        <h2 className="topbar-title">{title}</h2>
      </div>
      <div className="topbar-right">
        <button className="topbar-icon-btn">
          <Bell size={18} />
        </button>
        <div className="avatar avatar--sm topbar-avatar">
          {getInitials(user?.full_name)}
        </div>
      </div>
    </header>
  )
}
