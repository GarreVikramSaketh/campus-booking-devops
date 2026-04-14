import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [selectedRole, setSelectedRole] = useState('student')
  const [form, setForm] = useState({ name: '', email: '', net_id: '', password: '', confirm_password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const roles = [
    { key: 'student', label: '🎓 Student' },
    { key: 'faculty', label: '👨‍🏫 Faculty' },
    { key: 'admin', label: '🛡️ Admin' },
  ]

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        const res = await api.post('/auth/login', { email: form.email, password: form.password })
        login(res.data.token, res.data.user)
        toast.success(`Welcome back, ${res.data.user.name}!`)
        const role = res.data.user.role
        if (role === 'admin') navigate('/admin')
        else if (role === 'faculty') navigate('/faculty')
        else navigate('/student')
      } else {
        if (form.password !== form.confirm_password) {
          toast.error('Passwords do not match')
          setLoading(false)
          return
        }
        const res = await api.post('/auth/register', {
          name: form.name,
          email: form.email,
          net_id: form.net_id,
          password: form.password,
          role: selectedRole,
        })
        login(res.data.token, res.data.user)
        toast.success('Account created successfully!')
        const role = res.data.user.role
        if (role === 'admin') navigate('/admin')
        else if (role === 'faculty') navigate('/faculty')
        else navigate('/student')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    }
    setLoading(false)
  }

  const getEmailHint = () => {
    if (selectedRole === 'admin') return 'e.g. vg0001admin@srmist.edu.in'
    return 'e.g. sk2366@srmist.edu.in'
  }

  const getNetIdHint = () => {
    if (selectedRole === 'admin') return 'e.g. vg0001 (2 letters + 4 digits)'
    return 'e.g. sk2366 (2 letters + 4 digits)'
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>SRM Campus Booking</h1>
          <p>Asset Booking & Management System</p>
        </div>

        {/* Role tabs */}
        <div className="role-tabs">
          {roles.map((r) => (
            <button
              key={r.key}
              className={`role-tab ${selectedRole === r.key ? 'active' : ''}`}
              onClick={() => { setSelectedRole(r.key); setForm({ name: '', email: '', net_id: '', password: '', confirm_password: '' }) }}
              type="button"
            >
              {r.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="Enter your full name" required />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">SRM Email Address</label>
            <input
              className="form-control"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder={getEmailHint()}
              required
            />
            <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              Must be a valid @srmist.edu.in email
            </small>
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Net ID</label>
              <input
                className="form-control"
                name="net_id"
                value={form.net_id}
                onChange={handleChange}
                placeholder={getNetIdHint()}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-control" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Enter password" required />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className="form-control" name="confirm_password" type="password" value={form.confirm_password} onChange={handleChange} placeholder="Confirm password" required />
            </div>
          )}

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px' }} type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? `Login as ${selectedRole}` : `Register as ${selectedRole}`}
          </button>
        </form>

        {selectedRole !== 'admin' && (
          <div className="auth-toggle">
            {mode === 'login' ? (
              <span>New to SRM Booking? <button onClick={() => setMode('register')}>Register here</button></span>
            ) : (
              <span>Already registered? <button onClick={() => setMode('login')}>Login here</button></span>
            )}
          </div>
        )}

        {selectedRole === 'admin' && (
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280', marginTop: '12px' }}>
            Admin accounts are pre-configured. Contact system admin if you need access.
          </p>
        )}
      </div>
    </div>
  )
}
