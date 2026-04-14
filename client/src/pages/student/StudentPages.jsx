import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const navItems = [
  { path: '/student', icon: '🏠', label: 'Dashboard' },
  { path: '/student/search', icon: '🔍', label: 'Search Assets' },
  { path: '/student/bookings', icon: '📋', label: 'My Bookings' },
]

// ─── DASHBOARD HOME ───
export function StudentHome() {
  const [stats, setStats] = useState({ confirmed: 0, pending: 0, cancelled: 0 })
  const [recentBookings, setRecentBookings] = useState([])

  useEffect(() => {
    api.get('/bookings/my').then((res) => {
      const data = res.data
      setStats({
        confirmed: data.filter((b) => b.status === 'confirmed').length,
        pending: data.filter((b) => b.status === 'pending').length,
        cancelled: data.filter((b) => b.status === 'cancelled').length,
      })
      setRecentBookings(data.slice(0, 5))
    })
  }, [])

  return (
    <Layout navItems={navItems}>
      <div className="page-header">
        <h1>Student Dashboard</h1>
        <p>Welcome! Manage your campus asset bookings here.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Confirmed Bookings</div>
          <div className="stat-value" style={{ color: '#2e7d32' }}>{stats.confirmed}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value" style={{ color: '#f57c00' }}>{stats.pending}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cancelled</div>
          <div className="stat-value" style={{ color: '#c62828' }}>{stats.cancelled}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Bookings</h2>
        </div>
        {recentBookings.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📭</div>
            <p>No bookings yet. <a href="/student/search" style={{ color: '#1a237e' }}>Search and book an asset!</a></p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Asset</th><th>Type</th><th>Date & Time</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id}>
                    <td><strong>{b.asset_name}</strong><br /><small style={{ color: '#6b7280' }}>{b.location}</small></td>
                    <td><span className={`badge badge-${b.asset_type}`}>{b.asset_type}</span></td>
                    <td>
                      {new Date(b.start_time).toLocaleDateString()}<br />
                      <small>{new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    </td>
                    <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
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

// ─── SEARCH ASSETS ───
export function StudentSearch() {
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [type, setType] = useState('')
  const [assets, setAssets] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [booking, setBooking] = useState(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const search = async () => {
    setLoading(true)
    setSearched(true)
    try {
      const params = {}
      if (date) params.date = date
      if (startTime) params.start_time = startTime
      if (endTime) params.end_time = endTime
      if (type) params.type = type
      const res = await api.get('/assets', { params })
      setAssets(res.data)
    } catch {
      toast.error('Search failed')
    }
    setLoading(false)
  }

  const handleBook = async () => {
    if (!date || !startTime || !endTime) {
      toast.error('Please select date and time before booking')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/bookings', {
        asset_id: booking.id,
        start_time: `${date} ${startTime}`,
        end_time: `${date} ${endTime}`,
        notes,
      })
      toast.success('Booking confirmed!')
      setBooking(null)
      search()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed')
    }
    setSubmitting(false)
  }

  return (
    <Layout navItems={navItems}>
      <div className="page-header">
        <h1>Search Available Assets</h1>
        <p>Find and book classrooms, labs, and sports facilities.</p>
      </div>

      <div className="search-bar">
        <div className="form-group" style={{ margin: 0, flex: '1 1 140px' }}>
          <label className="form-label">Date</label>
          <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
        </div>
        <div className="form-group" style={{ margin: 0, flex: '1 1 120px' }}>
          <label className="form-label">Start Time</label>
          <input type="time" className="form-control" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0, flex: '1 1 120px' }}>
          <label className="form-label">End Time</label>
          <input type="time" className="form-control" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0, flex: '1 1 140px' }}>
          <label className="form-label">Asset Type</label>
          <select className="form-control" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All Types</option>
            <option value="classroom">Classroom</option>
            <option value="lab">Lab</option>
            <option value="sports">Sports</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn btn-primary" onClick={search} disabled={loading}>
            {loading ? '...' : '🔍 Search'}
          </button>
        </div>
      </div>

      {!searched ? (
        <div className="empty-state">
          <div className="icon">🏫</div>
          <p>Use the filters above to search for available assets.</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="empty-state">
          <div className="icon">😔</div>
          <p>No assets available for the selected filters.</p>
        </div>
      ) : (
        <div className="asset-grid">
          {assets.map((a) => (
            <div key={a.id} className="asset-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3>{a.name}</h3>
                <span className={`badge badge-${a.type}`}>{a.type}</span>
              </div>
              <div className="meta">
                <span>📍 {a.location}</span>
                <span>👥 Capacity: {a.capacity}</span>
              </div>
              <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setBooking(a)}>
                Book Now
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {booking && (
        <div className="modal-overlay" onClick={() => setBooking(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Booking</h2>
            <div style={{ background: '#f4f6fb', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
              <strong>{booking.name}</strong>
              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                {booking.location} · Capacity: {booking.capacity}
              </div>
              <div style={{ fontSize: '13px', marginTop: '6px' }}>
                📅 {date} &nbsp; ⏰ {startTime} – {endTime}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea className="form-control" rows="3" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Purpose of booking..." />
            </div>
            <div className="flex-gap">
              <button className="btn btn-primary" onClick={handleBook} disabled={submitting}>{submitting ? 'Booking...' : 'Confirm Booking'}</button>
              <button className="btn btn-outline" onClick={() => setBooking(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

// ─── MY BOOKINGS ───
export function StudentBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = async () => {
    const res = await api.get('/bookings/my')
    setBookings(res.data)
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const cancel = async (id) => {
    if (!confirm('Cancel this booking?')) return
    try {
      await api.put(`/bookings/${id}/cancel`)
      toast.success('Booking cancelled')
      fetch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot cancel')
    }
  }

  return (
    <Layout navItems={navItems}>
      <div className="page-header">
        <h1>My Bookings</h1>
        <p>View and manage all your current and past bookings.</p>
      </div>
      <div className="card">
        {loading ? <p>Loading...</p> : bookings.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📭</div>
            <p>No bookings found.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Asset</th><th>Type</th><th>Date</th><th>Time</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td><strong>{b.asset_name}</strong><br /><small style={{ color: '#6b7280' }}>{b.location}</small></td>
                    <td><span className={`badge badge-${b.asset_type}`}>{b.asset_type}</span></td>
                    <td>{new Date(b.start_time).toLocaleDateString()}</td>
                    <td>{new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                    <td>
                      {b.status === 'confirmed' && new Date(b.start_time) > new Date() && (
                        <button className="btn btn-danger btn-sm" onClick={() => cancel(b.id)}>Cancel</button>
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
