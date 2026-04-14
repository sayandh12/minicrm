import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { 
  User as UserIcon, Mail, Phone, Shield, 
  Briefcase, Calendar, CreditCard, MapPin,
  Save
} from 'lucide-react'
import { authApi } from '../../api/authApi.js'
import { hrmApi } from '../../api/hrmApi.js'
import PageHeader from '../../components/common/PageHeader.jsx'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import { PageSpinner } from '../../components/common/Spinner.jsx'
import { formatCurrency, formatDate, getInitials } from '../../utils/formatters.js'
import { ROLE_LABELS, EMPLOYMENT_TYPE_LABELS } from '../../utils/constants.js'
import { getErrorMessage } from '../../utils/errors.js'
import useAuthStore from '../../store/authStore.js'

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional().nullable(),
})

export default function Profile() {
  const queryClient = useQueryClient()
  const { user: authUser, setUser } = useAuthStore()

  // Fetch full user details
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['me'],
    queryFn: authApi.me,
  })

  // Fetch employee details (might fail if not an employee)
  const { data: employee, isLoading: loadingEmp } = useQuery({
    queryKey: ['my-employee-profile'],
    queryFn: hrmApi.getMyProfile,
    retry: false,
  })

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(schema),
    values: user ? {
      full_name: user.full_name,
      phone: user.phone || '',
    } : {},
  })

  const updateMutation = useMutation({
    mutationFn: authApi.updateMe,
    onSuccess: (updatedUser) => {
      toast.success('Profile updated')
      queryClient.setQueryData(['me'], updatedUser)
      // Update store so sidebar/header reflects changes
      setUser(updatedUser)
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to update profile')),
  })

  if (loadingUser || (loadingEmp && !employee)) return <PageSpinner />

  return (
    <div className="profile-wrapper">
      <PageHeader 
        title="My Profile" 
        subtitle="Manage your personal and professional information"
      />

      <div className="profile-grid">
        {/* Left Column: Personal Info (Editable) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card profile-card">
            <div className="card-header">
              <h3 className="card-title" style={{ fontSize: 16 }}>Personal Information</h3>
            </div>
            <div className="card-body">
              <div className="profile-avatar-section">
                <div className="avatar avatar--lg">
                  {getInitials(user?.full_name)}
                </div>
                <div>
                  <div className="profile-name-display">{user?.full_name}</div>
                  <div className="profile-role-badge">{ROLE_LABELS[user?.role]}</div>
                </div>
              </div>

              <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Input 
                    label="Full Name" 
                    required 
                    error={errors.full_name?.message} 
                    {...register('full_name')} 
                    icon={UserIcon}
                  />
                  <div className="input-group">
                    <label className="input-label">Email Address</label>
                    <div className="input-prefix-wrapper">
                      <Mail size={18} className="input-icon" />
                      <input 
                        className="field-input" 
                        value={user?.email} 
                        disabled 
                        style={{ background: 'var(--surface-2)', cursor: 'not-allowed' }}
                      />
                    </div>
                    <p className="input-help">Email cannot be changed</p>
                  </div>
                  <Input 
                    label="Phone Number" 
                    error={errors.phone?.message} 
                    {...register('phone')} 
                    icon={Phone}
                    placeholder="+91 XXXXX XXXXX"
                  />
                  
                  <div style={{ marginTop: 8 }}>
                    <Button 
                      type="submit" 
                      loading={updateMutation.isPending} 
                      disabled={!isDirty}
                      className="btn--full"
                    >
                      <Save size={18} /> Update Profile
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ fontSize: 16 }}>Security & Permissions</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="profile-info-item">
                <Shield size={20} color="var(--accent)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Role Based Access</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    You have <strong>{ROLE_LABELS[user?.role]}</strong> privileges in the system.
                  </div>
                </div>
              </div>
              <div className="profile-info-item">
                <Calendar size={20} color="var(--accent)" />
                {/* <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Account Created</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {user?.created_at ? formatDate(user.created_at) : 'N/A'}
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Employee Info (Read-only) */}
        <div>
          {employee ? (
            <div className="card profile-card" style={{ height: '100%' }}>
              <div className="card-header">
                <h3 className="card-title" style={{ fontSize: 16 }}>Professional Details</h3>
              </div>
              <div className="card-body">
                <div className="employee-info-grid">
                  <div className="info-box">
                    <div className="info-label">Employee Code</div>
                    <div className="info-value info-value--mono">{employee.employee_code}</div>
                  </div>
                  <div className="info-box">
                    <div className="info-label">Designation</div>
                    <div className="info-value">{employee.designation}</div>
                  </div>
                  <div className="info-box">
                    <div className="info-label">Department</div>
                    <div className="info-value">{employee.department}</div>
                  </div>
                  <div className="info-box">
                    <div className="info-label">Employment Type</div>
                    <div className="info-value">{EMPLOYMENT_TYPE_LABELS[employee.employment_type]}</div>
                  </div>
                  <div className="info-box">
                    <div className="info-label">Joining Date</div>
                    <div className="info-value">{formatDate(employee.date_of_joining)}</div>
                  </div>
                  <div className="info-box">
                    <div className="info-label">Monthly Salary</div>
                    <div className="info-value">{formatCurrency(employee.salary)}</div>
                  </div>
                </div>

                <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid var(--border)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="profile-info-item">
                    <MapPin size={20} color="var(--text-muted)" />
                    <div>
                      <div className="info-label">Permanent Address</div>
                      <div className="info-value" style={{ fontSize: 14 }}>{employee.address || 'Not specified'}</div>
                    </div>
                  </div>
                  <div className="profile-info-item">
                    <Phone size={20} color="var(--text-muted)" />
                    <div>
                      <div className="info-label">Emergency Contact</div>
                      <div className="info-value" style={{ fontSize: 14 }}>{employee.emergency_contact || 'None'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card profile-card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
              <div>
                <Briefcase size={48} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: 16 }} />
                <h4 style={{ marginBottom: 8 }}>No Employee Profile</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  An HR profile has not been linked to your user account yet. 
                  Contact your administrator to set up your professional details.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .profile-grid {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 24px;
          align-items: start;
        }

        .profile-avatar-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .profile-name-display {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .profile-role-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--accent);
          background: var(--accent-bg);
          padding: 2px 8px;
          border-radius: 4px;
          margin-top: 4px;
        }

        .profile-info-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .employee-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .info-box {
          padding: 12px;
          background: var(--surface-2);
          border-radius: 8px;
        }

        .info-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .info-value {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .info-value--mono {
          font-family: var(--font-mono);
          color: var(--accent);
        }

        @media (max-width: 1024px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
