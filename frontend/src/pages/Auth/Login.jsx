import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { authApi } from '../../api/authApi.js'
import useAuthStore from '../../store/authStore.js'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import { getErrorMessage } from '../../utils/errors.js'

const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password is required'),
})

export default function Login() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    try {
      const res = await authApi.login(data.email, data.password)
      login(res)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const message = getErrorMessage(err, 'Login failed')
      if (message.toLowerCase().includes('email')) {
        setError('email', { type: 'manual', message })
      } else if (message.toLowerCase().includes('password')) {
        setError('password', { type: 'manual', message })
      } else {
        toast.error(message)
      }
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.brand}>
          <div style={styles.logoBox}>M</div>
          <div>
            <div style={styles.brandName}>MiniCRM</div>
          </div>
        </div>
        <div style={styles.tagline}>
          <h1 style={styles.taglineH}>Manage leads,<br />close deals faster.</h1>
          <p style={styles.taglineP}>
            A unified platform for Lead Management, CRM, and HR — built for modern teams.
          </p>
        </div>
        <div style={styles.circles}>
          <div style={{...styles.circle, width: 300, height: 300, bottom: -80, left: -80, opacity: .07}} />
          <div style={{...styles.circle, width: 200, height: 200, bottom: 60, left: 120, opacity: .05}} />
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.formCard}>
          <div style={styles.formHead}>
            <h2 style={styles.formTitle}>Welcome back</h2>
            <p style={styles.formSub}>Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
            <Input
              label="Email address"
              type="email"
              placeholder="you@company.com"
              required
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              required
              error={errors.password?.message}
              {...register('password')}
            />

            <Button type="submit" loading={isSubmitting} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
              Sign in
            </Button>
          </form>

          {/* <div style={styles.demoCreds}>
            <div style={styles.demoTitle}>Demo credentials</div>
            <div style={styles.demoRow}><span>Admin</span><code>admin@minicrm.com / Admin@123456</code></div>
          </div> */}
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
  },
  left: {
    flex: 1,
    background: '#0F172A',
    padding: '40px 48px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 12 },
  logoBox: {
    width: 36, height: 36,
    background: '#2563EB',
    borderRadius: 10,
    display: 'grid', placeItems: 'center',
    fontSize: 18, fontWeight: 700, color: '#fff',
  },
  brandName: { color: '#fff', fontWeight: 600, fontSize: 16 },
  brandSub: { color: 'rgba(255,255,255,.35)', fontSize: 12 },
  tagline: { marginTop: 'auto', marginBottom: 'auto', paddingTop: 60 },
  taglineH: {
    fontSize: 40, fontWeight: 700, color: '#fff',
    lineHeight: 1.15, letterSpacing: '-.01em',
  },
  taglineP: { color: 'rgba(255,255,255,.5)', fontSize: 16, marginTop: 14, maxWidth: 320, lineHeight: 1.7 },
  circles: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  circle: {
    position: 'absolute',
    border: '1px solid rgba(255,255,255,1)',
    borderRadius: '50%',
  },
  right: {
    width: 480,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 32px',
    background: '#F8F9FC',
  },
  formCard: {
    background: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: 16,
    padding: '36px 32px',
    width: '100%',
    boxShadow: '0 4px 24px rgba(0,0,0,.07)',
  },
  formHead: { marginBottom: 28 },
  formTitle: { fontSize: 22, fontWeight: 700, color: '#0F172A' },
  formSub: { fontSize: 14, color: '#64748B', marginTop: 4 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  demoCreds: {
    marginTop: 24,
    padding: '14px 16px',
    background: '#F1F4F9',
    borderRadius: 10,
    border: '1px solid #E2E8F0',
  },
  demoTitle: { fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 },
  demoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#475569' },
}
