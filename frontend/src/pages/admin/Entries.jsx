import { useState, useEffect } from 'react'
import { getProjects, getEntries, updateEntry, deleteEntry } from '../../lib/api'
import { today, daysAgo, formatNum } from '../../lib/utils'
import { Edit2, Trash2, X, Save } from 'lucide-react'

export default function AdminEntries() {
  const [projects, setProjects] = useState([])
  const [entries, setEntries]   = useState([])
  const [filters, setFilters]   = useState({ project_code: '', from: daysAgo(7), to: today() })
  const [editing, setEditing]   = useState(null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const load = () => {
    const p = { from: filters.from, to: filters.to }
    if (filters.project_code) p.project_code = filters.project_code
    getEntries(p).then(r => setEntries(r.data.data))
  }

  useEffect(() => { getProjects().then(r => setProjects(r.data.data)) }, [])
  useEffect(() => { load() }, [filters])

  const startEdit = (e) => {
    setEditing({
      id: e.id,
      r1_open: e.r1_open ?? '', r1_close: e.r1_close ?? '',
      r2_open: e.r2_open ?? '', r2_close: e.r2_close ?? '',
      hsd: e.hsd ?? '', breakdown: e.breakdown ?? '',
      qty: e.qty ?? '', work_done: e.work_done || '', remarks: e.remarks || ''
    })
    setError('')
  }

  const setE = (k) => (ev) => setEditing(f => ({ ...f, [k]: ev.target.value }))

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      const { id, ...data } = editing
      await updateEntry(id, data)
      setEditing(null); load()
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry permanently?')) return
    await deleteEntry(id); load()
  }

  const setF = (k) => (e) => setFilters(f => ({ ...f, [k]: e.target.value }))
  const sel = 'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
  const inp = 'border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-full'

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Manage Entries</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select value={filters.project_code} onChange={setF('project_code')} className={sel}>
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.code}>{p.code}</option>)}
          </select>
          <div />
          <input type="date" value={filters.from} onChange={setF('from')} className={sel} />
          <input type="date" value={filters.to}   onChange={setF('to')}   className={sel} />
        </div>
      </div>

      {editing && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-blue-800">Editing Entry #{editing.id}</p>
            <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[['r1_open','R1 Open'],['r1_close','R1 Close'],['r2_open','R2 Open'],['r2_close','R2 Close'],
              ['hsd','HSD (L)'],['breakdown','Breakdown Hrs'],['qty','Quantity'],['work_done','Work Done']
            ].map(([k, label]) => (
              <div key={k}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <input
                  type={['work_done'].includes(k) ? 'text' : 'number'}
                  step="0.01"
                  value={editing[k]}
                  onChange={setE(k)}
                  className={inp}
                />
              </div>
            ))}
            <div className="col-span-2 md:col-span-4">
              <label className="block text-xs text-gray-500 mb-1">Remarks</label>
              <input type="text" value={editing.remarks} onChange={setE('remarks')} className={inp} />
            </div>
          </div>
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          <button
            onClick={handleSave} disabled={saving}
            className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors"
          >
            <Save size={14} />{saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs text-gray-400">{entries.length} entries</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Date','Project','SL#','Type','R1 Open','R1 Close','Work Hrs','Util%','HSD','Breakdown','Work Done','Submitted By',''].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.length === 0 && (
                <tr><td colSpan={13} className="px-4 py-10 text-center text-gray-400">No entries found</td></tr>
              )}
              {entries.map(e => (
                <tr key={e.id} className={`hover:bg-gray-50 transition-colors ${editing?.id === e.id ? 'bg-blue-50' : ''}`}>
                  <td className="px-3 py-2 whitespace-nowrap font-medium">{e.entry_date}</td>
                  <td className="px-3 py-2"><span className="bg-blue-50 text-blue-700 font-semibold px-1.5 py-0.5 rounded text-xs">{e.project_code}</span></td>
                  <td className="px-3 py-2 font-medium">{e.slno}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{e.eq_type}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatNum(e.r1_open)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatNum(e.r1_close)}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatNum(e.working_hours)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatNum(e.util_pct, 0)}%</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatNum(e.hsd)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatNum(e.breakdown)}</td>
                  <td className="px-3 py-2 max-w-28 truncate text-gray-600">{e.work_done || '—'}</td>
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{e.submitted_by_name || '—'}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(e)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 size={13} /></button>
                      <button onClick={() => handleDelete(e.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
