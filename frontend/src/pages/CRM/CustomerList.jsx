import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Building2 } from 'lucide-react'
import { crmApi } from '../../api/crmApi.js'
import { formatCurrency, formatDate } from '../../utils/formatters.js'
import PageHeader from '../../components/common/PageHeader.jsx'
import Button from '../../components/common/Button.jsx'
import { Table, Th, Td, Tr } from '../../components/common/Table.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { PageSpinner } from '../../components/common/Spinner.jsx'
import useAuthStore from '../../store/authStore.js'

export default function CustomerList() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['customers', user?.id, page, search],
    queryFn: () => crmApi.listCustomers({ page, size: 20, search: search || undefined }),
  })

  if (isLoading && !data) return <PageSpinner />

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={data ? `${data.total} customers` : ''}
      />

      <div className="filter-bar">
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1) }}
          style={{ display: 'flex', gap: 8 }}
        >
          <input
            className="field-input search-input"
            placeholder="Search customers…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Button type="submit" variant="secondary" size="sm">
            <Search size={15} />
          </Button>
        </form>
      </div>

      <div className="card">
        {data?.items?.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No customers yet"
            description="Customers are created by converting qualified leads"
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Customer</Th>
                  <Th>Company</Th>
                  <Th>Email</Th>
                  <Th>Phone</Th>
                  <Th>Total Value</Th>
                  <Th>Since</Th>
                </tr>
              </thead>
              <tbody>
                {data?.items?.map((c) => (
                  <Tr key={c.id} onClick={() => navigate(`/customers/${c.id}`)}>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar--sm" style={{ flexShrink: 0 }}>
                          {c.full_name[0]}
                        </div>
                        <span style={{ fontWeight: 500 }}>{c.full_name}</span>
                      </div>
                    </Td>
                    <Td>{c.company || '—'}</Td>
                    <Td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{c.email || '—'}</Td>
                    <Td style={{ fontSize: 13 }}>{c.phone || '—'}</Td>
                    <Td style={{ fontWeight: 600, color: 'var(--success)' }}>
                      {formatCurrency(c.total_value)}
                    </Td>
                    <Td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {formatDate(c.created_at)}
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
