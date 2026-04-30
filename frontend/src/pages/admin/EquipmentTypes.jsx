import { useState, useEffect } from 'react'
import { getEquipmentTypes, createEquipmentType, deleteEquipmentType } from '../../lib/api'
import { Plus, Trash2 } from 'lucide-react'

export default function EquipmentTypes() {
  const [types, setTypes]   = useState([])
  const [name, setName]     = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const load = () => getEquipmentTypes().then(r => setTypes(r.data.data))
  useEffect(() => { load() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true); setError('')
    try {
      await createEquipmentType({ name: name.trim() })
      setName(''); load()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this equipment type?')) return
    await deleteEquipmentType(id); load()
  }

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Equipment Types</h1>

      <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="New equipment type name…"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit" disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors flex-shrink-0"
          >
            <Plus size={15} />{saving ? 'Adding…' : 'Add'}
          </button>
        </div>
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {types.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-gray-400">No equipment types yet</p>
          )}
          {types.map(t => (
            <div key={t.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors">
              <span className="text-sm text-gray-800">{t.name}</span>
              <button
                onClick={() => handleDelete(t.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
