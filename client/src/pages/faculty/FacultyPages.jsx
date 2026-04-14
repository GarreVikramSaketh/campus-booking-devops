import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const navItems = [
  { path: '/faculty', icon: '🏠', label: 'Dashboard' },
  { path: '/faculty/search', icon: '🔍', label: 'Search & Book' },
  { path: '/faculty/bookings', icon: '📋', label: 'My Bookings' },
  { path: '/faculty/blocks', icon: '🚫', label: 'Block Slots' },
  { path: '/faculty/recurring', icon: '🔁', label: 'Recurring Requests' },
]

// ─── FACULTY HOME ───
export function FacultyHome() {
  const [bookings, setBookings] = useState([])
  const [blocks, setBlocks] = useState([])

  useEffect(() => {
    api.get('/bookings/my').then((r) => setBookings(r.data))
    api.get('/blocks').then((r) => setBlocks(r.data))
  }, [])

  const confirmed = bookings.filter((b) => b.status === 'confirmed').length
  const upcoming = bookings.filter((b) => b.status === 'confirmed' && new Date(b.start_time) > new Date()).length

  return (
    <Layout navItems={navItems}>
      <div className="page-header">
        <h1>Faculty Dashboard</h1>
        <p>Manage bookings, block slots for classes, and submit recurring requests.</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Confirmed</div>
          <div className="stat-value" style={{ color: '#2e7d32' }}>{confirmed}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Upcoming</div>
          <div className="stat-value" style={{ color: '#1a237e' }}>{upcoming}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Blocks</div>
          <div className="stat-value" style={{ color: '#c62828' }}>{blocks.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h2 className="card-title">Upcoming Bookings</h2></div>
        {upcoming === 0 ? (
          <div className="empty-state"><div className="icon">📅</div><p>No upcoming bookings.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Asset</th><th>Date</th><th>Time</th><th>Type</th><th>Status</th></tr></thead>
              <tbody>
                {bookings.filter((b) => b.status === 'confirmed' && new Date(b.start_time) > new Date()).map((b) => (
                  <tr key={b.id}>
                    <td><strong>{b.asset_name}</strong><br /><small style={{ color: '#6b7280' }}>{b.location}</small></td>
                    <td>{new Date(b.start_time).toLocaleDateString()}</td>
                    <td>{new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td><span className={`badge badge-${b.asset_type}`}>{b.asset_type}</span></td>
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

// ─── FACULTY SEARCH & BOOK ───
export function FacultySearch() {
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
    setLoading(true); setSearched(true)
    try {
      const params = {}
      if (date) params.date = date
      if (startTime) params.start_time = startTime
      if (endTime) params.end_time = endTime
      if (type) params.type = type
      const res = await api.get('/assets', { params })
      setAssets(res.data)
    } catch { toast.error('Search failed') }
    setLoading(false)
  }

  const handleBook = async () => {
    if (!date || !startTime || !endTime) { toast.error('Select date and time first'); return }
    setSubmitting(true)
    try {
      await api.post('/bookings', { asset_id: booking.id, start_time: `${date} ${startTime}`, end_time: `${date} ${endTime}`, notes })
      toast.success('Booking confirmed! (Faculty priority applied)')
      setBooking(null); search()
    } catch (err) { toast.error(err.response?.data?.message || 'Booking failed') }
    setSubmitting(false)
  }

  return (
    <Layout navItems={navItems}>
      <div className="page-header">
        <h1>Search & Book Assets</h1>
        <p>As faculty, your booking takes priority over student bookings.</p>
      </div>
      <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '14px', color: '#1b5e20' }}>
        ⭐ <strong>Faculty Priority:</strong> If a student has already booked your selected slot, their booking will be automatically cancelled and you will get the slot.
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
          <label className="form-label">Type</label>
          <select className="form-control" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All Types</option>
            <option value="classroom">Classroom</option>
            <option value="lab">Lab</option>
            <option value="sports">Sports</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn btn-primary" onClick={search} disabled={loading}>{loading ? '...' : '🔍 Search'}</button>
        </div>
      </div>

      {!searched ? (
        <div className="empty-state"><div className="icon">🏫</div><p>Use filters to search assets.</p></div>
      ) : assets.length === 0 ? (
        <div className="empty-state"><div className="icon">😔</div><p>No assets available for selected filters.</p></div>
      ) : (
        <div className="asset-grid">
          {assets.map((a) => (
            <div key={a.id} className="asset-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3>{a.name}</h3><span className={`badge badge-${a.type}`}>{a.type}</span>
              </div>
              <div className="meta"><span>📍 {a.location}</span><span>👥 {a.capacity}</span></div>
              <button className="btn btn-success btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setBooking(a)}>Book (Priority)</button>
            </div>
          ))}
        </div>
      )}

      {booking && (
        <div className="modal-overlay" onClick={() => setBooking(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Faculty Booking</h2>
            <div style={{ background: '#f4f6fb', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
              <strong>{booking.name}</strong>
              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{booking.location} · Capacity: {booking.capacity}</div>
              <div style={{ fontSize: '13px', marginTop: '6px' }}>📅 {date} &nbsp; ⏰ {startTime} – {endTime}</div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea className="form-control" rows="3" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Lecture for CS101..." />
            </div>
            <div className="flex-gap">
              <button className="btn btn-success" onClick={handleBook} disabled={submitting}>{submitting ? 'Booking...' : 'Confirm Booking'}</button>
              <button className="btn btn-outline" onClick={() => setBooking(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

// ─── FACULTY BOOKINGS ───
export function FacultyBookings() {
  const [bookings, setBookings] = useState([])
  const fetch = async () => { const r = await api.get('/bookings/my'); setBookings(r.data) }
  useEffect(() => { fetch() }, [])

  const cancel = async (id) => {
    if (!confirm('Cancel booking?')) return
    try { await api.put(`/bookings/${id}/cancel`); toast.success('Cancelled'); fetch() }
    catch (err) { toast.error(err.response?.data?.message || 'Cannot cancel') }
  }

  return (
    <Layout navItems={navItems}>
      <div className="page-header"><h1>My Bookings</h1><p>All your current and past bookings.</p></div>
      <div className="card">
        {bookings.length === 0 ? (
          <div className="empty-state"><div className="icon">📭</div><p>No bookings found.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Asset</th><th>Type</th><th>Date</th><th>Time</th><th>Booking Type</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td><strong>{b.asset_name}</strong><br /><small style={{ color: '#6b7280' }}>{b.location}</small></td>
                    <td><span className={`badge badge-${b.asset_type}`}>{b.asset_type}</span></td>
                    <td>{new Date(b.start_time).toLocaleDateString()}</td>
                    <td>{new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td><span className="badge" style={{ background: '#e3f2fd', color: '#1565c0' }}>{b.booking_type}</span></td>
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

// ─── BLOCK SLOTS ───
export function FacultyBlocks() {
  const [blocks, setBlocks] = useState([])
  const [assets, setAssets] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ asset_id: '', date: '', start_time: '', end_time: '', reason: '' })
  const [submitting, setSubmitting] = useState(false)

  const fetchAll = async () => {
    const [bl, as] = await Promise.all([api.get('/blocks'), api.get('/assets')])
    setBlocks(bl.data); setAssets(as.data)
  }
  useEffect(() => { fetchAll() }, [])

  const submit = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      await api.post('/blocks', { asset_id: form.asset_id, start_time: `${form.date} ${form.start_time}`, end_time: `${form.date} ${form.end_time}`, reason: form.reason })
      toast.success('Slot blocked successfully')
      setShowForm(false); setForm({ asset_id: '', date: '', start_time: '', end_time: '', reason: '' }); fetchAll()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    setSubmitting(false)
  }

  const removeBlock = async (id) => {
    if (!confirm('Remove this block?')) return
    await api.delete(`/blocks/${id}`); toast.success('Block removed'); fetchAll()
  }

  return (
    <Layout navItems={navItems}>
      <div className="page-header">
        <h1>Block Slots</h1>
        <p>Block asset slots for lectures, exams, or academic sessions. Students will not see these slots.</p>
      </div>
      <div style={{ marginBottom: '16px' }}>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>🚫 Block a Slot</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Block Asset Slot</h2>
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Asset</label>
                <select className="form-control" value={form.asset_id} onChange={(e) => setForm({ ...form, asset_id: e.target.value })} required>
                  <option value="">Select asset...</option>
                  {assets.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-control" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input type="time" className="form-control" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input type="time" className="form-control" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea className="form-control" rows="3" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Mid-semester exam for CS301" required />
              </div>
              <div className="flex-gap">
                <button className="btn btn-danger" type="submit" disabled={submitting}>{submitting ? 'Blocking...' : 'Block Slot'}</button>
                <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><h2 className="card-title">Active Blocks</h2></div>
        {blocks.length === 0 ? (
          <div className="empty-state"><div className="icon">✅</div><p>No slots blocked.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Asset</th><th>Date</th><th>Time</th><th>Reason</th><th>Action</th></tr></thead>
              <tbody>
                {blocks.map((b) => (
                  <tr key={b.id}>
                    <td><strong>{b.asset_name}</strong></td>
                    <td>{new Date(b.start_time).toLocaleDateString()}</td>
                    <td>{new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{b.reason}</td>
                    <td><button className="btn btn-outline btn-sm" onClick={() => removeBlock(b.id)}>Remove</button></td>
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
export function FacultyRecurring() {
  const [requests, setRequests] = useState([])
  const [assets, setAssets] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ asset_id: '', pattern: 'weekly', start_date: '', end_date: '', start_time: '', end_time: '' })
  const [submitting, setSubmitting] = useState(false)

  const fetchAll = async () => {
    const [rr, as] = await Promise.all([api.get('/recurring/my'), api.get('/assets')])
    setRequests(rr.data); setAssets(as.data)
  }
  useEffect(() => { fetchAll() }, [])

  const submit = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      await api.post('/recurring', form)
      toast.success('Recurring request submitted for admin approval')
      setShowForm(false); fetchAll()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    setSubmitting(false)
  }

  const statusColor = { pending: '#f57c00', approved: '#2e7d32', rejected: '#c62828' }

  return (
    <Layout navItems={navItems}>
      <div className="page-header">
        <h1>Recurring Booking Requests</h1>
        <p>Request long-term or semester-wide bookings. Admin approval required.</p>
      </div>
      <div style={{ marginBottom: '16px' }}>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>🔁 New Recurring Request</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Recurring Booking Request</h2>
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Asset</label>
                <select className="form-control" value={form.asset_id} onChange={(e) => setForm({ ...form, asset_id: e.target.value })} required>
                  <option value="">Select asset...</option>
                  {assets.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Pattern</label>
                <select className="form-control" value={form.pattern} onChange={(e) => setForm({ ...form, pattern: e.target.value })}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-control" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-control" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Session Start</label>
                  <input type="time" className="form-control" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Session End</label>
                  <input type="time" className="form-control" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required />
                </div>
              </div>
              <div className="flex-gap">
                <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Request'}</button>
                <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><h2 className="card-title">My Recurring Requests</h2></div>
        {requests.length === 0 ? (
          <div className="empty-state"><div className="icon">🔁</div><p>No recurring requests submitted yet.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Asset</th><th>Pattern</th><th>Duration</th><th>Time</th><th>Status</th><th>Notes</th></tr></thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.asset_name}</strong></td>
                    <td><span className="badge" style={{ background: '#e3f2fd', color: '#1565c0' }}>{r.pattern}</span></td>
                    <td>{r.start_date} to {r.end_date}</td>
                    <td>{r.start_time} – {r.end_time}</td>
                    <td><span className="badge" style={{ background: '#f5f5f5', color: statusColor[r.status] }}>{r.status}</span></td>
                    <td>{r.admin_notes || '—'}</td>
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
