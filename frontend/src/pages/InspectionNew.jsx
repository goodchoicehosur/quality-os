import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TbClipboardCheck, TbArrowRight } from 'react-icons/tb';
import templatesApi from '../api/templates.api';
import inspectionsApi from '../api/inspections.api';
import usersApi from '../api/users.api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/axios';
import Loader from '../components/common/Loader';

export default function InspectionNew() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [templates, setTemplates] = useState([]);
  const [Auditors, setAuditors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [templateError, setTemplateError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [creating, setCreating] = useState(false);

  const [templateId, setTemplateId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [shift, setShift] = useState('');
  const [Auditor, setAuditor] = useState(user?._id || '');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setTemplateError('');

    templatesApi.list({ active: 'true' })
      .then((res) => {
        if (!active) return;
        setTemplates(res.data);
        setTemplateId(res.data[0]?._id || '');
        setShift(res.data[0]?.shifts?.[0]?.code || '');
      })
      .catch((err) => {
        if (active) setTemplateError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    usersApi.listInspectors()
      .then((res) => {
        if (active) setAuditors(res.data);
      })
      .catch((err) => {
        if (active) toast.error(`Could not load auditors: ${getErrorMessage(err)}`);
      });

    return () => { active = false; };
  }, [loadAttempt]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedTemplate = templates.find((t) => t._id === templateId);

  const handleCreate = async () => {
    if (!templateId || !date || !shift) {
      toast.error('Select a template, date and shift to continue.');
      return;
    }
    setCreating(true);
    try {
      const res = await inspectionsApi.create({ template: templateId, date, shift, Auditor: Auditor || undefined });
      toast.success(`${res.data.reportId} started.`);
      navigate(`/inspections/${res.data._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <Loader full label="Loading templates…" />;

  return (
    <div className="max-w-xl mx-auto animate-fadeIn">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-light text-acc flex items-center justify-center shrink-0"><TbClipboardCheck size={20} /></div>
        <div>
          <h1 className="text-lg font-semibold text-ink dark:text-slate-100">Start a New Inspection</h1>
          <p className="text-xs text-muted mt-0.5">The Excel-replica sheet is generated automatically from the template you select.</p>
        </div>
      </div>

      {templateError ? (
        <div className="card text-center py-10">
          <p className="text-sm text-danger font-medium mb-1">Could not load inspection templates.</p>
          <p className="text-xs text-muted mb-4">{templateError}</p>
          <button className="btn-primary mx-auto" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Retry</button>
        </div>
      ) : templates.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-sm text-ink dark:text-slate-100 font-medium mb-1">No active inspection templates found.</p>
          <p className="text-xs text-muted mb-4">An Admin or Quality Manager must create or activate a template in Master Data → Inspection Templates before an inspection can start.</p>
          <button className="btn-primary mx-auto" onClick={() => navigate('/masters/templates')}>Go to Inspection Templates</button>
        </div>
      ) : (
        <div className="card space-y-4">
          <div>
            <label className="label">Template</label>
            <select
              className="select"
              value={templateId}
              onChange={(e) => {
                setTemplateId(e.target.value);
                const t = templates.find((x) => x._id === e.target.value);
                setShift(t?.shifts?.[0]?.code || '');
              }}
            >
              {templates.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
            {selectedTemplate && (
              <p className="text-[11px] text-muted mt-1.5">
                {selectedTemplate.customer?.name} · {selectedTemplate.productionLine?.name} · {selectedTemplate.model?.name} ·{' '}
                {selectedTemplate.operations?.length || 0} operations · {selectedTemplate.operations?.reduce((s, o) => s + (o.parameters?.length || 0), 0) || 0} parameters
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="label">Shift</label>
              <select className="select" value={shift} onChange={(e) => setShift(e.target.value)}>
                {(selectedTemplate?.shifts || []).map((s) => (
                  <option key={s.code} value={s.code}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Auditor</label>
            <select className="select" value={Auditor} onChange={(e) => setAuditor(e.target.value)}>
              <option value="">Assign later</option>
              {Auditors.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
            </select>
          </div>

          <button className="btn-primary w-full justify-center py-2.5" onClick={handleCreate} disabled={creating}>
            {creating ? 'Generating sheet…' : 'Start Inspection'} <TbArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
