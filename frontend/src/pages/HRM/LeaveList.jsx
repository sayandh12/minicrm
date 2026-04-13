import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Plus, CalendarOff, CheckCircle, XCircle } from 'lucide-react'
import { hrmApi } from '../../api/hrmApi.js'
import {
  LEAVE_TYPES, LEAVE_TYPE_LABELS,
  LEAVE_STATUSES
} from '../../utils/constants.js'
import { formatDate } from '../../utils/formatters.js'
import PageHeader from '../../components/common/PageHeader.jsx'
import Button from '../../components/common/Button.jsx'
import Badge from '../../components/common/Badge.jsx'
import Modal from '../../components/common/Modal.jsx'
import Input, { Select, Textarea } from '../../components/common/Input.jsx'
import { Table, Th, Td, Tr } from '../../components/common/Table.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { PageSpinner } from '../../components/common/Spinner.jsx'
import useAuthStore from '../../store/authStore.js'
import { getErrorMessage } from '../../utils/errors.js'

const applySchema = z.object({
  leave_type: z.string(),
  start_date: z.string().min(1, 'Start date required'),
  end_date: z.string().min(1, 'End date required'),
  reason: z.string().min(10, 'Please provide a reason (min 10 chars)'),
})

const reviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejection_reason: z.string().optional(),
})

