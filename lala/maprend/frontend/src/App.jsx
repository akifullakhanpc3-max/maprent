import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import useAuthStore from '@/stores/useAuthStore'
import MapView from '@/views/MapView'
import AuthLayout from '@/layouts/AuthLayout'
import OwnerDashboard from '@/views/OwnerDashboard'

function App() {
  const { checkAuth, user } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [])

  const ProtectedRoute = ({ children, roles = [] }) => {
    if (!user) {
      return <Navigate to="/login" replace />
    }
    if (roles.length && !roles.includes(user.role)) {
      return <Navigate to="/" replace />
    }
    return children
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<MapView />} />
        <Route path="/login" element={<AuthLayout />} />
        <Route path="/register" element={<AuthLayout />} />
        <Route path="/owner/dashboard" element={
          <ProtectedRoute roles={['owner']}>
            <OwnerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/user/dashboard" element={
          <ProtectedRoute roles={['user']}>
            <OwnerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute roles={['admin']}>
            <div>Admin Dashboard Coming Soon</div>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App

