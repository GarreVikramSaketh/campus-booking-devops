import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const navItems = [
  { path: '/admin', icon: '🏠', label: 'Dashboard' },
  { path: '/admin/assets', icon: '🏫', label: 'Manage Assets' },
  { path: '/admin/approvals', icon: '✅', label: 'Booking Approvals' },
  { path: '/admin/recurring', icon: '🔁', label: 'Recurring Requests' },
  { path: '/admin/reports', icon: '📊', label: 'Usage Reports' },
]

// ─── ADMIN DASHBOARD ───
export function AdminHome() {
  const [summary, setSummary] = useState({})

  useEffect(() => { api.get('/reports/summary').then((r) => setSummary(r.data)) }, [])

  return (
    <Layout navItems={navItems}>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Overview of campus asset booking system.</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Students</div>
          <div className="stat-value">{summary.total_students || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Faculty</div>
          <div className="stat-value">{summary.total_faculty || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Assets</div>
          <div className="stat-value">{summary.total_assets || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Confirmed Bookings</div>
          <div className="stat-value" style={{ color: '#2e7d32' }}>{summary.total_confirmed || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Approvals</div>
          <div className="stat-value" style={{ color: '#f57c00' }}>{summary.total_pending || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Recurring</div>
          <div className="stat-value" style={{ color: '#c62828' }}>{summary.pending_recurring || 0}</div>
        </div>
      </div>
    </Layout>
  )
}

// ─── MANAGE ASSETS ───
export function AdminAssets() {
  const [assets, setAssets] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', type: 'classroom', location: '', capacity: '', status: 'active' })
  const [submitting, setSubmitting] = useState(false)

  const fetchAssets = () => api.get('/assets/all').then((r) => setAssets(r.data))
  useEffect(() => { fetchAssets() }, [])

  const openAdd = () => { setEditing(null); setForm({ name: '', type: 'classroom', location: '', capacity: '', status: 'active' }); setShowForm(true) }
  const openEdit = (a) => { setEditing(a); setForm({ name: a.name, type: a.type, location: a.location, capacity: a.capacity, status: a.status }); setShowForm(true) }

  const submit = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      if (editing) {
        await api.put(`/assets/${editing.id}`, form)
        toast.success('Asset updated')
      } else {
        await api.post('/assets', form)
        toast.success('Asset added')
      }
      setShowForm(false); fetchAssets()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    setSubmitting(false)
  }

  const deactivate = async (id) => {
    if (!confirm('Deactivate this asset? It will no longer be bookable.')) return
    await api.delete(`/assets/${id}`); toast.success('Asset deactivated'); fetchAssets()
  }

  return (
    <Layout navItems={navItems}>
      <div className="page-header">
        <h1>Manage Assets</h1>
        <p>Add, update, or remove campus assets.</p>
      </div>
      <div style={{ marginBottom: '16px' }}>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Asset</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit Asset' : 'Add New Asset'}</h2>
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Asset Name</label>
                <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Room A101" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-control" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="classroom">Classroom</option>
                    <option value="lab">Lab</option>
                    <option value="sports">Sports</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Capacity</label>
                  <input type="number" className="form-control" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="e.g. 60" required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-control" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Block A, Floor 1" required />
              </div>
              {editing && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}
              <div className="flex-gap">
                <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Asset'}</button>
                <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Type</th><th>Location</th><th>Capacity</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.name}</strong></td>
                  <td><span className={`badge badge-${a.type}`}>{a.type}</span></td>
                  <td>{a.location}</td>
                  <td>{a.capacity}</td>
                  <td>
                    <span className="badge" style={{ background: a.status === 'active' ? '#e8f5e9' : '#ffebee', color: a.status === 'active' ? '#1b5e20' : '#b71c1c' }}>
                      {a.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex-gap">
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(a)}>Edit</button>
                      {a.status === 'active' && <button className="btn btn-danger btn-sm" onClick={() => deactivate(a.id)}>Deactivate</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}

// ─── BOOKING APPROVALS ───
export function AdminApprovals() {
  const [bookings, setBookings] = useState([])
  const [tab, setTab] = useState('pending')

  const fetchAll = () => api.get('/bookings/all').then((r) => setBookings(r.data))
  useEffect(() => { fetchAll() }, [])

  const approve = async (id) => {
    await api.put(`/bookings/${id}/approve`); toast.success('Booking approved'); fetchAll()
  }
  const reject = async (id) => {
    await api.put(`/bookings/${id}/reject`); toast.success('Booking rejected'); fetchAll()
  }
  const cancel = async (id) => {
    if (!confirm('Cancel this booking?')) return
    await api.put(`/bookings/${id}/cancel`); toast.success('Cancelled'); fetchAll()
  }

  const filtered = bookings.filter((b) => tab === 'all' ? true : b.status === tab)

  return (
    <Layout navItems={navItems}>
      <div className="page-header">
        <h1>Booking Approvals</h1>
        <p>Review, approve, or reject booking requests from students and faculty.</p>
      </div>
      <div className="flex-gap" style={{ marginBottom: '16px' }}>
        {['pending', 'confirmed', 'cancelled', 'rejected', 'all'].map((t) => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-outline'} btn-sm`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="icon">✅</div><p>No {tab} bookings.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>User</th><th>Role</th><th>Asset</th><th>Date & Time</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id}>
                    <td><strong>{b.user_name}</strong><br /><small style={{ color: '#6b7280' }}>{b.net_id}</small></td>
                    <td><span className={`badge`} style={{ background: b.user_role === 'faculty' ? '#e8f5e9' : '#e3f2fd', color: b.user_role === 'faculty' ? '#1b5e20' : '#1565c0' }}>{b.user_role}</span></td>
                    <td><strong>{b.asset_name}</strong></td>
                    <td>
                      {new Date(b.start_time).toLocaleDateString()}<br />
                      <small>{new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    </td>
                    <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                    <td>
                      <div className="flex-gap">
                        {b.status === 'pending' && <>
                          <button className="btn btn-success btn-sm" onClick={() => approve(b.id)}>Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => reject(b.id)}>Reject</button>
                        </>}
                        {b.status === 'confirmed' && new Date(b.start_time) > new Date() && (
                          <button className="btn btn-warning btn-sm" onClick={() => cancel(b.id)}>Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}

// ─── RECURRING REQUESTS ───
export function AdminRecurring() {
  const [requests, setRequests] = useState([])
  const [notes, setNotes] = useState('')

  const fetch = () => api.get('/recurring/all').then((r) => setRequests(r.data))
  useEffect(() => { fetch() }, [])

  const approve = async (id) => {
    await api.put(`/recurring/${id}/approve`, { notes }); toast.success('Recurring request approved & slots created'); fetch()
  }
  const reject = async (id) => {
    await api.put(`/recurring/${id}/reject`, { notes }); toast.success('Rejected'); fetch()
  }

  return (
    <Layout navItems={navItems}>
      <div className="page-header">
        <h1>Recurring Booking Requests</h1>
        <p>Review and approve faculty recurring/semester booking requests.</p>
      </div>
      <div className="card">
        {requests.length === 0 ? (
          <div className="empty-state"><div className="icon">🔁</div><p>No recurring requests.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Faculty</th><th>Asset</th><th>Pattern</th><th>Duration</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.faculty_name}</strong><br /><small style={{ color: '#6b7280' }}>{r.net_id}</small></td>
                    <td><strong>{r.asset_name}</strong></td>
                    <td><span className="badge" style={{ background: '#e3f2fd', color: '#1565c0' }}>{r.pattern}</span></td>
                    <td>{r.start_date} → {r.end_date}</td>
                    <td>{r.start_time} – {r.end_time}</td>
                    <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                    <td>
                      {r.status === 'pending' && (
                        <div className="flex-gap">
                          <button className="btn btn-success btn-sm" onClick={() => approve(r.id)}>Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => reject(r.id)}>Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}

// ─── REPORTS ───
export function AdminReports() {
  const [data, setData] = useState([])
  const [assets, setAssets] = useState([])
  const [filters, setFilters] = useState({ start_date: '', end_date: '', asset_id: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => { api.get('/assets/all').then((r) => setAssets(r.data)); fetchReport() }, [])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.start_date) params.start_date = filters.start_date
      if (filters.end_date) params.end_date = filters.end_date
      if (filters.asset_id) params.asset_id = filters.asset_id
      const res = await api.get('/reports/usage', { params })
      setData(res.data)
    } catch { toast.error('Failed to load report') }
    setLoading(false)
  }

  return (
    <Layout navItems={navItems}>
      <div className="page-header">
        <h1>Asset Usage Reports</h1>
        <p>Analyze campus asset utilization and optimize resource planning.</p>
      </div>
      <div className="search-bar">
        <div className="form-group" style={{ margin: 0, flex: '1 1 140px' }}>
          <label className="form-label">From Date</label>
          <input type="date" className="form-control" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} />
        </div>
        <div className="form-group" style={{ margin: 0, flex: '1 1 140px' }}>
          <label className="form-label">To Date</label>
          <input type="date" className="form-control" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} />
        </div>
        <div className="form-group" style={{ margin: 0, flex: '1 1 180px' }}>
          <label className="form-label">Asset</label>
          <select className="form-control" value={filters.asset_id} onChange={(e) => setFilters({ ...filters, asset_id: e.target.value })}>
            <option value="">All Assets</option>
            {assets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn btn-primary" onClick={fetchReport} disabled={loading}>{loading ? '...' : '📊 Generate'}</button>
        </div>
      </div>

      <div className="card">
        {data.length === 0 ? (
          <div className="empty-state"><div className="icon">📊</div><p>No data for selected filters.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Asset</th><th>Type</th><th>Location</th><th>Date</th><th>Total Bookings</th><th>Confirmed</th><th>Cancelled</th></tr></thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i}>
                    <td><strong>{row.asset_name}</strong></td>
                    <td><span className={`badge badge-${row.asset_type}`}>{row.asset_type}</span></td>
                    <td>{row.location}</td>
                    <td>{row.booking_date || '—'}</td>
                    <td><strong>{row.total_bookings}</strong></td>
                    <td style={{ color: '#2e7d32' }}>{row.confirmed}</td>
                    <td style={{ color: '#c62828' }}>{row.cancelled}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
