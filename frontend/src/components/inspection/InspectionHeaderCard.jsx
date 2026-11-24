import React from 'react';
import { TbClipboardCheck } from 'react-icons/tb';

const STATUS_DOT = {
  Draft: 'bg-slate-400', InProgress: 'bg-acc', SubmittedForReview: 'bg-warn',
  Completed: 'bg-ok', Locked: 'bg-slate-500',
};
const STATUS_LABEL = {
  Draft: 'Draft', InProgress: 'In Progress', SubmittedForReview: 'Pending Review',
  Completed: 'Completed', Locked: 'Locked',
};

export default function InspectionHeaderCard({ entry, completedCount, totalCount }) {
  return (
    <div className="bg-card border border-border rounded-[10px] p-4 mb-3.5">
      <div className="flex items-center justify-between mb-3.5 pb-3 border-b-2 border-hdr">
        <div className="text-[15px] font-medium text-hdr flex items-center gap-1.5">
          <TbClipboardCheck size={17} />
          In-Process Inspection Report (IPIR)
        </div>
        <div className="text-[11px] text-acc bg-light px-2.5 py-0.5 rounded-full">{entry.reportId}</div>
      </div>

      <div className="grid grid-cols-4 gap-2.5">
        <Field label="Customer" value={entry.customer?.name} />
        <Field label="Production Line" value={entry.productionLine?.name} />
        <Field label="Model" value={entry.model?.name} />
        <Field label="Date" value={new Date(entry.date).toLocaleDateString('en-IN')} />
        <Field label="Shift" value={entry.template?.shifts?.find((s) => s.code === entry.shift)?.label || entry.shift} />
        <Field label="Auditor" value={entry.Auditor?.name || '\u2014'} />
        <Field label="Supervisor" value={entry.supervisor?.name || '\u2014'} />
        <div className="flex flex-col gap-[3px]">
          <span className="text-[10px] uppercase tracking-wide text-muted font-medium">Report Status</span>
          <span className="text-[13px] font-medium flex items-center gap-1.5" style={{ color: '#675CE7' }}>
            <span className={`inline-block w-[7px] h-[7px] rounded-full ${STATUS_DOT[entry.status]}`} />
            {STATUS_LABEL[entry.status]}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 mt-2.5 pt-2.5 border-t border-border flex-wrap">
        <LegendDot color="#16A34A" label="OK" />
        <LegendDot color="#DC2626" label="Not OK" />
        <LegendDot color="#F59E0B" label="Corrective Action" />
        <span className="ml-auto text-[11px] text-muted">
          Total parameters: {totalCount} \u00b7 Completed: {completedCount} \u00b7 Remaining: {totalCount - completedCount}
        </span>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="flex flex-col gap-[3px]">
      <span className="text-[10px] uppercase tracking-wide text-muted font-medium">{label}</span>
      <span className="text-[13px] font-medium text-ink">{value || '\u2014'}</span>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-ink">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      {label}
    </div>
  );
}
