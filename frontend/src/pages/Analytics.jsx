import React, { useEffect, useState } from 'react';
import { TbChartBar } from 'react-icons/tb';
import dashboardApi from '../api/dashboard.api';
import Loader from '../components/common/Loader';

const RANGE_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

export default function Analytics() {
  const [range, setRange] = useState(30);
  const [trend, setTrend] = useState([]);
  const [defects, setDefects] = useState([]);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      dashboardApi.qualityTrend(range),
      dashboardApi.topDefects(range),
      dashboardApi.lines(),
    ]).then(([t, d, l]) => {
      setTrend(t.data);
      setDefects(d.data);
      setLines(l.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [range]);

  if (loading) return <Loader full label="Crunching quality analytics…" />;

  const validPoints = trend.filter((t) => t.qualityPercent !== null);
  const avg = validPoints.length ? Math.round((validPoints.reduce((s, t) => s + t.qualityPercent, 0) / validPoints.length) * 10) / 10 : 0;
  const best = validPoints.length ? Math.max(...validPoints.map((t) => t.qualityPercent)) : 0;
  const worst = validPoints.length ? Math.min(...validPoints.map((t) => t.qualityPercent)) : 0;
  const maxBar = Math.max(...trend.map((t) => t.qualityPercent || 0), 1);

  return (
    <div className="animate-fadeIn">
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-light text-acc flex items-center justify-center shrink-0"><TbChartBar size={20} /></div>
          <div>
            <h1 className="text-lg font-semibold text-ink dark:text-slate-100">Analytics</h1>
            <p className="text-xs text-muted mt-0.5">Quality trends and defect patterns across all production lines.</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium border ${range === r.value ? 'bg-acc text-white border-acc' : 'bg-white dark:bg-slate-800 text-muted border-border dark:border-slate-700'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3.5 mb-5">
        <div className="card"><p className="field-label mb-1.5">Average Quality</p><p className="text-2xl font-semibold text-ok">{avg}%</p></div>
        <div className="card"><p className="field-label mb-1.5">Best Day</p><p className="text-2xl font-semibold text-acc">{best}%</p></div>
        <div className="card"><p className="field-label mb-1.5">Worst Day</p><p className="text-2xl font-semibold text-danger">{worst}%</p></div>
      </div>

      <div className="card mb-5">
        <div className="card-head"><span className="card-title">Quality trend ({range} days)</span></div>
        <div className="flex items-end gap-1 overflow-x-auto scroll-thin pb-1" style={{ height: 140 }}>
          {trend.map((d) => {
            const pct = d.qualityPercent;
            const height = pct ? Math.max((pct / maxBar) * 110, 4) : 4;
            return (
              <div key={d.date} className="flex flex-col items-center gap-1 shrink-0" style={{ width: Math.max(560 / trend.length, 10) }}>
                <span className="text-[9px] text-muted">{pct !== null ? `${pct}%` : ''}</span>
                <div className={`w-full rounded-t ${pct >= 90 ? 'bg-ok' : pct >= 75 ? 'bg-warn' : pct !== null ? 'bg-danger' : 'bg-slate-100 dark:bg-slate-700'}`} style={{ height }} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <div className="card">
          <div className="card-head"><span className="card-title">Top defects ({range} days)</span></div>
          <div className="flex flex-col gap-2.5 mt-1">
            {defects.length === 0 && <p className="text-xs text-muted py-3 text-center">No defects recorded in this window.</p>}
            {defects.map((d) => (
              <div key={d.label}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-ink dark:text-slate-200">{d.label}</span>
                  <span className="font-medium">{d.count}</span>
                </div>
                <div className="h-[6px] bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-danger rounded-full" style={{ width: `${d.percentOfMax}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><span className="card-title">Quality by production line (today)</span></div>
          <div className="flex flex-col gap-2.5 mt-1">
            {lines.map((l) => (
              <div key={l.lineId}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-ink dark:text-slate-200">{l.line} <span className="text-muted">({l.model})</span></span>
                  <span className="font-medium">{l.qualityPercent !== null ? `${l.qualityPercent}%` : 'Idle'}</span>
                </div>
                <div className="h-[6px] bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${l.qualityPercent >= 90 ? 'bg-ok' : l.qualityPercent >= 75 ? 'bg-warn' : 'bg-danger'}`}
                    style={{ width: `${l.qualityPercent || 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
