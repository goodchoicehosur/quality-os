import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  TbDeviceFloppy, TbPrinter, TbFileSpreadsheet, TbSend, TbClock, TbLock, TbTrash,
  TbCheck, TbX, TbAlertTriangle, TbPlus, TbFilter, TbAlertCircle, TbCircleCheck, TbExternalLink,
} from 'react-icons/tb';
import inspectionsApi from '../api/inspections.api';
import parametersApi from '../api/parameters.api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/axios';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import InspectionHeaderCard from '../components/inspection/InspectionHeaderCard';
import SummaryPanel from '../components/inspection/SummaryPanel';
import { exportInspectionToExcel } from '../utils/exportExcel';

const VERDICTS = [
  { key: 'OK', icon: TbCheck, cls: 'chk-ok' },
  { key: 'NOK', icon: TbX, cls: 'chk-nok' },
  { key: 'CA', icon: TbAlertTriangle, cls: 'chk-ca' },
];

const SHIFT_BG = ['#1e40af', '#1e3a8a', '#172554', '#0f172a'];

export default function InspectionEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { hasRole } = useAuth();
  const canEdit = hasRole('Admin', 'QualityManager', 'Supervisor', 'Auditor');

  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedAgo, setSavedAgo] = useState('just now');
  const [opFilter, setOpFilter] = useState('all');
  const [ncOnly, setNcOnly] = useState(false);

  const [addParamOpen, setAddParamOpen] = useState(false);
  const [availableParams, setAvailableParams] = useState([]);
  const [discardConfirm, setDiscardConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const remarkTimers = useRef({});
  const specTimers = useRef({});
  const verdictValueTimers = useRef({});

  const load = useCallback(async () => {
    try {
      const res = await inspectionsApi.get(id);
      setEntry(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
      navigate('/inspections');
    } finally {
      setLoading(false);
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  // "Last saved X ago" ticker
  useEffect(() => {
    if (!entry?.lastSavedAt) return undefined;
    const tick = () => {
      const secs = Math.floor((Date.now() - new Date(entry.lastSavedAt).getTime()) / 1000);
      if (secs < 5) setSavedAgo('just now');
      else if (secs < 60) setSavedAgo(`${secs} sec ago`);
      else setSavedAgo(`${Math.floor(secs / 60)} min ago`);
    };
    tick();
    const t = setInterval(tick, 5000);
    return () => clearInterval(t);
  }, [entry?.lastSavedAt]);

  // Autosave heartbeat every 25s while editable
  useEffect(() => {
    if (!canEdit || !entry || !['Draft', 'InProgress'].includes(entry.status)) return undefined;
    const t = setInterval(() => {
      inspectionsApi.saveDraft(id).then((res) => {
        setEntry((prev) => (prev ? { ...prev, lastSavedAt: res.data.lastSavedAt, status: res.data.status } : prev));
      }).catch(() => {});
    }, 25000);
    return () => clearInterval(t);
  }, [canEdit, entry?.status, id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isReadOnly = entry && (!canEdit || ['Completed', 'Locked'].includes(entry.status));
  const shifts = entry?.template?.shifts || [];
  const threshold = entry?.template?.qualityThreshold ?? 85;

  const groupedOperations = useMemo(() => {
    if (!entry) return [];
    const groups = [];
    let current = null;
    entry.results.forEach((row) => {
      const key = `${row.opNumber}-${row.operationName}`;
      if (!current || current.key !== key) {
        current = { key, opNumber: row.opNumber, operationName: row.operationName, processName: row.processName, rows: [] };
        groups.push(current);
      }
      current.rows.push(row);
    });
    return groups;
  }, [entry]);

  const visibleGroups = useMemo(() => {
    return groupedOperations
      .filter((g) => opFilter === 'all' || String(g.opNumber) === opFilter)
      .map((g) => ({ ...g, rows: ncOnly ? g.rows.filter((r) => r.nonConformity) : g.rows }))
      .filter((g) => g.rows.length > 0);
  }, [groupedOperations, opFilter, ncOnly]);

  const totalCount = entry?.results.length || 0;
  const completedCount = entry?.results.filter((r) => r.shiftResults.find((s) => s.shiftCode === entry.shift)?.value).length || 0;

  // ---------------- Cell interaction ----------------
  const applyCellUpdate = async (rowId, shiftCode, value, actual) => {
    setBusy(true);
    try {
      const res = await inspectionsApi.updateCell(id, { rowId, shiftCode, value, actualValue: actual });
      setEntry((prev) => ({
        ...res.data,
        results: res.data.results.map((savedRow) => {
          const currentRow = prev?.results.find((r) => r._id === savedRow._id);
          if (!currentRow) return savedRow;
          return {
            ...savedRow,
            shiftResults: savedRow.shiftResults.map((savedCell) => {
              const currentCell = currentRow.shiftResults.find((c) => c.shiftCode === savedCell.shiftCode);
              return currentCell
                ? { ...savedCell, verdictValues: currentCell.verdictValues || savedCell.verdictValues }
                : savedCell;
            }),
          };
        }),
      }));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleVerdictClick = (row, shiftCode, verdict) => {
    if (isReadOnly) return;
    const cell = row.shiftResults.find((s) => s.shiftCode === shiftCode);
    const isSelected = cell?.value === verdict;
    if (isSelected) {
      applyCellUpdate(row._id, shiftCode, null, '');
      return;
    }
    const actualValue = verdict === 'NOK'
      ? cell?.verdictValues?.NOK || cell?.actualValue || ''
      : cell?.actualValue || '';
    applyCellUpdate(row._id, shiftCode, verdict, actualValue);
  };

  const handleVerdictValueChange = (rowId, shiftCode, verdict, value) => {
    setEntry((prev) => ({
      ...prev,
      results: prev.results.map((row) => {
        if (row._id !== rowId) return row;
        return {
          ...row,
          shiftResults: row.shiftResults.map((cell) => (
            cell.shiftCode === shiftCode
              ? { ...cell, verdictValues: { ...cell.verdictValues, [verdict]: value } }
              : cell
          )),
        };
      }),
    }));

    const timerKey = `${rowId}-${shiftCode}-${verdict}`;
    clearTimeout(verdictValueTimers.current[timerKey]);
    verdictValueTimers.current[timerKey] = setTimeout(async () => {
      try {
        const res = await inspectionsApi.updateCell(id, { rowId, shiftCode, verdict, verdictValue: value });
        setEntry((prev) => (prev ? { ...prev, lastSavedAt: res.data.lastSavedAt } : prev));
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    }, 700);
  };

  const handleRemarksChange = (rowId, value) => {
    setEntry((prev) => ({
      ...prev,
      results: prev.results.map((r) => (r._id === rowId ? { ...r, remarks: value } : r)),
    }));
    clearTimeout(remarkTimers.current[rowId]);
    remarkTimers.current[rowId] = setTimeout(() => {
      inspectionsApi.updateRemarks(id, { rowId, remarks: value }).catch(() => {});
    }, 700);
  };

  const handleSpecificationChange = (rowId, value) => {
    setEntry((prev) => ({
      ...prev,
      results: prev.results.map((r) => (r._id === rowId ? { ...r, specification: value } : r)),
    }));
    clearTimeout(specTimers.current[rowId]);
    specTimers.current[rowId] = setTimeout(() => {
      inspectionsApi.updateRow(id, { rowId, specification: value }).catch(() => {});
    }, 700);
  };

  // ---------------- Keyboard navigation ----------------
  const cellId = (rowId, colIdx) => `chk-${rowId}-${colIdx}`;
  const flatRows = useMemo(() => visibleGroups.flatMap((g) => g.rows), [visibleGroups]);
  const totalCols = shifts.length * 3;

  const focusCell = (rowIdx, colIdx) => {
    const clampedRow = Math.max(0, Math.min(flatRows.length - 1, rowIdx));
    const clampedCol = Math.max(0, Math.min(totalCols - 1, colIdx));
    const row = flatRows[clampedRow];
    if (!row) return;
    document.getElementById(cellId(row._id, clampedCol))?.focus();
  };

  const handleGridKeyDown = (e, rowIdx, colIdx, row, shiftCode, verdict) => {
    switch (e.key) {
      case 'ArrowRight': e.preventDefault(); focusCell(rowIdx, colIdx + 1); break;
      case 'ArrowLeft': e.preventDefault(); focusCell(rowIdx, colIdx - 1); break;
      case 'ArrowDown': e.preventDefault(); focusCell(rowIdx + 1, colIdx); break;
      case 'ArrowUp': e.preventDefault(); focusCell(rowIdx - 1, colIdx); break;
      case 'Enter':
        e.preventDefault();
        handleVerdictClick(row, shiftCode, verdict);
        focusCell(rowIdx + 1, colIdx);
        break;
      case ' ':
        e.preventDefault();
        handleVerdictClick(row, shiftCode, verdict);
        break;
      default:
        break;
    }
  };

  // ---------------- Workflow actions ----------------
  const doAction = async (fn, successMsg) => {
    setBusy(true);
    try {
      const res = await fn();
      if (res?.data) setEntry(res.data);
      if (successMsg) toast.success(successMsg);
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleSaveDraft = () => doAction(() => inspectionsApi.saveDraft(id), 'Draft saved.');
  const handleSubmit = () => doAction(() => inspectionsApi.submit(id), 'Inspection submitted.');
  const handleApprove = () => doAction(() => inspectionsApi.approve(id), 'Report approved and completed.');
  const handleLock = () => doAction(() => inspectionsApi.lock(id), 'Report locked.');
  const handleDiscard = async () => {
    setBusy(true);
    try {
      await inspectionsApi.discard(id);
      toast.success('Draft discarded.');
      navigate('/inspections');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
      setDiscardConfirm(false);
    }
  };

  const openAddParameter = async () => {
    try {
      const res = await parametersApi.list({ model: entry.model._id, active: 'true' });
      const existingIds = new Set(entry.results.map((r) => String(r.parameter?._id || r.parameter)));
      setAvailableParams(res.data.filter((p) => !existingIds.has(String(p._id))));
      setAddParamOpen(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleAddParameter = async (param) => {
    setBusy(true);
    try {
      const res = await inspectionsApi.addRow(id, {
        operation: param.operation._id,
        opNumber: param.operation.opNumber,
        processName: param.operation.processName,
        operationName: param.operation.name,
        parameter: param._id,
        parameterName: param.name,
        siNo: param.siNo,
        specification: param.specification,
        unit: param.unit,
        method: param.method,
      });
      setEntry(res.data);
      toast.success(`${param.name} added to the sheet.`);
      setAddParamOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader full label="Loading inspection sheet…" />;
  if (!entry) return null;

  const belowThreshold = (entry.summary?.qualityPercent ?? 100) < threshold;
  const uniqueOps = groupedOperations.map((g) => ({ opNumber: g.opNumber, name: g.operationName }));

  return (
    <div className="animate-fadeIn">
      {/* Page-level action bar (mirrors the reference dedicated topbar) */}
      <div className="bg-card border-b border-border px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2 mb-3 no-print sticky top-0 z-10">
        <div className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-ink">
          <span>Inspection Entry</span>
          <span className="text-border">|</span>
          <span className="text-[12px] text-muted">{entry.reportId}</span>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2 justify-end">
          {!isReadOnly && (
            <button className="btn-outline btn-sm" onClick={handleSaveDraft} disabled={busy}>
              <TbDeviceFloppy size={13} /> Save Draft
            </button>
          )}
          <button className="btn-outline btn-sm" onClick={() => window.print()}><TbPrinter size={13} /> Print</button>
          <button className="btn-outline btn-sm" onClick={() => exportInspectionToExcel(entry)}><TbFileSpreadsheet size={13} /> Export Excel</button>
          {entry.status === 'SubmittedForReview' && hasRole('Admin', 'QualityManager', 'Supervisor') && (
            <button className="btn-success btn-sm" onClick={handleApprove} disabled={busy}><TbCircleCheck size={14} /> Approve &amp; Complete</button>
          )}
          {!isReadOnly && (
            <button className="btn-success btn-sm" onClick={handleSubmit} disabled={busy}><TbSend size={13} /> Submit Inspection</button>
          )}
        </div>
      </div>

      <div className="px-5">
        <div className="text-[11px] text-muted mb-3">
          Home / Daily Inspection / <span className="text-acc">{entry.reportId} — {entry.status}</span>
        </div>

        {!isReadOnly ? (
          <div className="bg-light border border-acc/20 rounded-lg px-3.5 py-2 flex items-center gap-2 text-[12px] text-acc mb-3 flex-wrap">
            <TbClock size={15} />
            Inspection in progress · Auto-save enabled · Last saved {savedAgo}
            {hasRole('Admin', 'QualityManager', 'Supervisor') && (
              <button className="btn-outline btn-sm ml-auto" onClick={handleLock} disabled={busy}>
                <TbLock size={12} /> Lock Report
              </button>
            )}
          </div>
        ) : (
          <div className="bg-slate-100 border border-slate-300 rounded-lg px-3.5 py-2 flex items-center gap-2 text-[12px] text-slate-600 mb-3">
            <TbLock size={15} />
            This report is {entry.status.toLowerCase()} and is now read-only.
          </div>
        )}

        <InspectionHeaderCard entry={entry} completedCount={completedCount} totalCount={totalCount} />

        <div className="bg-card border border-border rounded-[10px] overflow-hidden mb-3.5">
          <div className="flex flex-col gap-3 px-3.5 py-3 border-b border-border bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[12px] font-medium">Inspection Parameters</span>
            <div className="flex flex-wrap gap-2 items-center">
              <select className="btn-outline btn-sm appearance-none pr-6" value={opFilter} onChange={(e) => setOpFilter(e.target.value)}>
              <option value="all">All Operations</option>
              {uniqueOps.map((o) => <option key={o.opNumber} value={String(o.opNumber)}>OP {o.opNumber} — {o.name}</option>)}
            </select>
            <button className="btn-outline btn-sm flex items-center gap-1"><TbFilter size={13} /> Filter</button>
            <button
              className={`btn-sm ${ncOnly ? 'bg-danger text-white border-danger hover:bg-red-700' : 'btn-outline'}`}
              onClick={() => setNcOnly((v) => !v)}
            >
              <TbAlertCircle size={13} /> Show NCs only
            </button>
            </div>
          </div>

          <div className="overflow-x-auto scroll-thin">
            <table className="ipir w-full min-w-[1500px]">
              <thead>
                <tr>
                  <th className="left" style={{ width: 50 }}>OP No.</th>
                  <th className="left" style={{ width: 130 }}>Process</th>
                  <th style={{ width: 40 }}>SI</th>
                  <th className="left" style={{ width: 140 }}>Parameter</th>
                  <th className="left" style={{ width: 120 }}>Specification</th>
                  <th className="left" style={{ width: 100 }}>Method</th>
                  {shifts.map((s, i) => (
                    <th key={s.code} colSpan={3} style={{ width: 80, background: SHIFT_BG[i % SHIFT_BG.length] }}>
                      Shift {s.code}
                    </th>
                  ))}
                  <th className="left" style={{ width: 130 }}>Remarks / CA</th>
                </tr>
                <tr>
                  <th /><th /><th /><th /><th /><th />
                  {shifts.map((s, i) => (
                    <React.Fragment key={s.code}>
                      <th style={{ fontSize: 9, background: SHIFT_BG[i % SHIFT_BG.length] }}>✓ OK</th>
                      <th style={{ fontSize: 9, background: SHIFT_BG[i % SHIFT_BG.length] }}>✗ NOK</th>
                      <th style={{ fontSize: 9, background: SHIFT_BG[i % SHIFT_BG.length] }}>⚠ CA</th>
                    </React.Fragment>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {visibleGroups.map((group) => {
                  const openNCCount = group.rows.filter((r) => r.nonConformity && r.nonConformity.status !== 'Closed').length;
                  return (
                    <React.Fragment key={group.key}>
                      <tr className="op-header">
                        <td colSpan={6 + shifts.length * 3 + 1}>
                          <span style={{ color: '#675CE7', fontWeight: 600 }}>OP {group.opNumber}</span>
                          <span style={{ margin: '0 8px', color: '#64748B' }}>·</span>
                          {group.operationName}
                          {openNCCount > 0 && (
                            <span style={{ marginLeft: 10, background: '#FEF2F2', color: '#991B1B', borderRadius: 4, padding: '1px 8px', fontSize: 10 }}>
                              ⚠ {openNCCount} NC open
                            </span>
                          )}
                        </td>
                      </tr>
                      {group.rows.map((row) => {
                        const rowIdx = flatRows.findIndex((r) => r._id === row._id);
                        const hasOpenNC = row.nonConformity && row.nonConformity.status !== 'Closed';
                        return (
                          <tr key={row._id} style={hasOpenNC ? { background: '#FFF8F8' } : undefined}>
                            <td className="op-num">{row.opNumber}</td>
                            <td>
                              <div className="proc-badge" style={hasOpenNC ? { background: '#FEF2F2', color: '#DC2626' } : undefined}>{row.processName}</div>
                            </td>
                            <td className="si-num">{row.siNo}</td>
                            <td><div className="param-name" style={hasOpenNC ? { color: '#DC2626' } : undefined}>{row.parameterName}</div></td>
                            <td>
                              {!isReadOnly ? (
                                <input
                                  className="input"
                                  value={row.specification || ''}
                                  onChange={(e) => handleSpecificationChange(row._id, e.target.value)}
                                />
                              ) : (
                                <span className="spec-text">{row.specification}</span>
                              )}
                              {hasOpenNC && row.shiftResults.find((s) => s.shiftCode === (row.nonConformity?.shift || entry.shift))?.actualValue && (
                                <><br /><span style={{ fontSize: 10, color: '#DC2626' }}>Actual: {row.shiftResults.find((s) => s.shiftCode === (row.nonConformity?.shift || entry.shift))?.actualValue}</span></>
                              )}
                            </td>
                            <td><span className="method-text">{row.method}</span></td>
                            {shifts.map((s, sIdx) => {
                              const cell = row.shiftResults.find((sr) => sr.shiftCode === s.code) || {};
                              const shiftIndexInEntry = shifts.findIndex((x) => x.code === entry.shift);
                              const isFuture = sIdx > shiftIndexInEntry;
                              return (
                                <React.Fragment key={s.code}>
                                  {VERDICTS.map((v, vIdx) => {
                                    const colIdx = sIdx * 3 + vIdx;
                                    return (
                                      <td key={v.key} className="shift-cell" style={{ width: 88, ...(isFuture ? { opacity: 0.4 } : {}) }}>
                                        <div className="flex flex-col items-center gap-1">
                                          <button
                                            id={cellId(row._id, colIdx)}
                                            type="button"
                                            disabled={isReadOnly || isFuture}
                                            className={`chk ${v.cls} ${cell.value === v.key ? 'sel' : ''}`}
                                            title={v.key}
                                            onClick={() => handleVerdictClick(row, s.code, v.key)}
                                            onKeyDown={(e) => handleGridKeyDown(e, rowIdx, colIdx, row, s.code, v.key)}
                                          >
                                            <v.icon size={13} />
                                          </button>
                                          <input
                                            className="input min-w-0 px-1 py-1 text-center text-[10px]"
                                            aria-label={`${v.key} value for ${row.parameterName}, shift ${s.code}`}
                                            placeholder="Value"
                                            value={cell.verdictValues?.[v.key] || (v.key === 'NOK' ? cell.actualValue : '') || ''}
                                            disabled={isReadOnly || isFuture}
                                            onChange={(e) => handleVerdictValueChange(row._id, s.code, v.key, e.target.value)}
                                          />
                                        </div>
                                      </td>
                                    );
                                  })}
                                </React.Fragment>
                              );
                            })}
                            <td>
                              {row.nonConformity ? (
                                <div className="flex items-center gap-1">
                                  <span style={{ background: '#FEF2F2', color: '#DC2626', fontSize: 10, padding: '1px 6px', borderRadius: 4 }}>
                                    {row.nonConformity.ncId}
                                  </span>
                                  <button
                                    className="btn btn-sm"
                                    style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', fontSize: 10 }}
                                    onClick={() => navigate(`/nc/${row.nonConformity._id}`)}
                                  >
                                    <TbExternalLink size={10} /> View NC
                                  </button>
                                </div>
                              ) : (
                                <textarea
                                  className="remark-input"
                                  placeholder="Remarks…"
                                  rows={1}
                                  disabled={isReadOnly}
                                  value={row.remarks || ''}
                                  onChange={(e) => handleRemarksChange(row._id, e.target.value)}
                                />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
                {visibleGroups.length === 0 && (
                  <tr><td colSpan={20} className="text-center text-muted py-6">No parameters match the current filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {!isReadOnly && (
            <div className="flex justify-end gap-2 px-3.5 py-3 border-t border-border bg-slate-50">
              <button className="btn-outline btn-sm" onClick={openAddParameter}><TbPlus size={13} /> Add Parameter</button>
            </div>
          )}
        </div>

        <SummaryPanel entry={entry} threshold={threshold} />

        {!isReadOnly && (
          <div className="flex justify-end gap-2 pb-6">
            <button className="btn-outline" onClick={() => setDiscardConfirm(true)} disabled={busy}><TbTrash size={14} /> Discard Draft</button>
            <button className="btn-outline" onClick={handleSaveDraft} disabled={busy}><TbDeviceFloppy size={14} /> Save Draft</button>
            {belowThreshold ? (
              <>
                <button className="btn" style={{ background: '#F59E0B', color: '#fff' }} onClick={handleSubmit} disabled={busy}>
                  <TbSend size={14} /> Submit for Review
                </button>
                <button className="btn-success" style={{ opacity: 0.5, cursor: 'not-allowed' }} disabled>
                  <TbCircleCheck size={14} /> Submit Final (Pending Supervisor)
                </button>
              </>
            ) : (
              <button className="btn-success" onClick={handleSubmit} disabled={busy}>
                <TbCircleCheck size={14} /> Submit Final
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add parameter */}
      <Modal open={addParamOpen} onClose={() => setAddParamOpen(false)} title="Add Parameter to Sheet" width={480}>
        {availableParams.length === 0 ? (
          <p className="text-sm text-muted py-4 text-center">
            Every active parameter configured for this model is already on the sheet. Add more in Parameter Master.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto scroll-thin -mx-1">
            {availableParams.map((p) => (
              <button
                key={p._id}
                onClick={() => handleAddParameter(p)}
                className="w-full text-left px-3 py-2.5 rounded-md hover:bg-slate-50 flex items-center justify-between gap-2 border-b border-slate-50"
              >
                <div>
                  <p className="text-[12px] font-medium text-ink">{p.name}</p>
                  <p className="text-[11px] text-muted">OP {p.operation?.opNumber} · {p.specification} {p.unit}</p>
                </div>
                <TbPlus size={14} className="text-acc shrink-0" />
              </button>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={discardConfirm}
        onClose={() => setDiscardConfirm(false)}
        onConfirm={handleDiscard}
        loading={busy}
        title="Discard this draft?"
        message="All recorded results on this report will be permanently deleted. This cannot be undone."
        confirmLabel="Discard Draft"
      />
    </div>
  );
}
