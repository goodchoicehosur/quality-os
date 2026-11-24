import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TbFileDescription, TbDownload, TbEye } from 'react-icons/tb';
import inspectionsApi from '../../api/inspections.api';
import StatusChip from '../../components/common/StatusChip';
import Loader from '../../components/common/Loader';
import { exportInspectionToExcel } from '../../utils/exportExcel';

export default function DailyReport() {
  const navigate = useNavigate();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    inspectionsApi.list({ from: date, to: date }).then((res) => setEntries(res.data)).finally(() => setLoading(false));
  }, [date]);

  const summaryFor = (e) => {
    const ok = e.results?.filter((r) => r.shiftResults.find((s) => s.shiftCode === e.shift)?.value === 'OK').length || 0;
    const nok = e.results?.filter((r) => r.shiftResults.find((s) => s.shiftCode === e.shift)?.value === 'NOK').length || 0;
    const scored = ok + nok;
    return { pct: scored ? Math.round((ok / scored) * 1000) / 10 : null, nok };
  };

  const avgQuality = (() => {
    const pcts = entries.map(summaryFor).map((s) => s.pct).filter((p) => p !== null);
    return pcts.length ? Math.round((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 10) / 10 : 0;
  })();
  const totalNC = entries.reduce((s, e) => s + summaryFor(e).nok, 0);

  return (
    <div className="animate-fadeIn">
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-light text-acc flex items-center justify-center shrink-0"><TbFileDescription size={20} /></div>
          <div>
            <h1 className="text-lg font-semibold text-ink dark:text-slate-100">Daily Report</h1>
            <p className="text-xs text-muted mt-0.5">All IPIR reports logged for a single day, across every line and shift.</p>
          </div>
        </div>
        <input type="date" className="input w-auto" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="grid grid-cols-3 gap-3.5 mb-5">
        <div className="card"><p className="field-label mb-1.5">Reports Logged</p><p className="text-2xl font-semibold text-ink dark:text-slate-100">{entries.length}</p></div>
        <div className="card"><p className="field-label mb-1.5">Average Quality</p><p className="text-2xl font-semibold text-ok">{avgQuality}%</p></div>
        <div className="card"><p className="field-label mb-1.5">Total NCs</p><p className="text-2xl font-semibold text-danger">{totalNC}</p></div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto scroll-thin">
          {loading ? (
            <div className="py-14"><Loader label="Loading day's reports…" /></div>
          ) : entries.length === 0 ? (
            <div className="py-14 text-center text-muted text-sm">No inspection reports logged on this date.</div>
          ) : (
            <table className="master-table">
              <thead>
                <tr><th>Report ID</th><th>Line</th><th>Model</th><th>Shift</th><th>Auditor</th><th>Quality %</th><th>NCs</th><th>Status</th><th className="text-right pr-3">Actions</th></tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const { pct, nok } = summaryFor(e);
                  return (
                    <tr key={e._id}>
                      <td className="text-acc font-medium">{e.reportId}</td>
                      <td>{e.productionLine?.name}</td>
                      <td>{e.model?.name}</td>
                      <td>{e.shift}</td>
                      <td>{e.Auditor?.name || '—'}</td>
                      <td className={pct >= 90 ? 'text-ok font-medium' : pct >= 75 ? 'text-warn font-medium' : 'text-danger font-medium'}>{pct === null ? '—' : `${pct}%`}</td>
                      <td>{nok}</td>
                      <td><StatusChip value={e.status} /></td>
                      <td className="text-right pr-3 flex gap-1 justify-end">
                        <button className="btn-outline btn-sm" onClick={() => navigate(`/inspections/${e._id}`)}><TbEye size={13} /></button>
                        <button className="btn-outline btn-sm" onClick={() => exportInspectionToExcel(e)}><TbDownload size={13} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
