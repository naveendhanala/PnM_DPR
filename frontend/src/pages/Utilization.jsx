import { useState, useEffect } from 'react'
import { getProjects, getUtilization } from '../lib/api'
import { today, monthStart, formatNum, utilColorClass, utilLabel, exportCSV } from '../lib/utils'
import { Download, SlidersHorizontal } from 'lucide-react'

export default function Utilization() {
  const [projects, setProjects] = useState([])
  const [data, setData]         = useState([])
  const [loading, setLoading]   = useState(false)
  const [filters, setFilters]   = useState({ project_code: '', from: monthStart(), to: today() })

  useEffect(() => { getProjects().then(r => setProjects(r.data.data)) }, [])

  useEffect(() => {
    if (!filters.from || !filters.to) return
    setLoading(true)
    const p = { from: filters.from, to: filters.to }
    if (filters.project_code) p.project_code = filters.project_code
    getUtilization(p).then(r => setData(r.data.data)).finally(() => setLoading(false))
  }, [filters])

  const setF = (k) => (e) => setFilters(f => ({ ...f, [k]: e.target.value }))

  const handleExport = () => {
    exportCSV(
      ['Project','SL#','Type','Capacity','Reg#','Own/Hire','Days Reported','Total Work Hrs','Avg Util%','Status','Total HSD','Fuel Avg (L/hr)','Total Breakdown'],
      data.map(d => [
        d.project_code, d.slno, d.eq_type, d.capacity ?? '', d.reg_no ?? '', d.ownership,
        d.days_reported, d.total_working, d.avg_util_pct, utilLabel(d.avg_util_pct),
        d.total_hsd, d.overall_fuel_avg, d.total_breakdown
      ]),
      `DPR_Utilization_${filters.from}_${filters.to}.csv`
    )
  }

  const sel = 'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-gray-900">Utilization Analysis</h1>
        <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-800 transition-colors">
          <Download size={15} />Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          <SlidersHorizontal size={12} />Filters
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <select value={filters.project_code} onChange={setF('project_code')} className={sel}>
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.code}>{p.code}</option>)}
          </select>
          <input type="date" value={filters.from} onChange={setF('from')} className={sel} />
          <input type="date" value={filters.to}   onChange={setF('to')}   className={sel} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs text-gray-400">
            {loading ? 'Loading…' : `${data.length} machines · ${filters.from} to ${filters.to}`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Project','SL#','Type','Cap','Reg#','Own','Days','Work Hrs','Avg Util%','Status','Total HSD','Fuel Avg','Breakdown'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!loading && data.length === 0 && (
                <tr><td colSpan={13} className="px-4 py-10 text-center text-gray-400">No data for this period</td></tr>
              )}
              {data.map((d, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2">
                    <span className="bg-blue-50 text-blue-700 font-semibold px-1.5 py-0.5 rounded text-xs">{d.project_code}</span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-medium">{d.slno}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{d.eq_type}</td>
                  <td className="px-3 py-2">{d.capacity || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{d.reg_no || '—'}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs font-medium ${d.ownership === 'Own' ? 'text-blue-600' : 'text-violet-600'}`}>{d.ownership}</span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{d.days_reported}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatNum(d.total_working)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatNum(d.avg_util_pct, 1)}</td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${utilColorClass(d.avg_util_pct)}`}>
                      {utilLabel(d.avg_util_pct)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatNum(d.total_hsd)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatNum(d.overall_fuel_avg)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatNum(d.total_breakdown)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