export default function LeaveList() {
  const qc = useQueryClient()
  const { canManageHR, user } = useAuthStore()
  const [page, setPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState('')
  const [applyModal, setApplyModal] = useState(false)
  const [reviewModal, setReviewModal] = useState(null) // leave object
  const [tab, setTab] = useState('all') // 'all' | 'my'

  // HR sees all; employees see only their own
  const showMyOnly = !canManageHR()

  const { data, isLoading } = useQuery({
    queryKey: ['leaves', user?.id, page, filterStatus, tab],
    queryFn: () =>
      tab === 'my' || showMyOnly
        ? hrmApi.myLeaves()
        : hrmApi.listLeaves({ page, size: 20, status: filterStatus || undefined }),
  })

  const applyForm = useForm({
    resolver: zodResolver(applySchema),
    defaultValues: { leave_type: 'annual' },
  })

  const reviewForm = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: { status: 'approved' },
  })

  const applyMutation = useMutation({
    mutationFn: (d) => hrmApi.applyLeave(d),
    onSuccess: () => {
      toast.success('Leave request submitted')
      qc.invalidateQueries({ queryKey: ['leaves'] })
      setApplyModal(false)
      applyForm.reset()
    },
    onError: (e) => toast.error(getErrorMessage(e, 'Failed to submit leave')),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, data }) => hrmApi.reviewLeave(id, data),
    onSuccess: () => {
      toast.success('Leave request reviewed')
      qc.invalidateQueries({ queryKey: ['leaves'] })
      setReviewModal(null)
      reviewForm.reset()
    },
    onError: (e) => toast.error(getErrorMessage(e, 'Review failed')),
  })

  const cancelMutation = useMutation({
    mutationFn: (id) => hrmApi.cancelLeave(id),
    onSuccess: () => {
      toast.success('Leave cancelled')
      qc.invalidateQueries({ queryKey: ['leaves'] })
    },
    onError: (e) => toast.error(getErrorMessage(e, 'Cancel failed')),
  })

  if (isLoading && !data) return <PageSpinner />

  const items = Array.isArray(data) ? data : data?.items || []
  const total = Array.isArray(data) ? data.length : data?.total || 0

  return (
    <div>
      <PageHeader
        title="Leave Management"
        subtitle={`${total} requests`}
        action={
          <Button onClick={() => setApplyModal(true)}>
            <Plus size={16} /> Apply for Leave
          </Button>
        }
      />

      {/* Tabs (HR only) */}
      {canManageHR() && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {[['all', 'All Requests'], ['my', 'My Leaves']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setTab(key); setPage(1) }}
              style={{
                padding: '6px 16px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                background: tab === key ? 'var(--accent)' : 'var(--surface)',
                color: tab === key ? '#fff' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Filters for HR all-view */}
      {canManageHR() && tab === 'all' && (
        <div className="filter-bar">
          <select
            className="field-input"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
            style={{ width: 'auto' }}
          >
            <option value="">All statuses</option>
            {LEAVE_STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      )}

      <div className="card">
        {items.length === 0 ? (
          <EmptyState
            icon={CalendarOff}
            title="No leave requests"
            description="Submit a leave request using the button above"
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  {canManageHR() && tab === 'all' && <Th>Employee</Th>}
                  <Th>Type</Th>
                  <Th>Dates</Th>
                  <Th>Days</Th>
                  <Th>Reason</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((leave) => (
                  <Tr key={leave.id}>
                    {canManageHR() && tab === 'all' && (
                      <Td style={{ fontWeight: 500 }}>{leave.employee_name || `Employee #${leave.employee_id}`}</Td>
                    )}
                    <Td>
                      <Badge>{LEAVE_TYPE_LABELS[leave.leave_type]}</Badge>
                    </Td>
                    <Td style={{ fontSize: 13 }}>
                      {formatDate(leave.start_date)}
                      {leave.start_date !== leave.end_date && (
                        <> → {formatDate(leave.end_date)}</>
                      )}
                    </Td>
                    <Td style={{ fontWeight: 600, textAlign: 'center' }}>{leave.days_count}</Td>
                    <Td style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 200 }}>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {leave.reason}
                      </span>
                    </Td>
                    <Td>
                      <Badge status={leave.status}>
                        {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                      </Badge>
                      {leave.rejection_reason && (
                        <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 3 }}>
                          {leave.rejection_reason}
                        </div>
                      )}
                    </Td>
                    <Td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {/* HR review buttons */}
                        {canManageHR() && leave.status === 'pending' && (
                          <>
                            <Button size="sm" variant="secondary"
                              style={{ color: 'var(--success)' }}
                              onClick={() => {
                                reviewForm.reset({ status: 'approved' })
                                setReviewModal(leave)
                              }}>
                              <CheckCircle size={14} />
                            </Button>
                            <Button size="sm" variant="danger"
                              onClick={() => {
                                reviewForm.reset({ status: 'rejected' })
                                setReviewModal(leave)
                              }}>
                              <XCircle size={14} />
                            </Button>
                          </>
                        )}
                        {/* Employee cancel button */}
                        {leave.status === 'pending' && (
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => { if (confirm('Cancel this leave request?')) cancelMutation.mutate(leave.id) }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            {!Array.isArray(data) && data && (
              <Pagination page={data.page} pages={data.pages} total={data.total} size={20} onPage={setPage} />
            )}
          </>
        )}
      </div>

      {/* Apply Leave Modal */}
      <Modal open={applyModal} onClose={() => setApplyModal(false)} title="Apply for Leave">
        <form onSubmit={applyForm.handleSubmit((d) => applyMutation.mutate(d))}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-grid">
              <Select label="Leave Type" required {...applyForm.register('leave_type')}>
                {LEAVE_TYPES.map((t) => (
                  <option key={t} value={t}>{LEAVE_TYPE_LABELS[t]}</option>
                ))}
              </Select>
              <div /> {/* spacer */}
              <Input
                label="Start Date" type="date" required
                error={applyForm.formState.errors.start_date?.message}
                {...applyForm.register('start_date')}
              />
              <Input
                label="End Date" type="date" required
                error={applyForm.formState.errors.end_date?.message}
                {...applyForm.register('end_date')}
              />
            </div>
            <Textarea
              label="Reason" required rows={3}
              error={applyForm.formState.errors.reason?.message}
              {...applyForm.register('reason')}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="secondary" type="button" onClick={() => setApplyModal(false)}>Cancel</Button>
              <Button type="submit" loading={applyMutation.isPending}>Submit Request</Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      <Modal
        open={!!reviewModal}
        onClose={() => setReviewModal(null)}
        title="Review Leave Request"
        size="sm"
      >
        {reviewModal && (
          <form onSubmit={reviewForm.handleSubmit((d) =>
            reviewMutation.mutate({ id: reviewModal.id, data: d })
          )}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', padding: '12px 14px', fontSize: 14 }}>
                <div><strong>{reviewModal.employee_name}</strong></div>
                <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                  {LEAVE_TYPE_LABELS[reviewModal.leave_type]} · {formatDate(reviewModal.start_date)} → {formatDate(reviewModal.end_date)} ({reviewModal.days_count} days)
                </div>
                <div style={{ marginTop: 6 }}>{reviewModal.reason}</div>
              </div>
              <Select label="Decision" {...reviewForm.register('status')}>
                <option value="approved">Approve</option>
                <option value="rejected">Reject</option>
              </Select>
              {reviewForm.watch('status') === 'rejected' && (
                <Textarea
                  label="Rejection Reason" required rows={2}
                  {...reviewForm.register('rejection_reason')}
                />
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Button variant="secondary" type="button" onClick={() => setReviewModal(null)}>Cancel</Button>
                <Button type="submit" loading={reviewMutation.isPending}>Submit Review</Button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
