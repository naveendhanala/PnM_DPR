import { useState, useEffect } from 'react'
import { getProjects, getEntries } from '../lib/api'
import { today, formatNum, utilColorClass, exportCSV } from '../lib/utils'
import { Download, SlidersHorizontal } from 'lucide-react'

export default function Dashboard() {
  const [projects, setProjects] = useState([])
  const [entries, setEntries]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [filters, setFilters]   = useState({ project_code: '', from: today(), to: today(), ownership: '' })

  useEffect(() => { getProjects().then(r => setProjects(r.data.data)) }, [])

  useEffect(() => {
    setLoading(true)
    const p = {}
    if (filters.project_code) p.project_code = filters.project_code
    if (filters.from)         p.from          = filters.from
    if (filters.to)           p.to            = filters.to
    if (filters.ownership)    p.ownership     = filters.ownership
    getEntries(p).then(r => setEntries(r.data.data)).finally(() => setLoading(false))
  }, [filters])

  const setF = (k) => (e) => setFilters(f => ({ ...f, [k]: e.target.value }))

  const handleExport = () => {
    exportCSV(
      ['Date','Project','SL#','Type','Capacity','Reg#','Own/Hire','R1 Open','R1 Close','Work Hrs','Util%','HSD','Fuel Avg (L/hr)','Breakdown','Work Done','Submitted By'],
      entries.map(e => [
        e.entry_date, e.project_code, e.slno, e.eq_type, e.capacity ?? '', e.reg_no ?? '',
        e.ownership, e.r1_open ?? '', e.r1_close ?? '', e.working_hours ?? '',
        e.util_pct ?? '', e.hsd ?? '', e.fuel_avg ?? '', e.breakdown ?? '',
        e.work_done ?? '', e.submitted_by_name ?? ''
      ]),
      `DPR_Dashboard_${filters.from}_${filters.to}.csv`
    )
  }

  const sel = 'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-800 transition-colors">
          <Download size={15} />Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          <SlidersHorizontal size={12} />Filters
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select value={filters.project_code} onChange={setF('project_code')} className={sel}>
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.code}>{p.code}</option>)}
          </select>
          <select value={filters.ownership} onChange={setF('ownership')} className={sel}>
            <option value="">All Ownership</option>
            <option value="Own">Own</option>
            <option value="Hire">Hire</option>
          </select>
          <input type="date" value={filters.from} onChange={setF('from')} className={sel} />
          <input type="date" value={filters.to}   onChange={setF('to')}   className={sel} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs text-gray-400">{loading ? 'Loading…' : `${entries.length} entries`}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Date','Project','SL#','Type','Cap','Reg#','Own','R1 Open','R1 Close','Work Hrs','Util%','HSD','Fuel Avg','Breakdown','Work Done'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!loading && entries.length === 0 && (
                <tr><td colSpan={15} className="px-4 py-10 text-center text-gray-400">No entries found for the selected filters</td></tr>
              )}
              {entries.map(e => (
                <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 whitespace-nowrap font-medium">{e.entry_date}</td>
                  <td className="px-3 py-2">
                    <span className="bg-blue-50 text-blue-700 font-semibold px-1.5 py-0.5 rounded text-xs">{e.project_code}</span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-medium">{e.slno}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{e.eq_type}</td>
                  <td className="px-3 py-2">{e.capacity || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{e.reg_no || '—'}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs font-medium ${e.ownership === 'Own' ? 'text-blue-600' : 'text-violet-600'}`}>{e.ownership}</span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatNum(e.r1_open)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatNum(e.r1_close)}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatNum(e.working_hours)}</td>
                  <td className="px-3 py-2">
                    {e.util_pct != null && (
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${utilColorClass(e.util_pct)}`}>
                        {formatNum(e.util_pct, 0)}%
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatNum(e.hsd)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatNum(e.fuel_avg)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatNum(e.breakdown)}</td>
                  <td className="px-3 py-2 max-w-32 truncate text-gray-600">{e.work_done || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
