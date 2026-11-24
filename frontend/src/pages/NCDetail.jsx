import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  TbPaperclip, TbPrinter, TbCircleCheck, TbEdit, TbAlertTriangle, TbInfoCircle, TbSearch,
  TbTool, TbMessageCircle, TbGitBranch, TbChartBar, TbUpload, TbFileTypePdf, TbPhoto,
  TbDownload, TbListCheck, TbCheck, TbClock, TbDots, TbX as TbXIcon,
} from 'react-icons/tb';
import ncApi from '../api/nc.api';
import parametersApi from '../api/parameters.api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/axios';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import StatusChip from '../components/common/StatusChip';

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
const SEV_STYLE = {
  Low: { border: '#BBF7D0', color: '#166534', bg: '#F0FDF4' },
  Medium: { border: '#FED7AA', color: '#92400E', bg: '#FFFBEB' },
  High: { border: '#FECACA', color: '#991B1B', bg: '#FEF2F2' },
  Critical: { border: '#7f1d1d', color: '#fff', bg: '#7f1d1d' },
};

export default function NCDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { hasRole } = useAuth();

  const [nc, setNc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [rcaCategory, setRcaCategory] = useState('');
  const [rcaDescription, setRcaDescription] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [whyWhy, setWhyWhy] = useState('');

  const [caDescription, setCaDescription] = useState('');
  const [caOwner, setCaOwner] = useState('');
  const [caTargetDate, setCaTargetDate] = useState('');
  const [caStatus, setCaStatus] = useState('Not started');

  const load = async () => {
    try {
      const res = await ncApi.get(id);
      setNc(res.data);
      setSeverity(res.data.severity);
      setRcaCategory(res.data.rootCause?.category || '');
      setRcaDescription(res.data.rootCause?.description || '');
      setWhyWhy(res.data.whyWhy?.analysis || '');
      setCaDescription(res.data.correctiveAction?.description || '');
      setCaOwner(res.data.correctiveAction?.owner || '');
      setCaTargetDate(res.data.correctiveAction?.targetDate ? res.data.correctiveAction.targetDate.slice(0, 10) : '');
      setCaStatus(res.data.correctiveAction?.status || 'Not started');
      if (res.data.model && res.data.operation) {
        const p = await parametersApi.list({ model: res.data.model._id, operation: res.data.operation._id });
        setParams(p.data);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
      navigate('/nc');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const handleSaveRootCause = async () => {
    setBusy(true);
    try {
      const res = await ncApi.updateRootCause(id, { category: rcaCategory, description: rcaDescription, severity });
      setNc(res.data);
      toast.success('Root cause saved.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveWhyWhy = async () => {
    setBusy(true);
    try {
      const res = await ncApi.updateWhyWhy(id, { analysis: whyWhy });
      setNc(res.data);
      toast.success('Why-Why analysis saved.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveCA = async () => {
    setBusy(true);
    try {
      const res = await ncApi.updateCorrectiveAction(id, { description: caDescription, owner: caOwner, targetDate: caTargetDate || undefined, status: caStatus });
      setNc(res.data);
      toast.success('Corrective action saved.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setBusy(true);
    try {
      await ncApi.addComment(id, commentText.trim());
      setCommentText('');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleImpactChange = async (field, value) => {
    try {
      const res = await ncApi.updateImpact(id, { [field]: value });
      setNc(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleEscalate = async () => {
    const reason = window.prompt('Reason for escalation (optional):', '');
    if (reason === null) return;
    setBusy(true);
    try {
      const res = await ncApi.escalate(id, reason);
      setNc(res.data);
      toast.success('Non-conformity escalated to Critical.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleAdvance = async () => {
    setBusy(true);
    try {
      const res = await ncApi.advance(id);
      setNc(res.data);
      toast.success('Advanced to Quality Manager review.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleApproveClose = async () => {
    setBusy(true);
    try {
      const res = await ncApi.approveClose(id);
      setNc(res.data);
      toast.success('Non-conformity approved and closed.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleAttach = async (filename, url) => {
    try {
      await ncApi.addAttachment(id, { filename, url });
      toast.success('Attachment added.');
      setAttachOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <Loader full label="Loading non-conformity…" />;
  if (!nc) return null;

  const canManage = hasRole('Admin', 'QualityManager', 'Supervisor');
  const canApproveClose = hasRole('Admin', 'QualityManager');
  const canContribute = hasRole('Admin', 'QualityManager', 'Supervisor', 'Auditor');

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-2 mb-3 no-print">
        {canContribute && <button className="btn-outline btn-sm" onClick={() => setAttachOpen(true)}><TbPaperclip size={13} /> Attach</button>}
        <button className="btn-outline btn-sm" onClick={() => window.print()}><TbPrinter size={13} /> Print</button>
        {canManage && <button className="btn-outline btn-sm" onClick={() => setEditOpen(true)}><TbEdit size={13} /> Edit</button>}
        {nc.status === 'PendingApproval' && canApproveClose && (
          <button className="btn-success btn-sm ml-auto" onClick={handleApproveClose} disabled={busy}>
            <TbCircleCheck size={14} /> Approve &amp; Close
          </button>
        )}
      </div>

      <div className="text-[11px] text-muted mb-2.5">Home / Non-Conformities / <span className="text-acc">{nc.ncId}</span></div>

      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 flex items-center gap-3 mb-4 flex-wrap">
        <div>
          <div className="text-base font-semibold text-danger">{nc.ncId}</div>
          <div className="text-[11px] text-muted">
            Raised {new Date(nc.detectedAt || nc.createdAt).toLocaleDateString('en-IN')} · {new Date(nc.detectedAt || nc.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · Shift {nc.shift || '—'}
          </div>
        </div>
        <StatusChip value={nc.status} />
        <StatusChip value={nc.severity} />
        {canManage && nc.status !== 'Closed' && (
          <button className="btn-danger btn-sm ml-auto" onClick={handleEscalate} disabled={busy}>
            <TbAlertTriangle size={13} /> Escalate
          </button>
        )}
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-3.5 items-start">
        <div className="space-y-3.5">
          {/* NC Information */}
          <div className="card">
            <div className="card-title flex items-center gap-1.5 mb-3"><TbInfoCircle size={15} /> NC Information</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              <InfoField label="Line" value={nc.productionLine?.name} />
              <InfoField label="Model" value={nc.model?.name} />
              <InfoField label="Operation" value={nc.operation ? `OP ${nc.operation.opNumber} — ${nc.operation.name}` : '—'} />
              <InfoField label="Parameter" value={nc.parameter?.name} />
              <InfoField label="Specification" value={nc.specification} />
              <InfoField label="Actual Value" value={nc.actualValue} color="#DC2626" />
              <InfoField label="Detected by" value={nc.detectedByName ? `${nc.detectedByName}${nc.detectedBy?.role ? ` (${nc.detectedBy.role})` : ''}` : '—'} />
              <InfoField
                label="IPIR Reference"
                value={nc.inspectionEntry?.reportId}
                color="#675CE7"
                link={nc.inspectionEntry ? `/inspections/${nc.inspectionEntry._id}` : null}
              />
            </div>
            <div className="mt-3">
              <label className="field-label mb-1 block">Description</label>
              <textarea readOnly className="input bg-slate-50 dark:bg-slate-900 resize-none" rows={3} value={nc.description || ''} />
            </div>
          </div>

          {/* Root Cause */}
          <div className="card" id="root-cause">
            <div className="card-title flex items-center gap-1.5 mb-3"><TbSearch size={15} /> Root Cause Analysis</div>
            <label className="field-label mb-1.5 block">Severity</label>
            <div className="flex gap-1.5 mb-3.5 flex-wrap">
              {SEVERITIES.map((s) => {
                const style = SEV_STYLE[s];
                const active = severity === s;
                return (
                  <button
                    key={s}
                    disabled={!canManage}
                    onClick={() => setSeverity(s)}
                    className="px-3 py-1 rounded-full text-[11px] font-medium border transition-shadow"
                    style={{
                      borderColor: style.border, color: style.color, background: style.bg,
                      boxShadow: active ? `0 0 0 2px ${s === 'Critical' ? '#7f1d1d' : style.border}` : 'none',
                    }}
                  >
                    {s} {active && '✓'}
                  </button>
                );
              })}
            </div>
            <label className="field-label mb-1.5 block">Category</label>
            <input className="input mb-2.5" placeholder="e.g. Machine, Man, Method, Material" value={rcaCategory} onChange={(e) => setRcaCategory(e.target.value)} disabled={!canManage} />
            <label className="field-label mb-1.5 block">Root Cause Description</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Describe the confirmed root cause…"
              value={rcaDescription}
              onChange={(e) => setRcaDescription(e.target.value)}
              disabled={!canManage}
            />
            {canManage && (
              <button className="btn-primary btn-sm mt-2.5" onClick={handleSaveRootCause} disabled={busy}>Save Root Cause</button>
            )}
          </div>

          {/* Why-Why Analysis */}
          <div className="card" id="why-why">
            <div className="card-title flex items-center gap-1.5 mb-3"><TbListCheck size={15} /> Why-Why Analysis</div>
            <label className="field-label mb-1.5 block">5 Whys / Analysis</label>
            <textarea
              className="input resize-none"
              rows={4}
              placeholder="Document the iterative 'why' analysis here…"
              value={whyWhy}
              onChange={(e) => setWhyWhy(e.target.value)}
              disabled={!canManage}
            />
            {canManage && (
              <button className="btn-primary btn-sm mt-2.5" onClick={handleSaveWhyWhy} disabled={busy}>Save Why-Why</button>
            )}
          </div>

          {/* Corrective Action */}
          <div className="card" id="corrective-action">
            <div className="card-title flex items-center gap-1.5 mb-3"><TbTool size={15} /> Corrective Action</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label mb-1.5 block">Action</label>
                <input className="input" value={caDescription} onChange={(e) => setCaDescription(e.target.value)} disabled={!canManage} placeholder="e.g. Replace voltage regulator on WM-03" />
              </div>
              <div>
                <label className="field-label mb-1.5 block">Responsible</label>
                <input className="input" value={caOwner} onChange={(e) => setCaOwner(e.target.value)} disabled={!canManage} placeholder="e.g. Maintenance Team" />
              </div>
              <div>
                <label className="field-label mb-1.5 block">Target Date</label>
                <input type="date" className="input" value={caTargetDate} onChange={(e) => setCaTargetDate(e.target.value)} disabled={!canManage} />
              </div>
              <div>
                <label className="field-label mb-1.5 block">Status</label>
                <select className="select" value={caStatus} onChange={(e) => setCaStatus(e.target.value)} disabled={!canManage}>
                  <option>Not started</option>
                  <option>In progress</option>
                  <option>Completed</option>
                </select>
              </div>
            </div>
            {canManage && (
              <button className="btn-primary btn-sm mt-3" onClick={handleSaveCA} disabled={busy}>Save Changes</button>
            )}
          </div>

          {/* Comments */}
          <div className="card" id="history">
            <div className="card-title flex items-center gap-1.5 mb-3"><TbMessageCircle size={15} /> Comments</div>
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              {(nc.comments || []).map((c, i) => (
                <div key={i} className="flex gap-2 py-2">
                  <div className="w-7 h-7 rounded-full bg-light text-acc flex items-center justify-center text-[10px] font-medium shrink-0">
                    {(c.userName || 'U').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div>
                      <span className="text-[11px] font-medium text-ink dark:text-slate-100">{c.userName}</span>
                      <span className="text-[10px] text-muted ml-1.5">{new Date(c.at).toLocaleDateString('en-IN')} · {new Date(c.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[12px] text-ink dark:text-slate-200 mt-0.5">{c.text}</p>
                  </div>
                </div>
              ))}
              {(!nc.comments || nc.comments.length === 0) && <p className="text-xs text-muted py-3">No comments yet.</p>}
            </div>
            {canContribute && (
              <div className="flex gap-2 mt-2.5">
                <input
                  className="input flex-1"
                  placeholder="Add a comment…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <button className="btn-primary btn-sm shrink-0" onClick={handleAddComment} disabled={busy}>Post</button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3.5">
          {/* Workflow timeline */}
          <div className="card">
            <div className="card-title flex items-center gap-1.5 mb-3"><TbGitBranch size={15} /> Approval Workflow</div>
            <div className="flex flex-col">
              {(nc.timeline || []).map((t, i) => (
                <div key={i} className="flex gap-2.5 pb-3.5 last:pb-0 relative">
                  {i < nc.timeline.length - 1 && (
                    <div className="absolute left-[11px] top-[22px] bottom-0 w-px bg-border dark:bg-slate-700" />
                  )}
                  <TimelineDot status={t.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-ink dark:text-slate-100">{t.stage}</p>
                    <p className="text-[11px] text-muted mt-0.5">{t.by || (t.status === 'pending' ? 'Pending' : '')}{t.note ? ` — ${t.note}` : ''}</p>
                    {t.at && <p className="text-[10px] text-muted mt-0.5">{new Date(t.at).toLocaleDateString('en-IN')} · {new Date(t.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>}
                  </div>
                </div>
              ))}
            </div>
            {canManage && nc.status !== 'Closed' && (
              <div className="mt-3 pt-3 border-t border-border dark:border-slate-700">
                {nc.status === 'PendingApproval' ? (
                  canApproveClose && <button className="btn-primary w-full justify-center" onClick={handleApproveClose} disabled={busy}>Approve &amp; Close →</button>
                ) : (
                  <button className="btn-primary w-full justify-center" onClick={handleAdvance} disabled={busy}>Advance to QM Review →</button>
                )}
              </div>
            )}
          </div>

          {/* Impact assessment */}
          <div className="card">
            <div className="card-title flex items-center gap-1.5 mb-3"><TbChartBar size={15} /> Impact Assessment</div>
            <div className="flex flex-col gap-2">
              <ImpactRow label="Affected parts">
                <input
                  type="number"
                  className="input py-1 w-20 text-right"
                  value={nc.impact?.affectedParts ?? 0}
                  disabled={!canManage}
                  onChange={(e) => handleImpactChange('affectedParts', e.target.valueAsNumber || 0)}
                />
              </ImpactRow>
              <ImpactRow label="Batch">
                <input
                  className="input py-1 w-28 text-right"
                  value={nc.impact?.batch || ''}
                  disabled={!canManage}
                  onChange={(e) => handleImpactChange('batch', e.target.value)}
                />
              </ImpactRow>
              <ImpactRow label="Disposition">
                <select
                  className="select py-1 w-28"
                  value={nc.impact?.disposition || ''}
                  disabled={!canManage}
                  onChange={(e) => handleImpactChange('disposition', e.target.value)}
                >
                  <option value="">—</option>
                  <option>Rework</option><option>Scrap</option><option>Use-as-is</option>
                </select>
              </ImpactRow>
              <ImpactRow label="Machine halted">
                <ToggleYesNo value={nc.impact?.machineHalted} disabled={!canManage} onChange={(v) => handleImpactChange('machineHalted', v)} />
              </ImpactRow>
              <ImpactRow label="Customer notified">
                <ToggleYesNo value={nc.impact?.customerNotified} disabled={!canManage} onChange={(v) => handleImpactChange('customerNotified', v)} />
              </ImpactRow>
            </div>
          </div>

          {/* Attachments */}
          <div className="card">
            <div className="card-title flex items-center gap-1.5 mb-3"><TbPaperclip size={15} /> Attachments</div>
            <div className="flex flex-col gap-1.5">
              {(nc.attachments || []).map((a, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-md border border-border dark:border-slate-700 text-[12px]">
                  {a.filename.match(/\.pdf$/i) ? <TbFileTypePdf className="text-danger" size={15} /> : <TbPhoto className="text-acc" size={15} />}
                  <span className="flex-1 truncate">{a.filename}</span>
                  <a className="btn-outline btn-sm" href={a.url} target="_blank" rel="noreferrer"><TbDownload size={12} /></a>
                </div>
              ))}
              {(!nc.attachments || nc.attachments.length === 0) && <p className="text-xs text-muted">No attachments yet.</p>}
              {canContribute && <button className="btn-outline btn-sm justify-center mt-1" onClick={() => setAttachOpen(true)}><TbUpload size={13} /> Upload file</button>}
            </div>
          </div>
        </div>
      </div>

      {/* Parameter Master reference */}
      {params.length > 0 && (
        <>
          <div className="h-px bg-border dark:bg-slate-700 my-6" />
          <div className="text-[15px] font-medium text-nav dark:text-slate-100 mb-1.5 flex items-center gap-1.5">
            <TbListCheck size={17} /> Master Data — Parameter Configuration
          </div>
          <p className="text-[12px] text-muted mb-3">
            Configuration for {nc.model?.name} / OP {nc.operation?.opNumber} {nc.operation?.name} — changes propagate to every future inspection report automatically.
          </p>
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="card-title">Parameter Master — Model {nc.model?.name} / OP {nc.operation?.opNumber} {nc.operation?.name}</span>
              <Link to="/masters/parameters" className="btn-outline btn-sm">Open Parameter Master</Link>
            </div>
            <table className="master-table">
              <thead>
                <tr><th>SI No.</th><th>Parameter</th><th>Specification</th><th>Unit</th><th>Method</th><th>Type</th><th>Frequency</th><th>Active</th></tr>
              </thead>
              <tbody>
                {params.map((p) => (
                  <tr key={p._id} style={!p.active ? { opacity: 0.6 } : undefined}>
                    <td>{p.siNo}</td>
                    <td className="font-medium">{p.name}</td>
                    <td>{p.specification}</td>
                    <td>{p.unit}</td>
                    <td>{p.method}</td>
                    <td><span className="chip chip-pending">{p.type}</span></td>
                    <td>{p.frequency}</td>
                    <td><span className={`chip ${p.active ? 'chip-ok' : 'chip-gray'}`}>{p.active ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {canManage && <EditNCModal open={editOpen} onClose={() => setEditOpen(false)} nc={nc} onSaved={(updated) => { setNc(updated); setEditOpen(false); }} />}
      {canContribute && <AttachModal open={attachOpen} onClose={() => setAttachOpen(false)} onAttach={handleAttach} onUpload={async (file) => {
        // read file as data URL and send to backend upload endpoint
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const res = await ncApi.uploadAttachment(id, { filename: file.name, data: e.target.result });
            toast.success('Attachment uploaded.');
            setAttachOpen(false);
            load();
          } catch (err) {
            toast.error(getErrorMessage(err));
          }
        };
        reader.readAsDataURL(file);
      }} />}
    </div>
  );
}

function InfoField({ label, value, color, link }) {
  const content = <span className="text-[12px] font-medium" style={{ color: color || '#1B2622' }}>{value || '—'}</span>;
  return (
    <div className="flex flex-col gap-[3px]">
      <label className="field-label">{label}</label>
      {link ? <Link to={link} className="hover:underline">{content}</Link> : content}
    </div>
  );
}

function ImpactRow({ label, children }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-muted">{label}</span>
      {children}
    </div>
  );
}

function ToggleYesNo({ value, disabled, onChange }) {
  return (
    <div className="flex gap-1">
      <button
        disabled={disabled}
        onClick={() => onChange(true)}
        className={`px-2 py-0.5 rounded text-[11px] font-medium ${value ? 'bg-ok text-white' : 'bg-slate-100 dark:bg-slate-700 text-muted'}`}
      >Yes</button>
      <button
        disabled={disabled}
        onClick={() => onChange(false)}
        className={`px-2 py-0.5 rounded text-[11px] font-medium ${!value ? 'bg-danger text-white' : 'bg-slate-100 dark:bg-slate-700 text-muted'}`}
      >No</button>
    </div>
  );
}

function TimelineDot({ status }) {
  const style = {
    done: { bg: '#16A34A', color: '#fff', icon: TbCheck },
    active: { bg: '#675CE7', color: '#fff', icon: TbClock },
    pending: { bg: '#E2E8F0', color: '#64748B', icon: TbDots },
    reject: { bg: '#DC2626', color: '#fff', icon: TbXIcon },
  }[status] || { bg: '#E2E8F0', color: '#64748B', icon: TbDots };
  const Icon = style.icon;
  return (
    <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 z-10" style={{ background: style.bg, color: style.color }}>
      <Icon size={11} />
    </div>
  );
}

function EditNCModal({ open, onClose, nc, onSaved }) {
  const toast = useToast();
  const [description, setDescription] = useState('');
  const [specification, setSpecification] = useState('');
  const [actualValue, setActualValue] = useState('');
  const [shift, setShift] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (nc) {
      setDescription(nc.description || '');
      setSpecification(nc.specification || '');
      setActualValue(nc.actualValue || '');
      setShift(nc.shift || '');
    }
  }, [nc, open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await ncApi.update(nc._id, { description, specification, actualValue, shift });
      toast.success('Non-conformity updated.');
      onSaved(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit ${nc?.ncId || ''}`}
      footer={<><button className="btn-outline" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button></>}
    >
      <div className="space-y-3">
        <div><label className="label">Specification</label><input className="input" value={specification} onChange={(e) => setSpecification(e.target.value)} /></div>
        <div><label className="label">Actual Value</label><input className="input" value={actualValue} onChange={(e) => setActualValue(e.target.value)} /></div>
        <div><label className="label">Shift</label><input className="input" value={shift} onChange={(e) => setShift(e.target.value)} /></div>
        <div><label className="label">Description</label><textarea className="input resize-none" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      </div>
    </Modal>
  );
}

function AttachModal({ open, onClose, onAttach, onUpload }) {
  const [filename, setFilename] = useState('');
  const [url, setUrl] = useState('#');
  const [file, setFile] = useState(null);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Attachment"
      width={420}
      footer={<>
        <button className="btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={() => {
          if (file && typeof onUpload === 'function') {
            onUpload(file);
          } else if (file && typeof onAttach === 'function') {
            // fallback: pass file object to onAttach
            onAttach(file.name, '#');
          } else if (!file && filename) {
            onAttach(filename, url);
          }
          setFilename(''); setFile(null);
        }} disabled={!filename && !file}>Add</button>
      </>}
    >
      <p className="text-[12px] text-muted mb-3">
        This local demo stores attachment metadata only. In production, wire this to your file storage (S3, Azure Blob, etc.) and pass the resulting URL here. You can either enter a remote URL or upload a file from your device.
      </p>
      <label className="label">Upload file</label>
      <input className="input mb-3" type="file" onChange={(e) => { setFile(e.target.files[0]); setFilename(e.target.files[0]?.name || ''); }} />
      <div className="text-xs text-muted mb-3">Or provide a URL</div>
      <label className="label">File name</label>
      <input className="input mb-3" placeholder="e.g. WM03_ammeter_log.pdf" value={filename} onChange={(e) => setFilename(e.target.value)} />
      <label className="label">URL</label>
      <input className="input" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
    </Modal>
  );
}
