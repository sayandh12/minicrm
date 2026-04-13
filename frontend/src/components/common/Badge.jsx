import clsx from 'clsx'

const STATUS_COLORS = {
  // Lead statuses
  new:         'badge--purple',
  contacted:   'badge--amber',
  qualified:   'badge--blue',
  proposal:    'badge--violet',
  negotiation: 'badge--pink',
  converted:   'badge--green',
  lost:        'badge--gray',
  // Leave statuses
  pending:     'badge--amber',
  approved:    'badge--green',
  rejected:    'badge--red',
  cancelled:   'badge--gray',
  // Employee statuses
  active:      'badge--green',
  on_leave:    'badge--amber',
  resigned:    'badge--gray',
  terminated:  'badge--red',
}

export default function Badge({ children, status, className }) {
  return (
    <span className={clsx('badge', status && STATUS_COLORS[status], className)}>
      {children}
    </span>
  )
}
