import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import {
  TrendingUp, Users, Building2, CalendarOff, AlertCircle
} from 'lucide-react'
import { dashboardApi } from '../../api/dashboardApi.js'
import { PageSpinner } from '../../components/common/Spinner.jsx'
import { formatCurrency, timeAgo, capitalize } from '../../utils/formatters.js'
import { LEAD_STATUS_LABELS, ACTIVITY_TYPE_LABELS } from '../../utils/constants.js'
import Badge from '../../components/common/Badge.jsx'
import useAuthStore from '../../store/authStore.js'

const STATUS_COLORS = {
  new: '#6366F1', contacted: '#F59E0B', qualified: '#3B82F6',
  proposal: '#8B5CF6', negotiation: '#EC4899', converted: '#10B981', lost: '#94A3B8',
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: dashboardApi.getSummary,
    refetchInterval: 60000,
  })

  if (isLoading) return <PageSpinner />

  const { leads, customers, employees, leaves, pipeline_value, recent_activities, follow_ups_today } = data

  const chartData = Object.entries(leads.by_status).map(([k, v]) => ({
    name: LEAD_STATUS_LABELS[k] || capitalize(k),
    value: v,
    color: STATUS_COLORS[k] || '#94A3B8',
  })).filter((d) => d.value > 0)

  const stats = [
    { label: 'Total Leads', value: leads.total, icon: TrendingUp, color: '#EFF6FF', iconColor: '#2563EB' },
    { label: 'Customers', value: customers.total, icon: Building2, color: '#F0FDF4', iconColor: '#10B981' },
    { label: 'Pipeline Value', value: formatCurrency(pipeline_value), icon: TrendingUp, color: '#FFF7ED', iconColor: '#F59E0B', large: true },
    { label: 'Pending Leaves', value: leaves.pending, icon: CalendarOff, color: '#FEF2F2', iconColor: '#EF4444' },
  ]

  return (
    <div className="dashboard-wrapper">
      <div className="greeting-card">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
            Good {getGreeting()}, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: 6 }}>
            Welcome back! Here's a brief overview of your business performance today.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Current Value</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>{formatCurrency(pipeline_value)}</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 32 }}>
        {stats.map((s) => (
          <div key={s.label} className="stat-card stat-card--premium">
            <div style={{ flex: 1 }}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: s.large ? 22 : 28, marginTop: 4 }}>{s.value}</div>
            </div>
            <div className="stat-icon" style={{ background: s.color, width: 48, height: 48, borderRadius: 12 }}>
              <s.icon size={22} color={s.iconColor} />
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Left col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Lead status chart */}
          <div className="card" style={{ border: 'none', boxShadow: 'var(--shadow-md)' }}>
            <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <span className="card-title" style={{ fontSize: 16 }}>Leads by Status</span>
            </div>
            <div className="card-body">
              {chartData.length > 0 ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barSize={40} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 11, fill: 'var(--text-muted)' }} 
                        axisLine={false} 
                        tickLine={false} 
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: 'var(--text-muted)' }} 
                        axisLine={false} 
                        tickLine={false} 
                        allowDecimals={false} 
                      />
                      <Tooltip
                        contentStyle={{ 
                          borderRadius: 12, 
                          border: 'none', 
                          boxShadow: 'var(--shadow-lg)',
                          fontSize: 13, 
                          fontFamily: 'var(--font-sans)',
                          padding: '10px 14px'
                        }}
                        cursor={{ fill: 'var(--surface-2)' }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                  No lead data yet
                </div>
              )}
            </div>
          </div>

          {/* Recent activity */}
          <div className="card" style={{ border: 'none', boxShadow: 'var(--shadow-md)' }}>
            <div className="card-header">
              <span className="card-title" style={{ fontSize: 16 }}>Recent Activity</span>
              <button className="btn-ghost" style={{ fontSize: 12, fontWeight: 600 }}>View All</button>
            </div>
            <div className="card-body" style={{ paddingTop: 0 }}>
              {recent_activities.length === 0 ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No recent activity</div>
              ) : (
                <div className="activity-feed">
                  {recent_activities.map((a) => (
                    <div key={a.id} className="activity-item activity-item--premium" style={{ border: 'none' }}>
                      <div className="activity-dot" style={{ width: 10, height: 10, marginTop: 5 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div className="activity-subject">{a.subject}</div>
                          <div className="activity-meta" style={{ margin: 0 }}>{timeAgo(a.created_at)}</div>
                        </div>
                        <div className="activity-meta" style={{ marginTop: 2 }}>
                          <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{a.lead_title || a.customer_name}</span>
                          {a.performed_by_name && ` · ${a.performed_by_name}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Follow-ups today */}
          <div className="card" style={{ border: 'none', boxShadow: 'var(--shadow-md)' }}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="card-title" style={{ fontSize: 16 }}>Follow-ups</span>
                {follow_ups_today.length > 0 && (
                  <span style={{
                    background: 'var(--warning-bg)', color: 'var(--warning)',
                    fontSize: 11, fontWeight: 700,
                    padding: '2px 8px', borderRadius: 99,
                  }}>
                    {follow_ups_today.length} TODAY
                  </span>
                )}
              </div>
            </div>
            <div className="card-body" style={{ paddingTop: 0 }}>
              {follow_ups_today.length === 0 ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                  No follow-ups scheduled today 🎉
                </div>
              ) : (
                follow_ups_today.map((f) => (
                  <div key={f.id} style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{f.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <Badge status={f.status} style={{ fontSize: 10 }}>{LEAD_STATUS_LABELS[f.status]}</Badge>
                      {f.assigned_to_name && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{f.assigned_to_name}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Lead status summary pills */}
          <div className="card" style={{ border: 'none', boxShadow: 'var(--shadow-md)', background: 'var(--text-primary)' }}>
            <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="card-title" style={{ color: '#fff', fontSize: 16 }}>Lead Pipeline</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(leads.by_status).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[k] || '#94A3B8' }} />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{LEAD_STATUS_LABELS[k]}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
