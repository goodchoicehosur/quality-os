import React from 'react';

export default function Loader({ full = false, label = 'Loading…', size = 22 }) {
  const spinner = (
    <div className="flex flex-col items-center gap-2.5">
      <div
        className="rounded-full border-2 border-slate-200 border-t-acc animate-spin"
        style={{ width: size, height: size }}
      />
      {label && <p className="text-xs text-muted">{label}</p>}
    </div>
  );

  if (full) {
    return <div className="w-full h-full min-h-[240px] flex items-center justify-center">{spinner}</div>;
  }
  return spinner;
}
