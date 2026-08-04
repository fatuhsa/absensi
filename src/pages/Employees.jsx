import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { api } from '../api.js'
import Layout from '../components/Layout.jsx'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import Input from '../components/Input.jsx'
import Modal from '../components/Modal.jsx'
import Alert from '../components/Alert.jsx'
import Spinner from '../components/Spinner.jsx'
import Empty from '../components/Empty.jsx'

const emptyForm = { name: '', email: '', position: '', username: '', password: '' }

export default function Employees() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = () => {
    api('/employees')
      .then((d) => setRows(Array.isArray(d) ? d : d.rows || []))
      .catch((e) => setError(e.message))
  }

  useEffect(load, [])

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (emp) => {
    setEditing(emp)
    setForm({
      name: emp.name,
      email: emp.email,
      position: emp.position || '',
      username: emp.username || '',
      password: '',
    })
    setFormError('')
    setModalOpen(true)
  }

  const save = async (e) => {
    e.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      if (editing) {
        await api(`/employees/${editing.id}`, {
          method: 'PUT',
          body: {
            name: form.name,
            email: form.email,
            position: form.position,
            username: form.username,
            password: form.password || undefined,
          },
        })
      } else {
        await api('/employees', {
          method: 'POST',
          body: { ...form, password: form.password || undefined },
        })
      }
      setModalOpen(false)
      load()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (emp) => {
    if (!confirm(`Hapus karyawan ${emp.name}?`)) return
    try {
      await api(`/employees/${emp.id}`, { method: 'DELETE' })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Layout>
      <div className="page">
        <div className="page-head">
          <div>
            <h2 className="page-title">Karyawan</h2>
            <p className="page-sub">Kelola data karyawan dan akun login.</p>
          </div>
          <Button onClick={openAdd}>+ Tambah</Button>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        {!rows ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <Empty text="Belum ada karyawan." />
        ) : (
          <Card>
            <div className="emp-list">
              {rows.map((emp) => (
                <div key={emp.id} className="emp-item">
                  <div className="emp-avatar">{emp.name?.[0]?.toUpperCase()}</div>
                  <div className="emp-main">
                    <strong>{emp.name}</strong>
                    <span className="muted">
                      {emp.position || '—'} · {emp.email}
                    </span>
                    <span className="muted">
                      @{emp.username || 'tanpa akun'}
                    </span>
                  </div>
                  <div className="emp-actions">
                    <button className="icon-btn" onClick={() => openEdit(emp)} aria-label={`Edit ${emp.name}`}>
                      <Pencil size={18} />
                    </button>
                    <button className="icon-btn danger" onClick={() => remove(emp)} aria-label={`Hapus ${emp.name}`}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editing ? 'Edit Karyawan' : 'Tambah Karyawan'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={save} className="form-stack">
          {formError && <Alert type="error">{formError}</Alert>}
          <Input
            label="Nama"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label="Jabatan"
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            placeholder="mis. Staff"
          />
          <Input
            label="Username Login"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            hint={editing ? 'Kosongkan jika tidak diubah' : 'untuk akun login karyawan'}
            required={!editing}
          />
          <Input
            label={editing ? 'Password Baru' : 'Password'}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            hint={editing ? 'Kosongkan jika tidak diubah' : 'min. 6 karakter'}
            required={!editing}
          />
          <Button type="submit" full loading={saving}>
            {editing ? 'Simpan Perubahan' : 'Tambah Karyawan'}
          </Button>
        </form>
      </Modal>
    </Layout>
  )
}
