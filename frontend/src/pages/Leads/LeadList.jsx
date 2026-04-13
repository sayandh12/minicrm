import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { leadsApi } from '../../api/leadsApi.js'
import { LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS, LEAD_STATUSES } from '../../utils/constants.js'
import { formatDate, formatCurrency } from '../../utils/formatters.js'
import PageHeader from '../../components/common/PageHeader.jsx'
import Button from '../../components/common/Button.jsx'
import Badge from '../../components/common/Badge.jsx'
import { Table, Th, Td, Tr } from '../../components/common/Table.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { PageSpinner } from '../../components/common/Spinner.jsx'
import useAuthStore from '../../store/authStore.js'
import Input, { Select } from '../../components/common/Input.jsx'

export default function LeadList() {
  const navigate = useNavigate()
  const { canManageLeads } = useAuthStore()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['leads', page, search, status],
    queryFn: () => leadsApi.list({ page, size: 20, search: search || undefined, status: status || undefined }),
  })

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  if (isLoading && !data) return <PageSpinner />

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle={data ? `${data.total} total leads` : ''}
        action={
          canManageLeads() && (
            <Button onClick={() => navigate('/leads/new')}>
              <Plus size={16} /> New Lead
            </Button>
          )
        }
      />

      {/* Filters */}
      <div className="filter-bar">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <input
            className="field-input search-input"
            placeholder="Search leads…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Button type="submit" variant="secondary" size="sm">
            <Search size={15} />
          </Button>
        </form>
        <select
          className="field-input"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          style={{ width: 'auto' }}
        >
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {data?.items?.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No leads found"
            description="Try adjusting your search or filters"
            action={canManageLeads() && (
              <Button onClick={() => navigate('/leads/new')}>
                <Plus size={15} /> Create first lead
              </Button>
            )}
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Lead</Th>
                  <Th>Company</Th>
                  <Th>Status</Th>
                  <Th>Source</Th>
                  <Th>Est. Value</Th>
                  <Th>Follow-up</Th>
                  <Th>Assigned To</Th>
                </tr>
              </thead>
              <tbody>
                {data?.items?.map((lead) => (
                  <Tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)}>
                    <Td>
                      <div style={{ fontWeight: 500 }}>{lead.first_name} {lead.last_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lead.email}</div>
                    </Td>
                    <Td>{lead.company || '—'}</Td>
                    <Td>
                      <Badge status={lead.status}>{LEAD_STATUS_LABELS[lead.status]}</Badge>
                    </Td>
                    <Td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {LEAD_SOURCE_LABELS[lead.source]}
                    </Td>
                    <Td>{lead.estimated_value ? formatCurrency(lead.estimated_value) : '—'}</Td>
                    <Td style={{ fontSize: 13 }}>
                      {lead.follow_up_date ? (
                        <span style={{ color: isPast(lead.follow_up_date) ? 'var(--danger)' : 'inherit' }}>
                          {formatDate(lead.follow_up_date)}
                        </span>
                      ) : '—'}
                    </Td>
                    <Td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {lead.assigned_to_name || '—'}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            {data && (
              <Pagination
                page={data.page} pages={data.pages}
                total={data.total} size={20}
                onPage={setPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function isPast(dateStr) {
  return new Date(dateStr) < new Date(new Date().toDateString())
}
