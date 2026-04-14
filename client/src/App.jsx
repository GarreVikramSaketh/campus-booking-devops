import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

import AuthPage from './pages/AuthPage'

import { StudentHome, StudentSearch, StudentBookings } from './pages/student/StudentPages'
import { FacultyHome, FacultySearch, FacultyBookings, FacultyBlocks, FacultyRecurring } from './pages/faculty/FacultyPages'
import { AdminHome, AdminAssets, AdminApprovals, AdminRecurring, AdminReports } from './pages/admin/AdminPages'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: '16px' }}>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />
  return children
}

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  if (user.role === 'faculty') return <Navigate to="/faculty" replace />
  return <Navigate to="/student" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<AuthPage />} />

          {/* Student routes */}
          <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentHome /></ProtectedRoute>} />
          <Route path="/student/search" element={<ProtectedRoute allowedRoles={['student']}><StudentSearch /></ProtectedRoute>} />
          <Route path="/student/bookings" element={<ProtectedRoute allowedRoles={['student']}><StudentBookings /></ProtectedRoute>} />

          {/* Faculty routes */}
          <Route path="/faculty" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyHome /></ProtectedRoute>} />
          <Route path="/faculty/search" element={<ProtectedRoute allowedRoles={['faculty']}><FacultySearch /></ProtectedRoute>} />
          <Route path="/faculty/bookings" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyBookings /></ProtectedRoute>} />
          <Route path="/faculty/blocks" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyBlocks /></ProtectedRoute>} />
          <Route path="/faculty/recurring" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyRecurring /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminHome /></ProtectedRoute>} />
          <Route path="/admin/assets" element={<ProtectedRoute allowedRoles={['admin']}><AdminAssets /></ProtectedRoute>} />
          <Route path="/admin/approvals" element={<ProtectedRoute allowedRoles={['admin']}><AdminApprovals /></ProtectedRoute>} />
          <Route path="/admin/recurring" element={<ProtectedRoute allowedRoles={['admin']}><AdminRecurring /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminReports /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
