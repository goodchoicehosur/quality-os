import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TbBuildingFactory, TbCircleCheck, TbClock, TbAlertCircle, TbDownload, TbPrinter,
  TbAlertTriangle, TbEye, TbEdit, TbPlus, TbArrowRight,
} from 'react-icons/tb';
import dashboardApi from '../api/dashboard.api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/axios';
import { exportDashboardToExcel } from '../utils/exportExcel';
import Loader from '../components/common/Loader';
import KpiCard from '../components/common/KpiCard';
import StatusChip from '../components/common/StatusChip';

const TABS = ['Overview', 'Line Status', 'Shift Performance', 'NC Tracker'];
const SHIFTS = [
  { code: 'F', label: 'Shift F' },
  { code: 'JD', label: 'Shift JD' },
  { code: 'M', label: 'Shift M' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const { hasRole } = useAuth();
  const canStartInspection = hasRole('Admin', 'QualityManager', 'Supervisor', 'Auditor');

  const [tab, setTab] = useState('Overview');
  const [shift, setShift] = useState('F');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [overview, setOverview] = useState(null);
  const [lines, setLines] = useState([]);
  const [trend, setTrend] = useState([]);
  const [status, setStatus] = useState(null);
  const [recentNC, setRecentNC] = useState([]);
  const [topDefects, setTopDefects] = useState([]);
  const [log, setLog] = useState([]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportDashboardToExcel({ overview, lines, trend, status, recentNC, topDefects, log, shift });
      toast.success('Dashboard exported to Excel.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ov, ln, tr, st, nc, td, lg] = await Promise.all([
        dashboardApi.overview(),
        dashboardApi.lines(),
        dashboardApi.qualityTrend(7),
        dashboardApi.inspectionStatus(shift),
        dashboardApi.recentNC(),
        dashboardApi.topDefects(30),
        dashboardApi.todaysLog(),
      ]);
      setOverview(ov.data);
      setLines(ln.data);
      setTrend(tr.data);
      setStatus(st.data);
      setRecentNC(nc.data);
      setTopDefects(td.data);
      setLog(lg.data);
    } catch (err) {
      toast.error('Could not load dashboard data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    dashboardApi.inspectionStatus(shift).then((res) => setStatus(res.data)).catch(() => {});
  }, [shift]);

  if (loading) return <Loader full label="Loading dashboard…" />;

  if (!overview) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <p className="text-ink dark:text-slate-100 font-medium mb-1">Couldn't load dashboard data.</p>
        <p className="text-xs text-muted mb-4">Make sure the backend API is running and reachable.</p>
        <button className="btn-primary" onClick={loadAll}>Retry</button>
      </div>
    );
  }

  const criticalNCs = recentNC.filter((n) => n.status === 'Open');
  const maxBar = Math.max(...trend.map((t) => t.qualityPercent || 0), 1);

  return (
    <div className="animate-fadeIn">
      {overview?.ncCriticalToday > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-lg px-3.5 py-2.5 flex items-center gap-2.5 mb-3.5 text-[12px]">
          <TbAlertTriangle className="text-warn shrink-0" size={17} />
          <div>
            <strong>{overview.ncCriticalToday} critical alert{overview.ncCriticalToday === 1 ? '' : 's'}</strong> raised today across active production lines.
          </div>
          <button className="btn-outline btn-sm ml-auto" onClick={() => navigate('/nc?severity=Critical')}>View all alerts</button>
        </div>
      )}

      <div className="dashboard-hero mb-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#C4BCFF] mb-2">Quality operations · live overview</p>
            <h1 className="font-display text-[28px] sm:text-[34px] font-semibold leading-tight text-white">Quality Overview</h1>
            <p className="text-[12px] sm:text-[13px] text-white/60 mt-2">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} <span className="mx-1.5 text-white/30">/</span> All production lines <span className="mx-1.5 text-white/30">/</span> Shift {shift} active
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select className="btn-outline btn-sm appearance-none pr-6 min-w-[120px]">
              <option>Today</option><option>This Week</option><option>This Month</option>
            </select>
            <button className="btn-outline btn-sm flex items-center gap-1" onClick={handleExport} disabled={exporting}>
              <TbDownload size={14} /> {exporting ? 'Exporting…' : 'Export'}
            </button>
            <button className="btn-outline btn-sm flex items-center gap-1" onClick={() => window.print()}><TbPrinter size={14} /> Print</button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 overflow-x-auto dashboard-tabs mb-5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`dashboard-tab px-1 py-3 text-[12px] transition-colors ${
              tab === t ? 'dashboard-tab-active font-semibold' : 'text-muted hover:text-ink dark:hover:text-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3.5 mb-6">
        <KpiCard icon={TbBuildingFactory} label="Production Lines" value={overview.productionLines} sub={`${overview.activeLines} active now`} tone="acc" />
        <KpiCard icon={TbCircleCheck} label="Overall Quality %" value={`${overview.overallQualityPercent}%`} sub="Today, across all lines" tone="ok" />
        <KpiCard icon={TbClock} label="Pending Inspections" value={overview.pendingInspections} sub="Draft / in-progress / review" tone="warn" />
        <KpiCard icon={TbAlertCircle} label="NC Count Today" value={overview.ncCountToday} sub={`${overview.ncCriticalToday} critical`} tone="danger" />
      </div>

      {(tab === 'Overview' || tab === 'Line Status') && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 mb-5">
          {lines.map((l) => (
            <button
              key={l.lineId}
              onClick={() => l.reportId ? navigate('/inspections') : null}
              className={`card p-3 text-left hover:border-acc hover:shadow-card transition-all ${l.status === 'Alert' ? 'border-amber-300' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-[12px] font-medium text-ink dark:text-slate-100">{l.line}</p>
                  <p className="text-[11px] text-muted mt-0.5">Model {l.model}</p>
                </div>
                <StatusChip value={l.status} />
              </div>
              {l.qualityPercent !== null ? (
                <>
                  <div className="h-[5px] bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${l.qualityPercent >= 90 ? 'bg-ok' : l.qualityPercent >= 75 ? 'bg-warn' : 'bg-danger'}`}
                      style={{ width: `${l.qualityPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-[10px] text-muted">
                    <span>Quality: {l.qualityPercent}%</span>
                    <span>Shift {l.shift}</span>
                    <span>Auditor: {l.Auditor}</span>
                  </div>
                </>
              ) : (
                <p className="text-[11px] text-muted">No inspection started today</p>
              )}
            </button>
          ))}
        </div>
      )}

      {(tab === 'Overview' || tab === 'Shift Performance') && (
        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-3.5 mb-5">
          <div className="card">
            <div className="card-head">
              <span className="card-title">Quality trend (last 7 days)</span>
            </div>
            <div className="flex items-end gap-2 h-24 mt-2">
              {trend.map((d, i) => {
                const isLast = i === trend.length - 1;
                const pct = d.qualityPercent;
                const height = pct ? Math.max((pct / maxBar) * 84, 4) : 4;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-medium text-ink dark:text-slate-200">{pct !== null ? `${pct}%` : '—'}</span>
                    <div
                      className={`w-full rounded-t ${isLast ? 'bg-ok' : 'bg-[#CAD6C9] dark:bg-[#31463B]'}`}
                      style={{ height }}
                    />
                    <span className="text-[10px] text-muted">
                      {new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><span className="card-title">Inspection status</span></div>
            <div className="flex gap-2 mb-3">
              {SHIFTS.map((s) => (
                <button
                  key={s.code}
                  onClick={() => setShift(s.code)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium ${shift === s.code ? 'bg-acc text-white' : 'bg-slate-100 dark:bg-slate-700 text-muted'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {status && (
              <div className="flex flex-col gap-1.5">
                <StatusRow label="Completed" value={status.completed} percent={status.completedPercent} color="bg-ok" valueColor="text-ok" />
                <StatusRow label="In Progress" value={status.inProgress} percent={status.inProgressPercent} color="bg-acc" valueColor="text-acc" />
                <StatusRow label="Pending" value={status.pending} percent={status.pendingPercent} color="bg-warn" valueColor="text-warn" />
              </div>
            )}
          </div>
        </div>
      )}

      {(tab === 'Overview' || tab === 'NC Tracker') && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5 mb-5">
          <div className="card">
            <div className="card-head flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="card-title">Recent non-conformities</span>
              <button className="btn-outline btn-sm" onClick={() => navigate('/nc')}>View all</button>
            </div>
            <div className="overflow-x-auto scroll-thin -mx-4 px-4">
              <table className="master-table w-full min-w-[700px]">
                <thead><tr><th>NC ID</th><th>Line / Model</th><th>Parameter</th><th>Status</th></tr></thead>
                <tbody>
                  {(tab === 'NC Tracker' ? recentNC : recentNC.slice(0, 4)).map((n) => (
                    <tr key={n.ncId} className="cursor-pointer" onClick={() => navigate('/nc')}>
                      <td className="text-acc font-medium">{n.ncId}</td>
                      <td>
                        <div>{n.line} / {n.model}</div>
                        <div className="text-[10px] text-muted">{n.operation}</div>
                      </td>
                      <td>{n.parameter} {n.actualValue}</td>
                      <td><StatusChip value={n.status} /></td>
                    </tr>
                  ))}
                  {recentNC.length === 0 && (
                    <tr><td colSpan={4} className="text-center text-muted py-4">No non-conformities recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-head flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="card-title">Top defects (last 30 days)</span>
              <button className="btn-outline btn-sm flex items-center gap-1" onClick={() => navigate('/reports/pareto')}>Pareto <TbArrowRight size={12} /></button>
            </div>
            <div className="flex flex-col gap-2 mt-1">
              {topDefects.length === 0 && <p className="text-xs text-muted py-3 text-center">No defects recorded in this window.</p>}
              {topDefects.map((d) => (
                <div key={d.label}>
                  <div className="flex justify-between text-[12px] mb-0.5">
                    <span className="text-ink dark:text-slate-200">{d.label}</span>
                    <span className="font-medium">{d.count}</span>
                  </div>
                  <div className="h-[5px] bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-danger rounded-full" style={{ width: `${d.percentOfMax}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-head flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="card-title">Today's inspection log</span>
          {canStartInspection && (
            <button className="btn-primary btn-sm flex items-center gap-1" onClick={() => navigate('/inspections/new')}><TbPlus size={13} /> New Inspection</button>
          )}
        </div>
        <div className="overflow-x-auto scroll-thin -mx-4 px-4">
          <table className="master-table w-full min-w-[760px]">
            <thead>
              <tr>
                <th>Report ID</th><th>Line</th><th>Model</th><th>Shift</th><th>Auditor</th><th>Time</th>
                <th>Quality %</th><th>NCs</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {log.length === 0 ? (
                <tr><td colSpan={10} className="text-center text-muted py-6">No inspections logged yet today. Start one to see it here.</td></tr>
              ) : (
                log.map((e) => (
                  <tr key={e._id}>
                    <td className="text-acc font-medium">{e.reportId}</td>
                    <td>{e.line}</td><td>{e.model}</td><td>{e.shift}</td><td>{e.Auditor}</td><td>{e.time}</td>
                    <td className={e.qualityPercent >= 90 ? 'text-ok font-medium' : e.qualityPercent >= 75 ? 'text-warn font-medium' : 'text-danger font-medium'}>
                      {e.qualityPercent}%
                    </td>
                    <td>{e.ncCount}</td>
                    <td><StatusChip value={e.status} /></td>
                    <td>
                      <button className="btn-outline btn-sm" onClick={() => navigate(`/inspections/${e._id}`)}>
                        {e.status === 'Completed' || e.status === 'Locked' ? <TbEye size={13} /> : <TbEdit size={13} />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, value, percent, color, valueColor }) {
  return (
    <div>
      <div className="flex justify-between text-[12px] mb-1">
        <span className="text-ink dark:text-slate-200">{label}</span>
        <span className={`font-medium ${valueColor}`}>{value}</span>
      </div>
      <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
