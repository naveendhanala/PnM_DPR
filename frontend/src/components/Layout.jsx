import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, ClipboardList, BarChart2, FileText,
  Settings, LogOut, Menu, X, ChevronDown, ChevronRight
} from 'lucide-react'

const NAV = [
  { label: 'Entry',       href: '/entry',       icon: ClipboardList },
  { label: 'Dashboard',   href: '/dashboard',   icon: LayoutDashboard },
  { label: 'Utilization', href: '/utilization', icon: BarChart2 },
  { label: 'Summary',     href: '/summary',     icon: FileText },
]

const ADMIN_NAV = [
  { label: 'Machines',        href: '/admin/machines' },
  { label: 'Entries',         href: '/admin/entries' },
  { label: 'Users',           href: '/admin/users' },
  { label: 'Equipment Types', href: '/admin/equipment-types' },
]

export default function Layout({ children }) {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const linkCls = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-700/50'
    }`

  const subLinkCls = ({ isActive }) =>
    `block px-3 py-1.5 rounded text-sm transition-colors ${
      isActive ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-700/50'
    }`

  const sidebar = (
    <div className="flex flex-col h-full bg-blue-900">
      <div className="px-4 py-5 border-b border-blue-700/50">
        <p className="text-white font-bold text-base">RVR Machinery</p>
        <p className="text-blue-300 text-xs mt-0.5">DPR & Utilization System</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.map(({ label, href, icon: Icon }) => (
          <NavLink key={href} to={href} className={linkCls} onClick={() => setMobileOpen(false)}>
            <Icon size={17} />{label}
          </NavLink>
        ))}

        {isAdmin && (
          <div className="pt-2">
            <button
              onClick={() => setAdminOpen(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-blue-100 hover:bg-blue-700/50 transition-colors"
            >
              <span className="flex items-center gap-3"><Settings size={17} />Admin</span>
              {adminOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
            {adminOpen && (
              <div className="ml-7 mt-1 space-y-0.5">
                {ADMIN_NAV.map(({ label, href }) => (
                  <NavLink key={href} to={href} className={subLinkCls} onClick={() => setMobileOpen(false)}>
                    {label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-blue-700/50">
        <div className="px-3 mb-1">
          <p className="text-white text-sm font-medium">{user?.name}</p>
          <p className="text-blue-300 text-xs capitalize">{user?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-blue-100 hover:bg-blue-700/50 transition-colors"
        >
          <LogOut size={17} />Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-shrink-0 flex-col">{sidebar}</aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-56 flex-shrink-0">{sidebar}</div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 bg-blue-900 flex-shrink-0">
          <p className="text-white font-bold text-sm">RVR DPR</p>
          <button onClick={() => setMobileOpen(v => !v)} className="text-white p-1">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
