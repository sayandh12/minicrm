import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { leadsApi } from '../../api/leadsApi.js'
import { authApi } from '../../api/authApi.js'
import {
  LEAD_STATUSES, LEAD_STATUS_LABELS,
  LEAD_SOURCES, LEAD_SOURCE_LABELS
} from '../../utils/constants.js'
import PageHeader from '../../components/common/PageHeader.jsx'
import Button from '../../components/common/Button.jsx'
import Input, { Select, Textarea } from '../../components/common/Input.jsx'
import { PageSpinner } from '../../components/common/Spinner.jsx'
import { getErrorMessage } from '../../utils/errors.js'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  first_name: z.string().min(1, 'First name required'),
  last_name: z.string().min(1, 'Last name required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string(),
  status: z.string(),
  notes: z.string().optional(),
  follow_up_date: z.string().optional(),
  estimated_value: z.string().optional(),
  assigned_to_id: z.string().optional(),
})

export default function LeadForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isEdit = Boolean(id)

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadsApi.get(id),
    enabled: isEdit,
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: authApi.listUsers,
  })

  const salesUsers = users.filter((u) =>
    ['admin', 'sales_manager', 'sales_executive'].includes(u.role)
  )

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { source: 'other', status: 'new' },
  })

  useEffect(() => {
    if (lead) {
      reset({
        ...lead,
        estimated_value: lead.estimated_value?.toString() || '',
        assigned_to_id: lead.assigned_to_id?.toString() || '',
        follow_up_date: lead.follow_up_date || '',
      })
    }
  }, [lead, reset])

  const mutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        estimated_value: data.estimated_value ? parseFloat(data.estimated_value) : null,
        assigned_to_id: data.assigned_to_id ? parseInt(data.assigned_to_id) : null,
        follow_up_date: data.follow_up_date || null,
        email: data.email || null,
      }
      return isEdit ? leadsApi.update(id, payload) : leadsApi.create(payload)
    },
    onSuccess: (res) => {
      toast.success(isEdit ? 'Lead updated' : 'Lead created')
      qc.invalidateQueries({ queryKey: ['leads'] })
      navigate(`/leads/${res.id || id}`)
    },
    onError: (e) => toast.error(getErrorMessage(e, 'Failed to save lead')),
  })

  if (isEdit && isLoading) return <PageSpinner />

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Lead' : 'New Lead'}
        subtitle={isEdit ? `Editing: ${lead?.title}` : 'Create a new lead record'}
      />

      <div className="card" style={{ maxWidth: 800 }}>
        <div className="card-body">
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              <Input label="Lead Title" required placeholder="e.g. Enterprise Deal — ACME Corp"
                error={errors.title?.message} {...register('title')} />

              <div className="form-grid">
                <Input label="First Name" required error={errors.first_name?.message} {...register('first_name')} />
                <Input label="Last Name" required error={errors.last_name?.message} {...register('last_name')} />
                <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
                <Input label="Phone" {...register('phone')} />
                <Input label="Company" {...register('company')} />
                <Input label="Estimated Value (₹)" type="number" step="0.01" min="0"
                  {...register('estimated_value')} />
                <Select label="Lead Source" required {...register('source')}>
                  {LEAD_SOURCES.map((s) => <option key={s} value={s}>{LEAD_SOURCE_LABELS[s]}</option>)}
                </Select>
                <Select label="Status" required {...register('status')}>
                  {LEAD_STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
                </Select>
                <Input label="Follow-up Date" type="date" {...register('follow_up_date')} />
                <Select label="Assign To" {...register('assigned_to_id')}>
                  <option value="">Unassigned</option>
                  {salesUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.full_name}</option>
                  ))}
                </Select>
              </div>

              <Textarea label="Notes" rows={4} {...register('notes')} />

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
                <Button type="submit" loading={isSubmitting || mutation.isPending}>
                  {isEdit ? 'Update Lead' : 'Create Lead'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
