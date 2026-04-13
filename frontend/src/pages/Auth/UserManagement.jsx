import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { UserPlus } from 'lucide-react'
import { authApi } from '../../api/authApi.js'
import { ROLE_LABELS } from '../../utils/constants.js'
import PageHeader from '../../components/common/PageHeader.jsx'
import Button from '../../components/common/Button.jsx'
import Badge from '../../components/common/Badge.jsx'
import Modal from '../../components/common/Modal.jsx'
import Input, { Select } from '../../components/common/Input.jsx'
import { Table, Th, Td, Tr } from '../../components/common/Table.jsx'
import { PageSpinner } from '../../components/common/Spinner.jsx'
import { formatDate } from '../../utils/formatters.js'
import { getErrorMessage } from '../../utils/errors.js'

const schema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2),
  password: z.string().min(8),
  role: z.string(),
  phone: z.string().optional(),
})

export default function UserManagement() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: authApi.listUsers,
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: 'employee' },
  })

  const createMutation = useMutation({
    mutationFn: authApi.createUser,
    onSuccess: () => {
      toast.success('User created')
      qc.invalidateQueries({ queryKey: ['users'] })
      setShowModal(false)
      reset()
    },
    onError: (e) => toast.error(getErrorMessage(e, 'Failed to create user')),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }) => authApi.updateUser(id, { is_active }),
    onSuccess: () => {
      toast.success('User updated')
      qc.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (e) => toast.error(getErrorMessage(e, 'Failed to update user')),
  })

  if (isLoading) return <PageSpinner />

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle={`${users.length} users`}
        action={
          <Button onClick={() => setShowModal(true)}>
            <UserPlus size={16} /> New User
          </Button>
        }
      />

      <div className="card">
        <Table>
          <thead>
            <tr>
              <Th>Name</Th><Th>Email</Th><Th>Role</Th>
              <Th>Status</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <Tr key={u.id}>
                <Td><strong>{u.full_name}</strong></Td>
                <Td style={{ color: 'var(--text-muted)' }}>{u.email}</Td>
                <Td><Badge>{ROLE_LABELS[u.role]}</Badge></Td>
                <Td>
                  <Badge status={u.is_active ? 'active' : 'terminated'}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </Td>
                <Td>
                  <Button
                    variant={u.is_active ? 'danger' : 'secondary'}
                    size="sm"
                    loading={toggleActive.isPending}
                    onClick={() => toggleActive.mutate({ id: u.id, is_active: !u.is_active })}
                  >
                    {u.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create User">
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-grid">
            <Input label="Full Name" required error={errors.full_name?.message} {...register('full_name')} />
            <Input label="Email" type="email" required error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" required error={errors.password?.message} {...register('password')} />
            <Input label="Phone" {...register('phone')} />
            <Select label="Role" required {...register('role')}>
              {Object.entries(ROLE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Create User</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
