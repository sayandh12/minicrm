import clsx from 'clsx'

export function Table({ children, className }) {
  return (
    <div className="table-wrap">
      <table className={clsx('table', className)}>{children}</table>
    </div>
  )
}

export function Th({ children, className }) {
  return <th className={clsx('table-th', className)}>{children}</th>
}

export function Td({ children, className }) {
  return <td className={clsx('table-td', className)}>{children}</td>
}

export function Tr({ children, onClick, className }) {
  return (
    <tr
      className={clsx('table-tr', onClick && 'table-tr--clickable', className)}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}
