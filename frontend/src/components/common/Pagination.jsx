import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, pages, total, size, onPage }) {
  if (pages <= 1) return null
  return (
    <div className="pagination">
      <span className="pagination-info">
        {(page - 1) * size + 1}–{Math.min(page * size, total)} of {total}
      </span>
      <div className="pagination-controls">
        <button
          className="pagination-btn"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1)
          .reduce((acc, p, idx, arr) => {
            if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
            acc.push(p)
            return acc
          }, [])
          .map((p, idx) =>
            p === '...' ? (
              <span key={`ellipsis-${idx}`} className="pagination-ellipsis">…</span>
            ) : (
              <button
                key={p}
                className={`pagination-btn${p === page ? ' pagination-btn--active' : ''}`}
                onClick={() => onPage(p)}
              >
                {p}
              </button>
            )
          )}
        <button
          className="pagination-btn"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
