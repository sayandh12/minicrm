export default function Spinner({ size = 32 }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner-circle" style={{ width: size, height: size }} />
    </div>
  )
}

export function PageSpinner() {
  return (
    <div className="page-spinner">
      <div className="spinner-circle" />
    </div>
  )
}
