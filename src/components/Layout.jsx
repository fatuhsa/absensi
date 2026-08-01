import { NavLink, useNavigate } from 'react-router-dom'
import { getUser, clearSession } from '../api.js'
import { useState } from 'react'
import { LayoutDashboard, Users, FileText, Settings, Home, MapPin, Clock } from 'lucide-react'

function NavItem({ to, icon: Icon, label, end = false }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      <span className="nav-icon"><Icon size={20} /></span>
      <span className="nav-label">{label}</span>
    </NavLink>
  )
}

export default function Layout({ children }) {
  const user = getUser()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const isAdmin = user?.role === 'admin'

  const logout = () => {
    clearSession()
    navigate('/login')
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <h1 className="brand">Absensi</h1>
          <button className="avatar-btn" onClick={() => setMenuOpen((v) => !v)}>
            {user?.username?.[0]?.toUpperCase() || '?'}
          </button>
        </div>
        {menuOpen && (
          <div className="menu">
            <div className="menu-user">
              <strong>{user?.username}</strong>
              <span>{isAdmin ? 'Administrator' : 'Karyawan'}</span>
            </div>
            <button className="menu-item" onClick={logout}>
              Keluar
            </button>
          </div>
        )}
      </header>

      <main className="content">{children}</main>

      <nav className="bottomnav">
        {isAdmin ? (
          <>
            <NavItem to="/" end icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/employees" icon={Users} label="Karyawan" />
            <NavItem to="/report" icon={FileText} label="Laporan" />
            <NavItem to="/settings" icon={Settings} label="Lokasi" />
          </>
        ) : (
          <>
            <NavItem to="/" end icon={Home} label="Beranda" />
            <NavItem to="/attendance" icon={MapPin} label="Absensi" />
            <NavItem to="/history" icon={Clock} label="Riwayat" />
          </>
        )}
      </nav>
    </div>
  )
}
