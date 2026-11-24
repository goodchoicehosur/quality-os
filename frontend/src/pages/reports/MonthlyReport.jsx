import React, { useEffect, useState } from 'react';
import { TbReport } from 'react-icons/tb';
import dashboardApi from '../../api/dashboard.api';
import inspectionsApi from '../../api/inspections.api';
import Loader from '../../components/common/Loader';

export default function MonthlyReport() {
  const [trend, setTrend] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const to = now.toISOString().slice(0, 10);
    Promise.all([
      dashboardApi.qualityTrend(31),
      inspectionsApi.list({ from, to, limit: 500 }),
    ]).then(([t, e]) => {
      setTrend(t.data);
      setEntries(e.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Loader full label="Building monthly report…" />;

  const byLine = {};
  entries.forEach((e) => {
    const key = e.productionLine?.name || 'Unknown';
    if (!byLine[key]) byLine[key] = { count: 0, ncSum: 0, qualitySum: 0, qualityCount: 0 };
    const ok = e.results?.filter((r) => r.shiftResults.find((s) => s.shiftCode === e.shift)?.value === 'OK').length || 0;
    const nok = e.results?.filter((r) => r.shiftResults.find((s) => s.shiftCode === e.shift)?.value === 'NOK').length || 0;
    const scored = ok + nok;
    byLine[key].count += 1;
    byLine[key].ncSum += nok;
    if (scored) { byLine[key].qualitySum += (ok / scored) * 100; byLine[key].qualityCount += 1; }
  });

  const validPoints = trend.filter((t) => t.qualityPercent !== null);
  const monthAvg = validPoints.length ? Math.round((validPoints.reduce((s, t) => s + t.qualityPercent, 0) / validPoints.length) * 10) / 10 : 0;

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-light text-acc flex items-center justify-center shrink-0"><TbReport size={20} /></div>
        <div>
          <h1 className="text-lg font-semibold text-ink dark:text-slate-100">Monthly Report</h1>
          <p className="text-xs text-muted mt-0.5">
            {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} — quality performance summary.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3.5 mb-5">
        <div className="card"><p className="field-label mb-1.5">Reports This Month</p><p className="text-2xl font-semibold text-ink dark:text-slate-100">{entries.length}</p></div>
        <div className="card"><p className="field-label mb-1.5">Month-to-date Quality</p><p className="text-2xl font-semibold text-ok">{monthAvg}%</p></div>
        <div className="card"><p className="field-label mb-1.5">Total NCs Raised</p><p className="text-2xl font-semibold text-danger">{Object.values(byLine).reduce((s, l) => s + l.ncSum, 0)}</p></div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-3.5 border-b border-border dark:border-slate-700"><span className="card-title">Performance by Production Line</span></div>
        <table className="master-table">
          <thead><tr><th>Line</th><th>Reports</th><th>Avg. Quality %</th><th>Total NCs</th></tr></thead>
          <tbody>
            {Object.entries(byLine).map(([line, s]) => (
              <tr key={line}>
                <td className="font-medium text-ink dark:text-slate-100">{line}</td>
                <td>{s.count}</td>
                <td className="font-medium" style={{ color: (s.qualitySum / (s.qualityCount || 1)) >= 90 ? '#16A34A' : '#F59E0B' }}>
                  {s.qualityCount ? Math.round((s.qualitySum / s.qualityCount) * 10) / 10 : 0}%
                </td>
                <td>{s.ncSum}</td>
              </tr>
            ))}
            {Object.keys(byLine).length === 0 && <tr><td colSpan={4} className="text-center text-muted py-6">No reports logged yet this month.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
