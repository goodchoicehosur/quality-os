import React, { useEffect, useState } from 'react';
import { TbChartDots } from 'react-icons/tb';
import dashboardApi from '../../api/dashboard.api';
import Loader from '../../components/common/Loader';

export default function ParetoAnalysis() {
  const [days, setDays] = useState(30);
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dashboardApi.topDefects(days).then((res) => setDefects(res.data)).finally(() => setLoading(false));
  }, [days]);

  if (loading) return <Loader full label="Building Pareto chart…" />;

  const total = defects.reduce((s, d) => s + d.count, 0) || 1;
  let running = 0;
  const withCumulative = defects.map((d) => {
    running += d.count;
    return { ...d, cumulativePercent: Math.round((running / total) * 1000) / 10 };
  });

  const chartWidth = 640;
  const chartHeight = 260;
  const barGap = 16;
  const barWidth = withCumulative.length ? (chartWidth - barGap * (withCumulative.length - 1)) / withCumulative.length : 0;
  const maxCount = Math.max(...withCumulative.map((d) => d.count), 1);

  const linePoints = withCumulative
    .map((d, i) => {
      const x = i * (barWidth + barGap) + barWidth / 2;
      const y = chartHeight - (d.cumulativePercent / 100) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="animate-fadeIn">
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-light text-acc flex items-center justify-center shrink-0"><TbChartDots size={20} /></div>
          <div>
            <h1 className="text-lg font-semibold text-ink dark:text-slate-100">Pareto Analysis</h1>
            <p className="text-xs text-muted mt-0.5">The 80/20 view of which defects drive most non-conformities — prioritize the tallest bars first.</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium border ${days === d ? 'bg-acc text-white border-acc' : 'bg-white dark:bg-slate-800 text-muted border-border dark:border-slate-700'}`}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {withCumulative.length === 0 ? (
          <p className="text-sm text-muted py-10 text-center">No non-conformities recorded in this window.</p>
        ) : (
          <div className="overflow-x-auto scroll-thin">
            <svg viewBox={`-10 -20 ${chartWidth + 60} ${chartHeight + 60}`} width="100%" style={{ minWidth: 560 }}>
              {[0, 25, 50, 75, 100].map((p) => (
                <g key={p}>
                  <line x1={0} x2={chartWidth} y1={chartHeight - (p / 100) * chartHeight} y2={chartHeight - (p / 100) * chartHeight} stroke="#E2E8F0" strokeWidth={1} />
                  <text x={chartWidth + 8} y={chartHeight - (p / 100) * chartHeight + 3} fontSize={9} fill="#64748B">{p}%</text>
                </g>
              ))}

              {withCumulative.map((d, i) => {
                const x = i * (barWidth + barGap);
                const barHeight = (d.count / maxCount) * (chartHeight - 10);
                return (
                  <g key={d.label}>
                    <rect x={x} y={chartHeight - barHeight} width={barWidth} height={barHeight} fill="#675CE7" rx={3} />
                    <text x={x + barWidth / 2} y={chartHeight - barHeight - 6} fontSize={10} fontWeight={600} textAnchor="middle" fill="#1B2622">{d.count}</text>
                    <text x={x + barWidth / 2} y={chartHeight + 16} fontSize={9} textAnchor="middle" fill="#64748B">
                      {d.label.length > 14 ? `${d.label.slice(0, 13)}…` : d.label}
                    </text>
                  </g>
                );
              })}

              <polyline points={linePoints} fill="none" stroke="#F59E0B" strokeWidth={2} />
              {withCumulative.map((d, i) => {
                const x = i * (barWidth + barGap) + barWidth / 2;
                const y = chartHeight - (d.cumulativePercent / 100) * chartHeight;
                return <circle key={d.label} cx={x} cy={y} r={3} fill="#F59E0B" />;
              })}
            </svg>
            <div className="flex items-center gap-4 mt-4 text-[11px] text-muted">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-acc rounded-sm inline-block" /> Defect count</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-warn rounded-full inline-block" /> Cumulative %</span>
            </div>
          </div>
        )}
      </div>

      <div className="card mt-3.5 p-0 overflow-hidden">
        <table className="master-table">
          <thead><tr><th>Rank</th><th>Defect</th><th>Count</th><th>% of Total</th><th>Cumulative %</th></tr></thead>
          <tbody>
            {withCumulative.map((d, i) => (
              <tr key={d.label}>
                <td>{i + 1}</td>
                <td className="font-medium text-ink dark:text-slate-100">{d.label}</td>
                <td>{d.count}</td>
                <td>{Math.round((d.count / total) * 1000) / 10}%</td>
                <td className={d.cumulativePercent <= 80 ? 'text-danger font-medium' : ''}>{d.cumulativePercent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
