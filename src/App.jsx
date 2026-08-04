import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isLoggedIn, getUser } from './api.js'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Employees from './pages/Employees.jsx'
import Settings from './pages/Settings.jsx'
import Attendance from './pages/Attendance.jsx'
import Report from './pages/Report.jsx'
import History from './pages/History.jsx'

// Redirect to /login if not authenticated.
function RequireAuth({ children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />
  return children
}

// Redirect employees away from admin-only pages.
function RequireAdmin({ children }) {
  if (getUser()?.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />

        <Route
          path="/attendance"
          element={
            <RequireAuth>
              <Attendance />
            </RequireAuth>
          }
        />
        <Route
          path="/history"
          element={
            <RequireAuth>
              <History />
            </RequireAuth>
          }
        />

        <Route
          path="/employees"
          element={
            <RequireAuth>
              <RequireAdmin>
                <Employees />
              </RequireAdmin>
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <RequireAdmin>
                <Settings />
              </RequireAdmin>
            </RequireAuth>
          }
        />
        <Route
          path="/report"
          element={
            <RequireAuth>
              <RequireAdmin>
                <Report />
              </RequireAdmin>
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
