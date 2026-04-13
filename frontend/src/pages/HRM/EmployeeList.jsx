import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { UserPlus, Users } from 'lucide-react'
import { hrmApi } from '../../api/hrmApi.js'
import { authApi } from '../../api/authApi.js'
import {
  EMPLOYMENT_TYPES, EMPLOYMENT_TYPE_LABELS,
  EMPLOYEE_STATUSES
} from '../../utils/constants.js'
import { formatDate, formatCurrency } from '../../utils/formatters.js'
import PageHeader from '../../components/common/PageHeader.jsx'
import Button from '../../components/common/Button.jsx'
import Badge from '../../components/common/Badge.jsx'
import Modal from '../../components/common/Modal.jsx'
import Input, { Select } from '../../components/common/Input.jsx'
import { Table, Th, Td, Tr } from '../../components/common/Table.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { PageSpinner } from '../../components/common/Spinner.jsx'
import useAuthStore from '../../store/authStore.js'
import { getErrorMessage } from '../../utils/errors.js'

const schema = z.object({
  user_id: z.string().min(1, 'User is required'),
  department: z.string().min(1, 'Department is required'),
  designation: z.string().min(1, 'Designation is required'),
  date_of_joining: z.string().min(1, 'Date required'),
  date_of_birth: z.string().optional(),
  salary: z.string().optional(),
  employment_type: z.string(),
  address: z.string().optional(),
  emergency_contact: z.string().optional(),
})

export default function EmployeeList() {
  const qc = useQueryClient()
  const { isAdmin } = useAuthStore()
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['employees', page, filterStatus],
    queryFn: () => hrmApi.listEmployees({
      page, size: 20,
      status: filterStatus || undefined,
    }),
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: authApi.listUsers,
    enabled: showModal,
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { employment_type: 'full_time' },
  })

  const createMutation = useMutation({
    mutationFn: (data) => hrmApi.createEmployee({
      ...data,
      user_id: parseInt(data.user_id),
      salary: data.salary ? parseFloat(data.salary) : null,
    }),
    onSuccess: () => {
      toast.success('Employee created')
      qc.invalidateQueries({ queryKey: ['employees'] })
      setShowModal(false)
      reset()
    },
    onError: (e) => toast.error(getErrorMessage(e, 'Failed to create employee')),
  })

  if (isLoading && !data) return <PageSpinner />

  const items = data?.items || []

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle={data ? `${data.total} employees` : ''}
        action={
          isAdmin() && (
            <Button onClick={() => setShowModal(true)}>
              <UserPlus size={16} /> Add Employee
            </Button>
          )
        }
      />

      <div className="filter-bar">
        <select
          className="field-input"
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
          style={{ width: 'auto' }}
        >
          <option value="">All statuses</option>
          {EMPLOYEE_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {items.length === 0 ? (
          <EmptyState icon={Users} title="No employees found" description="Add employee profiles to manage your team" />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Employee</Th>
                  <Th>Code</Th>
                  <Th>Department</Th>
                  <Th>Designation</Th>
                  <Th>Type</Th>
                  <Th>Status</Th>
                  <Th>Joined</Th>
                  <Th>Salary</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((emp) => (
                  <Tr key={emp.id}>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar--sm">{(emp.user_name || '?')[0]}</div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 14 }}>{emp.user_name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{emp.user_email}</div>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, background: 'var(--surface-2)', padding: '2px 7px', borderRadius: 5 }}>
                        {emp.employee_code}
                      </span>
                    </Td>
                    <Td>{emp.department}</Td>
                    <Td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{emp.designation}</Td>
                    <Td>
                      <Badge>{EMPLOYMENT_TYPE_LABELS[emp.employment_type]}</Badge>
                    </Td>
                    <Td>
                      <Badge status={emp.status}>{emp.status.replace(/_/g, ' ')}</Badge>
                    </Td>
                    <Td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {formatDate(emp.date_of_joining)}
                    </Td>
                    <Td style={{ fontWeight: 600 }}>
                      {emp.salary ? formatCurrency(emp.salary) : '—'}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            {data && (
              <Pagination page={data.page} pages={data.pages} total={data.total} size={20} onPage={setPage} />
            )}
          </>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Employee" size="lg">
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-grid">
              <Select label="User Account" required error={errors.user_id?.message} {...register('user_id')}>
                <option value="">Select user…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                ))}
              </Select>
              <Input label="Department" required error={errors.department?.message} {...register('department')} />
              <Input label="Designation" required error={errors.designation?.message} {...register('designation')} />
              <Input label="Date of Joining" type="date" required error={errors.date_of_joining?.message} {...register('date_of_joining')} />
              <Input label="Date of Birth" type="date" {...register('date_of_birth')} />
              <Input label="Salary (₹)" type="number" min="0" step="100" {...register('salary')} />
              <Select label="Employment Type" required {...register('employment_type')}>
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{EMPLOYMENT_TYPE_LABELS[t]}</option>
                ))}
              </Select>
              <Input label="Emergency Contact" {...register('emergency_contact')} />
              <Input label="Address" className="form-full" {...register('address')} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" loading={isSubmitting || createMutation.isPending}>Create Employee</Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
