import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Edit2, Trash2, UserCheck, RefreshCw, Plus } from 'lucide-react'
import { leadsApi } from '../../api/leadsApi.js'
import { authApi } from '../../api/authApi.js'
import { LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS, ACTIVITY_TYPE_LABELS, ACTIVITY_TYPES } from '../../utils/constants.js'
import { formatDate, formatCurrency, timeAgo } from '../../utils/formatters.js'
import PageHeader from '../../components/common/PageHeader.jsx'
import Button from '../../components/common/Button.jsx'
import Badge from '../../components/common/Badge.jsx'
import Modal from '../../components/common/Modal.jsx'
import { Select, Textarea } from '../../components/common/Input.jsx'
import { PageSpinner } from '../../components/common/Spinner.jsx'
import useAuthStore from '../../store/authStore.js'
import Input from '../../components/common/Input.jsx'
import { getErrorMessage } from '../../utils/errors.js'

export default function LeadDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { canConvertLead, canManageLeads, isAdmin, isSalesManager } = useAuthStore()

  const [assignModal, setAssignModal] = useState(false)
  const [activityModal, setActivityModal] = useState(false)
  const [assignUserId, setAssignUserId] = useState('')
  const [activityForm, setActivityForm] = useState({ type: 'note', subject: '', description: '' })

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadsApi.get(id),
  })

  const { data: activities = [] } = useQuery({
    queryKey: ['lead-activities', id],
    queryFn: () => leadsApi.getActivities(id),
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: authApi.listUsers,
    enabled: assignModal,
  })

  const salesUsers = users.filter((u) =>
    ['admin', 'sales_manager', 'sales_executive'].includes(u.role)
  )

  const convertMutation = useMutation({
    mutationFn: () => leadsApi.convert(id),
    onSuccess: (customer) => {
      toast.success('Lead converted to customer!')
      qc.invalidateQueries({ queryKey: ['lead', id] })
      qc.invalidateQueries({ queryKey: ['leads'] })
      navigate(`/customers/${customer.id}`)
    },
    onError: (e) => toast.error(getErrorMessage(e, 'Conversion failed')),
  })

  const assignMutation = useMutation({
    mutationFn: () => leadsApi.assign(id, assignUserId),
    onSuccess: () => {
      toast.success('Lead assigned')
      qc.invalidateQueries({ queryKey: ['lead', id] })
      setAssignModal(false)
    },
    onError: (e) => toast.error(getErrorMessage(e, 'Assignment failed')),
  })

  const deleteMutation = useMutation({
    mutationFn: () => leadsApi.delete(id),
    onSuccess: () => {
      toast.success('Lead deleted')
      navigate('/leads')
    },
  })

  const addActivityMutation = useMutation({
    mutationFn: () => leadsApi.addActivity(id, activityForm),
    onSuccess: () => {
      toast.success('Activity logged')
      qc.invalidateQueries({ queryKey: ['lead-activities', id] })
      setActivityModal(false)
      setActivityForm({ type: 'note', subject: '', description: '' })
    },
    onError: (e) => toast.error(getErrorMessage(e, 'Failed to log activity')),
  })

  if (isLoading) return <PageSpinner />
  if (!lead) return <div>Lead not found</div>

  const isConverted = lead.status === 'converted'

  return (
    <div>
      <PageHeader
        title={`${lead.first_name} ${lead.last_name}`}
        subtitle={lead.title}
        action={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {canManageLeads() && !isConverted && (
              <Button variant="secondary" size="sm" onClick={() => navigate(`/leads/${id}/edit`)}>
                <Edit2 size={14} /> Edit
              </Button>
            )}
            {(isAdmin() || isSalesManager()) && !isConverted && (
              <Button variant="secondary" size="sm" onClick={() => setAssignModal(true)}>
                <UserCheck size={14} /> Assign
              </Button>
            )}
            {canConvertLead() && !isConverted && (
              <Button
                size="sm"
                loading={convertMutation.isPending}
                onClick={() => {
                  if (confirm('Convert this lead to a customer?')) convertMutation.mutate()
                }}
              >
                <RefreshCw size={14} /> Convert
              </Button>
            )}
            {(isAdmin() || isSalesManager()) && (
              <Button
                variant="danger" size="sm"
                onClick={() => { if (confirm('Delete this lead?')) deleteMutation.mutate() }}
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        }
      />

      <div className="detail-grid">
        {/* Left: Info + Activities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Lead Details</span>
              <Badge status={lead.status}>{LEAD_STATUS_LABELS[lead.status]}</Badge>
            </div>
            <div className="card-body">
              {[
                ['Email', lead.email || '—'],
                ['Phone', lead.phone || '—'],
                ['Company', lead.company || '—'],
                ['Source', LEAD_SOURCE_LABELS[lead.source]],
                ['Estimated Value', lead.estimated_value ? formatCurrency(lead.estimated_value) : '—'],
                ['Follow-up Date', formatDate(lead.follow_up_date)],
                ['Assigned To', lead.assigned_to_name || 'Unassigned'],
                ['Created', formatDate(lead.created_at)],
              ].map(([label, value]) => (
                <div key={label} className="info-row">
                  <span className="info-label">{label}</span>
                  <span className="info-value">{value}</span>
                </div>
              ))}
              {lead.notes && (
                <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--text-secondary)' }}>
                  {lead.notes}
                </div>
              )}
            </div>
          </div>

          {/* Activities */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Activity History</span>
              <Button size="sm" variant="secondary" onClick={() => setActivityModal(true)}>
                <Plus size={14} /> Log Activity
              </Button>
            </div>
            <div className="card-body" style={{ padding: '0 22px' }}>
              {activities.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No activities yet</div>
              ) : (
                <div className="activity-feed">
                  {activities.map((a) => (
                    <div key={a.id} className="activity-item">
                      <div className="activity-dot" />
                      <div>
                        <div className="activity-subject">{a.subject}</div>
                        <div className="activity-meta">
                          <Badge style={{ fontSize: 11 }}>{ACTIVITY_TYPE_LABELS[a.type] || a.type}</Badge>
                          {a.description && <span> · {a.description}</span>}
                          {a.performed_by_name && <span> · {a.performed_by_name}</span>}
                          {' · '}{timeAgo(a.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-body">
              <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
                <div style={{ width: 56, height: 56, background: 'var(--accent)', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 auto 12px' }}>
                  {lead.first_name[0]}{lead.last_name[0]}
                </div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{lead.first_name} {lead.last_name}</div>
                {lead.company && <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>{lead.company}</div>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Badge status={lead.status}>{LEAD_STATUS_LABELS[lead.status]}</Badge>
              </div>
            </div>
          </div>

          {isConverted && (
            <div style={{ background: 'var(--success-bg)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 'var(--radius-lg)', padding: '16px 18px', fontSize: 14, color: '#065F46', fontWeight: 500, textAlign: 'center' }}>
              ✅ Converted to Customer
            </div>
          )}
        </div>
      </div>

      {/* Assign modal */}
      <Modal open={assignModal} onClose={() => setAssignModal(false)} title="Assign Lead" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Select label="Assign to" value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)}>
            <option value="">Select user…</option>
            {salesUsers.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
          </Select>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setAssignModal(false)}>Cancel</Button>
            <Button onClick={() => assignMutation.mutate()} loading={assignMutation.isPending} disabled={!assignUserId}>
              Assign
            </Button>
          </div>
        </div>
      </Modal>

      {/* Log activity modal */}
      <Modal open={activityModal} onClose={() => setActivityModal(false)} title="Log Activity" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Select label="Activity Type" value={activityForm.type}
            onChange={(e) => setActivityForm((f) => ({ ...f, type: e.target.value }))}>
            {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{ACTIVITY_TYPE_LABELS[t] || t}</option>)}
          </Select>
          <Input label="Subject" required value={activityForm.subject}
            onChange={(e) => setActivityForm((f) => ({ ...f, subject: e.target.value }))} />
          <Textarea label="Description" rows={3} value={activityForm.description}
            onChange={(e) => setActivityForm((f) => ({ ...f, description: e.target.value }))} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setActivityModal(false)}>Cancel</Button>
            <Button onClick={() => addActivityMutation.mutate()} loading={addActivityMutation.isPending}
              disabled={!activityForm.subject}>
              Log Activity
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
