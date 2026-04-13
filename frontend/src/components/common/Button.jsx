import clsx from 'clsx'

const variants = {
  primary:  'btn-primary',
  secondary:'btn-secondary',
  ghost:    'btn-ghost',
  danger:   'btn-danger',
}

const sizes = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
}

export default function Button({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false,
  className, onClick, type = 'button', ...rest
}) {
  return (
    <button
      type={type}
      className={clsx('btn', variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading && <span className="spinner" />}
      {children}
    </button>
  )
}
