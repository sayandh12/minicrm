import { format, parseISO, formatDistanceToNow } from 'date-fns'

export const formatDate = (d) => {
  if (!d) return '—'
  try { return format(typeof d === 'string' ? parseISO(d) : d, 'MMM d, yyyy') }
  catch { return d }
}

export const formatDateTime = (d) => {
  if (!d) return '—'
  try { return format(typeof d === 'string' ? parseISO(d) : d, 'MMM d, yyyy h:mm a') }
  catch { return d }
}

export const timeAgo = (d) => {
  if (!d) return ''
  try { return formatDistanceToNow(typeof d === 'string' ? parseISO(d) : d, { addSuffix: true }) }
  catch { return d }
}

export const formatCurrency = (v) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0)

export const capitalize = (s) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : ''

export const getInitials = (name) =>
  name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?'
