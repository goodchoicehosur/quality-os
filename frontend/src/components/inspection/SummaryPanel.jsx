import React from 'react';
import { TbChartPie, TbAlertTriangle } from 'react-icons/tb';

export default function SummaryPanel({ entry, threshold }) {
  const rows = entry.results || [];
  const shift = entry.shift;

  const valueFor = (row) => row.shiftResults.find((s) => s.shiftCode === shift)?.value;

  const nokRows = rows.filter((r) => valueFor(r) === 'NOK');
  const caRows = rows.filter((r) => valueFor(r) === 'CA');
  const okRows = rows.filter((r) => valueFor(r) === 'OK');
  const processNC = nokRows.filter((r) => r.parameter?.type === 'Process' || (!r.parameter?.type));
  const visualDefects = nokRows.filter((r) => (r.method || '').toLowerCase() === 'visual');
  const operationsCount = new Set(rows.map((r) => String(r.operation?._id || r.operation))).size;

  const critical = nokRows.filter((r) => r.nonConformity?.severity === 'Critical' || r.nonConformity?.severity === 'High').length;
  const minor = nokRows.length - critical;

  const scored = okRows.length + nokRows.length;
  const qualityPercent = scored > 0 ? Math.round((okRows.length / scored) * 1000) / 10 : entry.summary?.qualityPercent || 0;
  const belowThreshold = qualityPercent < threshold;
  const openNC = nokRows.filter((r) => r.nonConformity && r.nonConformity.status !== 'Closed');

  return (
    <div className="bg-card border border-border rounded-[10px] p-4 mb-3.5">
      <div className="text-[13px] font-medium text-hdr mb-3 flex items-center gap-1.5">
        <TbChartPie size={15} />
        Inspection Summary <span className="text-[11px] text-muted font-normal">(auto-calculated)</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <SummCard label="Total Parameters" value={rows.length} sub={`Across ${operationsCount} operation${operationsCount === 1 ? '' : 's'}`} />
        <SummCard label="Total NC (Not OK)" value={nokRows.length} color="#DC2626" sub={`${critical} critical \u00b7 ${minor} minor`} />
        <SummCard label="Corrective Actions" value={caRows.length} color="#F59E0B" sub={caRows.length ? `Open on Shift ${shift}` : 'None open'} />
        <SummCard label="Process Param NC" value={processNC.length} color="#DC2626" sub={processNC[0]?.parameterName ? `${processNC[0].parameterName} OOS` : 'None'} />
        <SummCard label="Visual Defects" value={visualDefects.length} color="#F59E0B" sub={visualDefects[0] ? `${visualDefects[0].parameterName} \u00b7 ${visualDefects[0].operationName}` : 'None'} />
        <SummCard
          label="Overall Quality %"
          value={`${qualityPercent}%`}
          big
          color={qualityPercent >= threshold ? '#16A34A' : qualityPercent >= 75 ? '#F59E0B' : '#DC2626'}
          border={qualityPercent >= threshold}
          sub={`${okRows.length} OK / ${rows.length} total (Shift ${shift})`}
        />
      </div>

      {belowThreshold && (
        <div className="mt-3 px-3.5 py-2.5 bg-amber-100 border border-amber-300 rounded-lg text-[12px] text-amber-900 flex items-start gap-2">
          <TbAlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>
            <strong>Quality below threshold ({threshold}%).</strong> This report requires supervisor review before submission.
            {openNC.length > 0 && ` ${openNC.map((r) => r.nonConformity?.ncId).filter(Boolean).join(', ')} must be linked with corrective action.`}
          </span>
        </div>
      )}
    </div>
  );
}

function SummCard({ label, value, sub, color, big, border }) {
  return (
    <div className="bg-card border rounded-lg p-3" style={{ borderColor: border ? '#16A34A' : '#E2E8F0', borderWidth: border ? 2 : 1 }}>
      <div className="text-[10px] uppercase tracking-wide text-muted font-medium mb-1">{label}</div>
      <div className={big ? 'text-[28px] font-medium leading-none' : 'text-[22px] font-medium leading-none'} style={{ color: color || '#1B2622' }}>
        {value}
      </div>
      <div className="text-[11px] text-muted mt-1">{sub}</div>
    </div>
  );
}
