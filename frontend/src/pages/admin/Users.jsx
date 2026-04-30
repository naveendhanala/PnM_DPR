import { useState, useEffect } from 'react'
import { getProjects, getUsers, createUser, updateUser, deleteUser } from '../../lib/api'
import { Plus, Edit2, Trash2, X } from 'lucide-react'

const blank = { name: '', username: '', password: '', role: 'operator', project_codes: [] }

export default function Users() {
  const [projects, setProjects] = useState([])
  const [users, setUsers]       = useState([])
  const [modal, setModal]       = useState(null)
  const [form, setForm]         = useState(blank)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const load = () => getUsers().then(r => setUsers(r.data.data))

  useEffect(() => {
    getProjects().then(r => setProjects(r.data.data))
    load()
  }, [])

  const openAdd  = () => { setForm(blank); setError(''); setModal('add') }
  const openEdit = (u) => {
    setForm({ name: u.name, username: u.username, password: '', role: u.role, project_codes: u.project_codes || [] })
    setError(''); setModal({ edit: u })
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const toggleProject = (code) =>
    setForm(f => ({
      ...f,
      project_codes: f.project_codes.includes(code)
        ? f.project_codes.filter(c => c !== code)
        : [...f.project_codes, code]
    }))

  const save = async () => {
    setSaving(true); setError('')
    try {
      const payload = { ...form }
      if (modal !== 'add' && !payload.password) delete payload.password
      modal === 'add' ? await createUser(payload) : await updateUser(modal.edit.id, payload)
      setModal(null); load()
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed')
    } finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Deactivate this user?')) return
    await deleteUser(id); load()
  }

  const inp = 'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full'
  const lbl = 'block text-xs font-medium text-gray-500 mb-1'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Users</h1>
        <button onClick={openAdd} className="flex items-center gap-2 px-3 py-2 bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-800 transition-colors">
          <Plus size={15} />Add User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['Name','Username','Role','Projects','Status',''].map(h => (
                <th key={h} className="px-4 py-2.5 text-left font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No users found</td></tr>
            )}
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-gray-500">{u.username}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 max-w-40 truncate">
                  {u.role === 'admin' ? 'All' : (u.project_codes?.join(', ') || '—')}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${u.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(u)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 size={13} /></button>
                    <button onClick={() => del(u.id)}   className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="font-semibold text-gray-900">{modal === 'add' ? 'Add User' : 'Edit User'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 p-1"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={lbl}>Full Name *</label>
                <input type="text" value={form.name} onChange={set('name')} className={inp} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Username *</label>
                  <input type="text" value={form.username} onChange={set('username')} className={inp} disabled={modal !== 'add'} autoCapitalize="none" required />
                </div>
                <div>
                  <label className={lbl}>{modal === 'add' ? 'Password *' : 'New Password'}</label>
                  <input type="password" value={form.password} onChange={set('password')} className={inp} placeholder={modal !== 'add' ? 'Leave blank to keep' : ''} required={modal === 'add'} />
                </div>
              </div>
              <div>
                <label className={lbl}>Role</label>
                <select value={form.role} onChange={set('role')} className={inp}>
                  <option value="operator">Operator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {form.role === 'operator' && (
                <div>
                  <label className={lbl}>Project Access</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {projects.map(p => (
                      <button
                        key={p.id} type="button" onClick={() => toggleProject(p.code)}
                        className={`px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                          form.project_codes.includes(p.code)
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {p.code}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button onClick={save} disabled={saving} className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setModal(null)} className="px-5 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg text-sm transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
