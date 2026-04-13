import { forwardRef } from 'react'
import clsx from 'clsx'

const Input = forwardRef(({
  label, error, hint, className,
  required, id, ...rest
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className={clsx('field', className)}>
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label}{required && <span className="required">*</span>}
        </label>
      )}
      <input ref={ref} id={inputId} className={clsx('field-input', error && 'field-input--error')} {...rest} />
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  )
})

export default Input

export const Select = forwardRef(({ label, error, hint, className, required, id, children, ...rest }, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className={clsx('field', className)}>
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label}{required && <span className="required">*</span>}
        </label>
      )}
      <select ref={ref} id={inputId} className={clsx('field-input field-select', error && 'field-input--error')} {...rest}>
        {children}
      </select>
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  )
})

export const Textarea = forwardRef(({ label, error, hint, className, required, id, ...rest }, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className={clsx('field', className)}>
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label}{required && <span className="required">*</span>}
        </label>
      )}
      <textarea ref={ref} id={inputId} className={clsx('field-input field-textarea', error && 'field-input--error')} {...rest} />
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  )
})
