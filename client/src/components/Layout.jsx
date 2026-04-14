import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function Layout({ children, navItems }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [notifications, setNotifications] = useState([])
  const [showNotif, setShowNotif] = useState(false)

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data)
    } catch {}
  }

  const markRead = async () => {
    await api.put('/notifications/read')
    fetchNotifications()
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('Logged out successfully')
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>SRM Campus Booking</h2>
          <p>Asset Management System</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="name">{user?.name}</div>
            <span className={`role-badge ${user?.role}`}>{user?.role}</span>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{user?.net_id}</div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Sign Out</button>
        </div>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <div />
          <div style={{ position: 'relative' }}>
            <button
              className="notif-bell"
              onClick={() => { setShowNotif(!showNotif); if (!showNotif) markRead() }}
            >
              🔔
              {unreadCount > 0 && <span className="notif-count">{unreadCount}</span>}
            </button>
            {showNotif && (
              <div className="notif-dropdown">
                <h3>Notifications</h3>
                {notifications.length === 0 ? (
                  <div style={{ padding: '16px', color: '#6b7280', fontSize: '13px' }}>No notifications</div>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`}>
                      <div>{n.message}</div>
                      <div className="notif-time">{new Date(n.created_at).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}
