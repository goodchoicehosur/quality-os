import React from 'react';
import { motion } from 'framer-motion';

const TONE = {
  acc: { bg: 'bg-light', text: 'text-acc' },
  ok: { bg: 'bg-green-50', text: 'text-ok' },
  warn: { bg: 'bg-amber-50', text: 'text-warn' },
  danger: { bg: 'bg-red-50', text: 'text-danger' },
};

export default function KpiCard({ icon: Icon, label, value, sub, tone = 'acc', trend }) {
  const t = TONE[tone] || TONE.acc;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="card min-h-[132px] flex items-start justify-between"
    >
      <div>
        <p className="field-label mb-1.5">{label}</p>
        <p className="font-display text-[30px] font-semibold text-ink leading-none dark:text-slate-100">{value}</p>
        {sub && <p className="text-xs text-muted mt-1.5">{sub}</p>}
        {trend && (
          <p className={`text-xs mt-1.5 font-medium ${trend.positive ? 'text-ok' : 'text-danger'}`}>
            {trend.positive ? '\u2191' : '\u2193'} {trend.label}
          </p>
        )}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${t.bg} ${t.text}`}>
        <Icon size={19} />
      </div>
    </motion.div>
  );
}
