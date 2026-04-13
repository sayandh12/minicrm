import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Edit2, Plus, Trash2 } from 'lucide-react'
import { crmApi } from '../../api/crmApi.js'
import { ACTIVITY_TYPE_LABELS, ACTIVITY_TYPES } from '../../utils/constants.js'
import { formatDate, formatCurrency, timeAgo } from '../../utils/formatters.js'
import PageHeader from '../../components/common/PageHeader.jsx'
import Button from '../../components/common/Button.jsx'
import Badge from '../../components/common/Badge.jsx'
import Modal from '../../components/common/Modal.jsx'
import Input, { Select, Textarea } from '../../components/common/Input.jsx'
import { PageSpinner } from '../../components/common/Spinner.jsx'
import useAuthStore from '../../store/authStore.js'
import { getErrorMessage } from '../../utils/errors.js'

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { isAdmin, isSalesManager } = useAuthStore()

  const [editModal, setEditModal] = useState(false)
  const [activityModal, setActivityModal] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [activityForm, setActivityForm] = useState({ type: 'note', subject: '', description: '' })

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => crmApi.getCustomer(id),
  })

  const { data: activities = [] } = useQuery({
    queryKey: ['customer-activities', id],
    queryFn: () => crmApi.getActivities(id),
  })

  const updateMutation = useMutation({
    mutationFn: (data) => crmApi.updateCustomer(id, data),
    onSuccess: () => {
      toast.success('Customer updated')
      qc.invalidateQueries({ queryKey: ['customer', id] })
      setEditModal(false)
    },
    onError: (e) => toast.error(getErrorMessage(e, 'Update failed')),
  })

  const deleteMutation = useMutation({
    mutationFn: () => crmApi.deleteCustomer(id),
    onSuccess: () => { toast.success('Customer deleted'); navigate('/customers') },
    onError: (e) => toast.error(getErrorMessage(e, 'Delete failed')),
  })

  const addActivityMutation = useMutation({
    mutationFn: () => crmApi.addActivity(id, activityForm),
    onSuccess: () => {
      toast.success('Activity logged')
      qc.invalidateQueries({ queryKey: ['customer-activities', id] })
      setActivityModal(false)
      setActivityForm({ type: 'note', subject: '', description: '' })
    },
    onError: (e) => toast.error(getErrorMessage(e, 'Failed to log activity')),
  })

  if (isLoading) return <PageSpinner />
  if (!customer) return <div>Customer not found</div>

  return (
    <div>
      <PageHeader
        title={customer.full_name}
        subtitle={customer.company || 'Customer'}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={() => {
              setEditForm(customer)
              setEditModal(true)
            }}>
              <Edit2 size={14} /> Edit
            </Button>
            {(isAdmin() || isSalesManager()) && (
              <Button variant="danger" size="sm"
                onClick={() => { if (confirm('Delete this customer?')) deleteMutation.mutate() }}>
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        }
      />

      <div className="detail-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Details card */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Customer Info</span>
            </div>
            <div className="card-body">
              {[
                ['Email', customer.email || '—'],
                ['Phone', customer.phone || '—'],
                ['Company', customer.company || '—'],
                ['Address', customer.address || '—'],
                ['Total Value', formatCurrency(customer.total_value)],
                ['Customer Since', formatDate(customer.created_at)],
                ['Converted From Lead', customer.lead_id ? `Lead #${customer.lead_id}` : '—'],
              ].map(([label, value]) => (
                <div key={label} className="info-row">
                  <span className="info-label">{label}</span>
                  <span className="info-value"
                    style={label === 'Total Value' ? { color: 'var(--success)', fontWeight: 700 } : {}}>
                    {value}
                  </span>
                </div>
              ))}
              {customer.notes && (
                <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--text-secondary)' }}>
                  {customer.notes}
                </div>
              )}
            </div>
          </div>

          {/* Activity history */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Activity History</span>
              <Button size="sm" variant="secondary" onClick={() => setActivityModal(true)}>
                <Plus size={14} /> Log Activity
              </Button>
            </div>
            <div className="card-body" style={{ padding: '0 22px' }}>
              {activities.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                  No activities yet
                </div>
              ) : (
                <div className="activity-feed">
                  {activities.map((a) => (
                    <div key={a.id} className="activity-item">
                      <div className="activity-dot" style={{ background: 'var(--success)' }} />
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

        {/* Right sidebar */}
        <div>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '28px 22px' }}>
              <div className="avatar avatar--lg" style={{ margin: '0 auto 12px', width: 60, height: 60, fontSize: 24 }}>
                {customer.full_name[0]}
              </div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{customer.full_name}</div>
              {customer.company && (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>{customer.company}</div>
              )}
              <div style={{ marginTop: 16, padding: '12px 0', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Total Value</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)' }}>
                  {formatCurrency(customer.total_value)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Customer">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-grid">
            <Input label="Full Name" value={editForm.full_name || ''}
              onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))} />
            <Input label="Email" type="email" value={editForm.email || ''}
              onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
            <Input label="Phone" value={editForm.phone || ''}
              onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
            <Input label="Company" value={editForm.company || ''}
              onChange={(e) => setEditForm((f) => ({ ...f, company: e.target.value }))} />
            <Input label="Total Value (₹)" type="number" value={editForm.total_value || ''}
              onChange={(e) => setEditForm((f) => ({ ...f, total_value: parseFloat(e.target.value) }))} />
          </div>
          <Textarea label="Address" rows={2} value={editForm.address || ''}
            onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} />
          <Textarea label="Notes" rows={3} value={editForm.notes || ''}
            onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setEditModal(false)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate(editForm)} loading={updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Log activity modal */}
      <Modal open={activityModal} onClose={() => setActivityModal(false)} title="Log Activity" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Select label="Type" value={activityForm.type}
            onChange={(e) => setActivityForm((f) => ({ ...f, type: e.target.value }))}>
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>{ACTIVITY_TYPE_LABELS[t] || t}</option>
            ))}
          </Select>
          <Input label="Subject" required value={activityForm.subject}
            onChange={(e) => setActivityForm((f) => ({ ...f, subject: e.target.value }))} />
          <Textarea label="Description" rows={3} value={activityForm.description}
            onChange={(e) => setActivityForm((f) => ({ ...f, description: e.target.value }))} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setActivityModal(false)}>Cancel</Button>
            <Button
              onClick={() => addActivityMutation.mutate()}
              loading={addActivityMutation.isPending}
              disabled={!activityForm.subject}
            >
              Log Activity
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
