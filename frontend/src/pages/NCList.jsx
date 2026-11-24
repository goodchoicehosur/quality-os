import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TbAlertTriangle, TbFilter, TbEye } from 'react-icons/tb';
import ncApi from '../api/nc.api';
import linesApi from '../api/lines.api';
import { useToast } from '../context/ToastContext';
import Loader from '../components/common/Loader';
import StatusChip from '../components/common/StatusChip';

const STATUS_OPTIONS = ['Open', 'UnderCA', 'PendingApproval', 'Closed'];
const SEVERITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

export default function NCList() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState(searchParams.get('severity') || '');
  const [line, setLine] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (severity) params.severity = severity;
      if (line) params.productionLine = line;
      const res = await ncApi.list(params);
      setItems(res.data);
    } catch (err) {
      toast.error('Could not load non-conformities.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status, severity, line]);
  useEffect(() => { linesApi.list().then((r) => setLines(r.data)); }, []);

  return (
    <div className="animate-fadeIn">
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 text-danger flex items-center justify-center shrink-0"><TbAlertTriangle size={20} /></div>
          <div>
            <h1 className="text-lg font-semibold text-ink dark:text-slate-100">Non-Conformities</h1>
            <p className="text-xs text-muted mt-0.5">Every NC raised from the inspection sheet, tracked through root cause, corrective action and closure.</p>
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-3 border-b border-border dark:border-slate-700 flex items-center gap-2 flex-wrap">
          <TbFilter className="text-muted" size={15} />
          <select className="select w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="select w-auto" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="">All Severities</option>
            {SEVERITY_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="select w-auto" value={line} onChange={(e) => setLine(e.target.value)}>
            <option value="">All Lines</option>
            {lines.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
          </select>
          <span className="text-xs text-muted ml-auto">{items.length} record{items.length === 1 ? '' : 's'}</span>
        </div>

        <div className="overflow-x-auto scroll-thin">
          {loading ? (
            <div className="py-14"><Loader label="Loading non-conformities…" /></div>
          ) : items.length === 0 ? (
            <div className="py-14 text-center text-muted text-sm">No non-conformities match these filters.</div>
          ) : (
            <table className="master-table">
              <thead>
                <tr>
                  <th>NC ID</th><th>Line / Model</th><th>Operation</th><th>Parameter</th>
                  <th>Severity</th><th>Detected</th><th>Status</th><th className="text-right pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((n) => (
                  <tr key={n._id} className="cursor-pointer" onClick={() => navigate(`/nc/${n._id}`)}>
                    <td className="text-acc font-medium">{n.ncId}</td>
                    <td>{n.productionLine?.name} / {n.model?.name}</td>
                    <td>{n.operation ? `OP ${n.operation.opNumber} · ${n.operation.processName}` : '—'}</td>
                    <td>{n.parameter?.name} {n.actualValue && <span className="text-danger">({n.actualValue})</span>}</td>
                    <td><StatusChip value={n.severity} /></td>
                    <td>{new Date(n.detectedAt || n.createdAt).toLocaleDateString('en-IN')}</td>
                    <td><StatusChip value={n.status} /></td>
                    <td className="text-right pr-3">
                      <button className="btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/nc/${n._id}`); }}>
                        <TbEye size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
