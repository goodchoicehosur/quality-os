import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TbClipboardCheck, TbPlus, TbEye, TbEdit, TbFilter } from 'react-icons/tb';
import inspectionsApi from '../api/inspections.api';
import linesApi from '../api/lines.api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import StatusChip from '../components/common/StatusChip';

const STATUS_OPTIONS = ['', 'Draft', 'InProgress', 'SubmittedForReview', 'Completed', 'Locked'];

export default function InspectionList() {
  const navigate = useNavigate();
  const toast = useToast();
  const { hasRole } = useAuth();
  const canStartInspection = hasRole('Admin', 'QualityManager', 'Supervisor', 'Auditor');
  const [entries, setEntries] = useState([]);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [line, setLine] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (line) params.productionLine = line;
      const res = await inspectionsApi.list(params);
      setEntries(res.data);
    } catch (err) {
      toast.error('Could not load inspection reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status, line]);
  useEffect(() => { linesApi.list().then((r) => setLines(r.data)); }, []);

  const summaryFor = (e) => {
    const ok = e.results?.filter((r) => r.shiftResults.find((s) => s.shiftCode === e.shift)?.value === 'OK').length || 0;
    const nok = e.results?.filter((r) => r.shiftResults.find((s) => s.shiftCode === e.shift)?.value === 'NOK').length || 0;
    const scored = ok + nok;
    return { pct: scored ? Math.round((ok / scored) * 1000) / 10 : null, nok };
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-light text-acc flex items-center justify-center shrink-0"><TbClipboardCheck size={20} /></div>
          <div>
            <h1 className="text-lg font-semibold text-ink dark:text-slate-100">Daily Inspection</h1>
            <p className="text-xs text-muted mt-0.5">All In-Process Inspection Reports (IPIR), across every line and shift.</p>
          </div>
        </div>
        {canStartInspection && (
          <button className="btn-primary" onClick={() => navigate('/inspections/new')}><TbPlus size={15} /> New Inspection</button>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-3 border-b border-border dark:border-slate-700 flex items-center gap-2 flex-wrap">
          <TbFilter className="text-muted" size={15} />
          <select className="select w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="select w-auto" value={line} onChange={(e) => setLine(e.target.value)}>
            <option value="">All Lines</option>
            {lines.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
          </select>
          <span className="text-xs text-muted ml-auto">{entries.length} report{entries.length === 1 ? '' : 's'}</span>
        </div>

        <div className="overflow-x-auto scroll-thin">
          {loading ? (
            <div className="py-14"><Loader label="Loading reports…" /></div>
          ) : entries.length === 0 ? (
            <div className="py-14 text-center text-muted text-sm">No inspection reports match these filters.</div>
          ) : (
            <table className="master-table">
              <thead>
                <tr>
                  <th>Report ID</th><th>Line</th><th>Model</th><th>Date</th><th>Shift</th>
                  <th>Auditor</th><th>Quality %</th><th>NCs</th><th>Status</th><th className="text-right pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const { pct, nok } = summaryFor(e);
                  return (
                    <tr key={e._id}>
                      <td className="text-acc font-medium">{e.reportId}</td>
                      <td>{e.productionLine?.name}</td>
                      <td>{e.model?.name}</td>
                      <td>{new Date(e.date).toLocaleDateString('en-IN')}</td>
                      <td>{e.shift}</td>
                      <td>{e.Auditor?.name || '—'}</td>
                      <td className={pct === null ? 'text-muted' : pct >= 90 ? 'text-ok font-medium' : pct >= 75 ? 'text-warn font-medium' : 'text-danger font-medium'}>
                        {pct === null ? '—' : `${pct}%`}
                      </td>
                      <td>{nok}</td>
                      <td><StatusChip value={e.status} /></td>
                      <td className="text-right pr-3">
                        <button className="btn-outline btn-sm" onClick={() => navigate(`/inspections/${e._id}`)}>
                          {canStartInspection && !['Completed', 'Locked'].includes(e.status) ? <TbEdit size={13} /> : <TbEye size={13} />}
                        </button>
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
