import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute.jsx'
import AppLayout from '../components/layout/AppLayout.jsx'

import Login from '../pages/Auth/Login.jsx'
import Dashboard from '../pages/Dashboard/index.jsx'
import LeadList from '../pages/Leads/LeadList.jsx'
import LeadDetail from '../pages/Leads/LeadDetail.jsx'
import LeadForm from '../pages/Leads/LeadForm.jsx'
import CustomerList from '../pages/CRM/CustomerList.jsx'
import CustomerDetail from '../pages/CRM/CustomerDetail.jsx'
import EmployeeList from '../pages/HRM/EmployeeList.jsx'
import LeaveList from '../pages/HRM/LeaveList.jsx'
import UserManagement from '../pages/Auth/UserManagement.jsx'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Lead Management */}
          <Route path="/leads" element={<LeadList />} />
          <Route path="/leads/new" element={<LeadForm />} />
          <Route path="/leads/:id" element={<LeadDetail />} />
          <Route path="/leads/:id/edit" element={<LeadForm />} />

          {/* CRM */}
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />

          {/* HRM */}
          <Route path="/employees" element={<EmployeeList />} />
          <Route path="/leaves" element={<LeaveList />} />

          {/* Admin */}
          <Route
            path="/users"
            element={
              <ProtectedRoute roles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
