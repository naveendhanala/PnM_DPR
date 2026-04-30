import { useState, useEffect } from 'react'
import { getProjects, getMachines, createEntry } from '../lib/api'
import { today } from '../lib/utils'
import { CheckCircle, AlertCircle, Search } from 'lucide-react'

const emptyForm = { r1_open: '', r1_close: '', r2_open: '', r2_close: '', hsd: '', breakdown: '', qty: '', work_done: '', remarks: '' }

export default function Entry() {
  const [projects, setProjects]       = useState([])
  const [machines, setMachines]       = useState([])
  const [search, setSearch]           = useState('')
  const [project, setProject]         = useState('')
  const [date, setDate]               = useState(today())
  const [machine, setMachine]         = useState(null)
  const [form, setForm]               = useState(emptyForm)
  const [loading, setLoading]         = useState(false)
  const [toast, setToast]             = useState(null)

  useEffect(() => {
    getProjects().then(r => {
      setProjects(r.data.data)
      if (r.data.data.length === 1) setProject(r.data.data[0].code)
    })
  }, [])

  useEffect(() => {
    if (!project) { setMachines([]); return }
    getMachines({ project_code: project }).then(r => setMachines(r.data.data))
    setMachine(null)
  }, [project])

  const filtered = machines.filter(m =>
    !search || `${m.slno} ${m.eq_type} ${m.reg_no || ''}`.toLowerCase().includes(search.toLowerCase())
  )

  const pick = (m) => { setMachine(m); setForm(emptyForm); setToast(null) }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const r1Total  = form.r1_open !== '' && form.r1_close !== '' ? parseFloat(form.r1_close) - parseFloat(form.r1_open) : null
  const r2Total  = machine?.dual_reading && form.r2_open !== '' && form.r2_close !== '' ? parseFloat(form.r2_close) - parseFloat(form.r2_open) : null
  const workHrs  = (r1Total || 0) + (r2Total || 0)
  const planned  = parseFloat(machine?.planned_hours) || 10
  const utilPct  = planned > 0 ? Math.round((workHrs / planned) * 100) : 0
  const fuelRate = workHrs > 0 && form.hsd ? (parseFloat(form.hsd) / workHrs).toFixed(2) : null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!machine) return
    if (r1Total !== null && r1Total < 0) {
      setToast({ type: 'error', msg: 'Closing reading must be greater than opening reading.' })
      return
    }
    setLoading(true); setToast(null)
    try {
      await createEntry({
        machine_id: machine.id,
        project_id: machine.project_id,
        entry_date: date,
        r1_open:    form.r1_open    || null,
        r1_close:   form.r1_close   || null,
        r2_open:    form.r2_open    || null,
        r2_close:   form.r2_close   || null,
        hsd:        form.hsd        || null,
        breakdown:  form.breakdown  || 0,
        qty:        form.qty        || null,
        work_done:  form.work_done  || null,
        remarks:    form.remarks    || null,
      })
      setToast({ type: 'success', msg: `Entry saved — ${machine.slno} on ${date}` })
      setMachine(null); setSearch('')
    } catch (err) {
      setToast({ type: 'error', msg: err.response?.data?.error || 'Failed to save entry' })
    } finally {
      setLoading(false)
    }
  }

  const inp = 'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full'
  const lbl = 'block text-xs font-medium text-gray-500 mb-1'

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-900">DPR Entry</h1>

      {/* Step 1 */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Step 1 — Project &amp; Date</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Project</label>
            <select value={project} onChange={e => setProject(e.target.value)} className={inp}>
              <option value="">— select project —</option>
              {projects.map(p => <option key={p.id} value={p.code}>{p.code}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inp} />
          </div>
        </div>
      </section>

      {/* Step 2: machine list */}
      {project && (
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Step 2 — Select Machine</p>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search SL#, type, or reg no…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 max-h-60 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-4 py-6 text-sm text-center text-gray-400">No machines found</p>
            )}
            {filtered.map(m => (
              <button
                key={m.id} type="button" onClick={() => pick(m)}
                className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors hover:bg-blue-50 ${machine?.id === m.id ? 'bg-blue-50 ring-1 ring-inset ring-blue-300' : ''}`}
              >
                <div>
                  <span className="text-sm font-semibold text-gray-900">{m.slno}</span>
                  <span className="text-sm text-gray-500 ml-2">· {m.eq_type}</span>
                  {m.capacity && <span className="text-xs text-gray-400 ml-1">({m.capacity})</span>}
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-xs text-gray-500">{m.reg_no || '—'}</p>
                  <p className={`text-xs font-medium ${m.ownership === 'Own' ? 'text-blue-600' : 'text-violet-600'}`}>{m.ownership}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Step 3: readings form */}
      {machine && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Step 3 — Readings</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{machine.slno} · {machine.eq_type}</p>
              <p className="text-xs text-gray-400">{date}</p>
            </div>
            {workHrs > 0 && (
              <div className="text-right bg-blue-50 rounded-xl px-4 py-3">
                <p className="text-2xl font-bold text-blue-700">{workHrs.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Working hrs</p>
                <p className="text-xs font-semibold text-gray-700 mt-0.5">{utilPct}% util</p>
              </div>
            )}
          </div>

          {/* Reading 1 */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Reading 1 · {machine.reading1_basis}</p>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={lbl}>Opening</label><input type="number" step="0.01" value={form.r1_open} onChange={set('r1_open')} className={inp} placeholder="0.00" required /></div>
              <div><label className={lbl}>Closing</label><input type="number" step="0.01" value={form.r1_close} onChange={set('r1_close')} className={inp} placeholder="0.00" required /></div>
              <div>
                <label className={lbl}>Total</label>
                <input readOnly value={r1Total !== null ? `${r1Total.toFixed(2)} ${machine.reading1_basis}` : ''} className={`${inp} bg-gray-50 text-gray-600`} />
              </div>
            </div>
            {r1Total !== null && r1Total < 0 && <p className="text-xs text-red-600 mt-1">Closing must be greater than opening</p>}
          </div>

          {/* Reading 2 */}
          {machine.dual_reading && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Reading 2 · {machine.reading2_basis || 'KM'}</p>
              <div className="grid grid-cols-3 gap-3">
                <div><label className={lbl}>Opening</label><input type="number" step="0.01" value={form.r2_open} onChange={set('r2_open')} className={inp} placeholder="0.00" /></div>
                <div><label className={lbl}>Closing</label><input type="number" step="0.01" value={form.r2_close} onChange={set('r2_close')} className={inp} placeholder="0.00" /></div>
                <div>
                  <label className={lbl}>Total</label>
                  <input readOnly value={r2Total !== null ? r2Total.toFixed(2) : ''} className={`${inp} bg-gray-50 text-gray-600`} />
                </div>
              </div>
            </div>
          )}

          {/* HSD & Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>HSD Consumed (litres)</label>
              <input type="number" step="0.01" min="0" value={form.hsd} onChange={set('hsd')} className={inp} placeholder="0.00" />
              {fuelRate && (
                <p className="text-xs text-gray-500 mt-1">
                  <span className="font-medium">{fuelRate} L/hr</span>
                  {machine.fuel_min && machine.fuel_max &&
                    <span className="text-gray-400"> · norm {machine.fuel_min}–{machine.fuel_max}</span>}
                </p>
              )}
            </div>
            <div>
              <label className={lbl}>Breakdown Hours</label>
              <input type="number" step="0.01" min="0" value={form.breakdown} onChange={set('breakdown')} className={inp} placeholder="0.00" />
            </div>
          </div>

          {/* Work */}
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lbl}>Quantity</label><input type="number" step="0.01" value={form.qty} onChange={set('qty')} className={inp} placeholder="Optional" /></div>
            <div><label className={lbl}>Work Done</label><input type="text" value={form.work_done} onChange={set('work_done')} className={inp} placeholder="Brief description" /></div>
          </div>

          <div><label className={lbl}>Remarks</label><textarea rows={2} value={form.remarks} onChange={set('remarks')} className={inp} placeholder="Optional" /></div>

          {toast && (
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm ${toast.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {toast.msg}
            </div>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
              {loading ? 'Saving…' : 'Save Entry'}
            </button>
            <button type="button" onClick={() => setMachine(null)} className="px-5 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg text-sm transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
