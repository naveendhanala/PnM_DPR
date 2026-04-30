import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Entry from './pages/Entry'
import Dashboard from './pages/Dashboard'
import Utilization from './pages/Utilization'
import Summary from './pages/Summary'
import Machines from './pages/admin/Machines'
import AdminEntries from './pages/admin/Entries'
import Users from './pages/admin/Users'
import EquipmentTypes from './pages/admin/EquipmentTypes'

function ProtectedLayout() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Layout><Outlet /></Layout>
}

function AdminGuard() {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="entry"       element={<Entry />} />
            <Route path="dashboard"   element={<Dashboard />} />
            <Route path="utilization" element={<Utilization />} />
            <Route path="summary"     element={<Summary />} />
            <Route path="admin" element={<AdminGuard />}>
              <Route path="machines"        element={<Machines />} />
              <Route path="entries"         element={<AdminEntries />} />
              <Route path="users"           element={<Users />} />
              <Route path="equipment-types" element={<EquipmentTypes />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
