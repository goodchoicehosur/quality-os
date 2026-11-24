import React, { useEffect, useState } from 'react';
import {
  TbTemplate, TbPlus, TbWand, TbEdit, TbTrash, TbGripVertical, TbChevronDown, TbChevronRight, TbX,
} from 'react-icons/tb';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Loader from '../components/common/Loader';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/axios';
import templatesApi from '../api/templates.api';
import customersApi from '../api/customers.api';
import linesApi from '../api/lines.api';
import modelsApi from '../api/models.api';
import operationsApi from '../api/operations.api';
import parametersApi from '../api/parameters.api';

export default function TemplateMaster() {
  const toast = useToast();
  const { hasRole } = useAuth();
  const canManage = hasRole('Admin', 'QualityManager');
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [lines, setLines] = useState([]);
  const [models, setModels] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [builderId, setBuilderId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await templatesApi.list();
      setTemplates(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    customersApi.list().then((r) => setCustomers(r.data));
    linesApi.list().then((r) => setLines(r.data));
    modelsApi.list().then((r) => setModels(r.data));
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await templatesApi.remove(deleteTarget._id);
      toast.success('Template deleted.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-light text-acc flex items-center justify-center shrink-0"><TbTemplate size={20} /></div>
          <div>
            <h1 className="text-lg font-semibold text-ink dark:text-slate-100">Inspection Templates</h1>
            <p className="text-xs text-muted mt-0.5">
              Defines the operations + parameters an Excel-replica inspection sheet is generated from. Nothing is hardcoded on the frontend.
            </p>
          </div>
        </div>
        {canManage && (
          <button className="btn-primary" onClick={() => setCreateOpen(true)}><TbPlus size={15} /> New Template</button>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto scroll-thin">
          {loading ? (
            <div className="py-14"><Loader label="Loading templates…" /></div>
          ) : templates.length === 0 ? (
            <div className="py-14 text-center text-muted text-sm">No templates yet. Create one to generate an inspection sheet.</div>
          ) : (
            <table className="master-table">
              <thead>
                <tr>
                  <th>Template Name</th><th>Customer</th><th>Line</th><th>Model</th>
                  <th>Operations</th><th>Parameters</th><th>Threshold</th>{canManage && <th className="text-right pr-3">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t._id}>
                    <td className="font-medium text-ink dark:text-slate-100">{t.name}</td>
                    <td>{t.customer?.name}</td>
                    <td>{t.productionLine?.name}</td>
                    <td>{t.model?.name}</td>
                    <td>{t.operations?.length || 0}</td>
                    <td>{t.operations?.reduce((s, o) => s + (o.parameters?.length || 0), 0) || 0}</td>
                    <td>{t.qualityThreshold}%</td>
                    {canManage && (
                      <td className="text-right pr-3">
                        <button className="text-muted hover:text-acc p-1.5 rounded hover:bg-light mr-1" onClick={() => setBuilderId(t._id)} title="Edit structure">
                          <TbEdit size={15} />
                        </button>
                        <button className="text-muted hover:text-danger p-1.5 rounded hover:bg-red-50" onClick={() => setDeleteTarget(t)} title="Delete">
                          <TbTrash size={15} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {canManage && (
        <CreateTemplateModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          customers={customers}
          lines={lines}
          models={models}
          onCreated={(id) => { setCreateOpen(false); load(); setBuilderId(id); }}
        />
      )}

      {canManage && builderId && (
        <TemplateBuilderModal
          templateId={builderId}
          onClose={() => setBuilderId(null)}
          onSaved={() => { setBuilderId(null); load(); }}
        />
      )}

      {canManage && (
        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleting}
          title="Delete template?"
          message={`"${deleteTarget?.name}" will be permanently removed. Existing inspection reports built from it are not affected.`}
          confirmLabel="Delete"
        />
      )}
    </div>
  );
}

function CreateTemplateModal({ open, onClose, customers, lines, models, onCreated }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [customer, setCustomer] = useState('');
  const [productionLine, setProductionLine] = useState('');
  const [model, setModel] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => { setName(''); setCustomer(''); setProductionLine(''); setModel(''); };

  const handleAutoBuild = async () => {
    if (!customer || !productionLine || !model) {
      toast.error('Select Customer, Production Line and Model first.');
      return;
    }
    setSaving(true);
    try {
      const res = await templatesApi.autoBuild({ name: name || undefined, customer, productionLine, model });
      toast.success('Template auto-built from Parameter Master.');
      reset();
      onCreated(res.data._id);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleEmpty = async () => {
    if (!customer || !productionLine || !model || !name) {
      toast.error('Fill in Name, Customer, Production Line and Model.');
      return;
    }
    setSaving(true);
    try {
      const res = await templatesApi.create({ name, customer, productionLine, model, operations: [] });
      toast.success('Empty template created — add operations in the builder.');
      reset();
      onCreated(res.data._id);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Inspection Template" width={480}>
      <div className="space-y-3.5">
        <div>
          <label className="label">Template Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. IPIR - FML-2 / U245 / Mahindra" />
        </div>
        <div>
          <label className="label">Customer</label>
          <select className="select" value={customer} onChange={(e) => setCustomer(e.target.value)}>
            <option value="">Select customer…</option>
            {customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Production Line</label>
          <select className="select" value={productionLine} onChange={(e) => setProductionLine(e.target.value)}>
            <option value="">Select production line…</option>
            {lines.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Model</label>
          <select className="select" value={model} onChange={(e) => setModel(e.target.value)}>
            <option value="">Select model…</option>
            {models.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
          </select>
        </div>

        <div className="pt-2 border-t border-border dark:border-slate-700 flex flex-col gap-2">
          <button className="btn-primary justify-center py-2.5" onClick={handleAutoBuild} disabled={saving}>
            <TbWand size={15} /> Auto-build from Parameter Master
          </button>
          <p className="text-[11px] text-muted -mt-1">Pulls every active parameter already configured for this Model and groups it by operation automatically.</p>
          <button className="btn-outline justify-center py-2" onClick={handleEmpty} disabled={saving}>
            Start with an empty template instead
          </button>
        </div>
      </div>
    </Modal>
  );
}

function TemplateBuilderModal({ templateId, onClose, onSaved }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState(null);
  const [operations, setOperations] = useState([]); // working copy: [{operation, sequence, parameters:[{parameter,siNo,...}]}]
  const [allOperations, setAllOperations] = useState([]);
  const [allParameters, setAllParameters] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [addOpId, setAddOpId] = useState('');

  useEffect(() => {
    Promise.all([templatesApi.get(templateId), operationsApi.list(), parametersApi.list()]).then(([t, ops, params]) => {
      setTemplate(t.data);
      setOperations(
        (t.data.operations || []).map((o) => ({
          operation: o.operation?._id || o.operation,
          operationLabel: o.operation ? `OP ${o.operation.opNumber} — ${o.operation.name}` : '',
          sequence: o.sequence,
          parameters: (o.parameters || []).map((p) => ({
            parameter: p.parameter?._id || p.parameter,
            parameterLabel: p.parameter?.name,
            siNo: p.siNo,
            specificationOverride: p.specificationOverride || '',
            unitOverride: p.unitOverride || '',
            methodOverride: p.methodOverride || '',
            baseSpec: p.parameter?.specification,
          })),
        }))
      );
      setAllOperations(ops.data);
      setAllParameters(params.data.filter((p) => String(p.model?._id || p.model) === String(t.data.model?._id || t.data.model)));
      setLoading(false);
    }).catch((err) => {
      toast.error(getErrorMessage(err));
      onClose();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  const toggleExpand = (idx) => setExpanded((e) => ({ ...e, [idx]: !e[idx] }));

  const addOperation = () => {
    if (!addOpId) return;
    const op = allOperations.find((o) => o._id === addOpId);
    if (!op) return;
    if (operations.some((o) => String(o.operation) === addOpId)) {
      toast.error('That operation is already part of this template.');
      return;
    }
    setOperations((prev) => [...prev, {
      operation: op._id,
      operationLabel: `OP ${op.opNumber} — ${op.name}`,
      sequence: prev.length + 1,
      parameters: [],
    }]);
    setAddOpId('');
  };

  const removeOperation = (idx) => setOperations((prev) => prev.filter((_, i) => i !== idx).map((o, i) => ({ ...o, sequence: i + 1 })));

  const addParameter = (opIdx, parameterId) => {
    if (!parameterId) return;
    const param = allParameters.find((p) => p._id === parameterId);
    if (!param) return;
    setOperations((prev) => prev.map((o, i) => {
      if (i !== opIdx) return o;
      if (o.parameters.some((p) => p.parameter === parameterId)) return o;
      return {
        ...o,
        parameters: [...o.parameters, {
          parameter: param._id,
          parameterLabel: param.name,
          siNo: o.parameters.length + 1,
          specificationOverride: '',
          unitOverride: '',
          methodOverride: '',
          baseSpec: param.specification,
        }],
      };
    }));
  };

  const removeParameter = (opIdx, pIdx) => {
    setOperations((prev) => prev.map((o, i) => {
      if (i !== opIdx) return o;
      return { ...o, parameters: o.parameters.filter((_, j) => j !== pIdx).map((p, j) => ({ ...p, siNo: j + 1 })) };
    }));
  };

  const updateOverride = (opIdx, pIdx, field, value) => {
    setOperations((prev) => prev.map((o, i) => {
      if (i !== opIdx) return o;
      return { ...o, parameters: o.parameters.map((p, j) => (j === pIdx ? { ...p, [field]: value } : p)) };
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await templatesApi.update(templateId, {
        operations: operations.map((o) => ({
          operation: o.operation,
          sequence: o.sequence,
          parameters: o.parameters.map((p) => ({
            parameter: p.parameter,
            siNo: p.siNo,
            specificationOverride: p.specificationOverride || undefined,
            unitOverride: p.unitOverride || undefined,
            methodOverride: p.methodOverride || undefined,
          })),
        })),
      });
      toast.success('Template structure saved.');
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={template ? `Edit Structure — ${template.name}` : 'Loading…'}
      width={760}
      footer={
        <>
          <button className="btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || loading}>{saving ? 'Saving…' : 'Save Template'}</button>
        </>
      }
    >
      {loading ? (
        <Loader label="Loading template…" />
      ) : (
        <div className="space-y-3">
          {operations.length === 0 && (
            <p className="text-sm text-muted py-4 text-center">No operations yet. Add one below to start building the sheet.</p>
          )}
          {operations.map((op, opIdx) => (
            <div key={op.operation} className="border border-border dark:border-slate-700 rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900">
                <TbGripVertical className="text-muted" size={15} />
                <button onClick={() => toggleExpand(opIdx)} className="text-muted">
                  {expanded[opIdx] ? <TbChevronDown size={15} /> : <TbChevronRight size={15} />}
                </button>
                <span className="text-[12px] font-medium text-ink dark:text-slate-100 flex-1">{op.operationLabel}</span>
                <span className="text-[11px] text-muted">{op.parameters.length} parameter{op.parameters.length === 1 ? '' : 's'}</span>
                <button className="text-muted hover:text-danger p-1" onClick={() => removeOperation(opIdx)}><TbTrash size={14} /></button>
              </div>

              {expanded[opIdx] && (
                <div className="p-3 space-y-2">
                  {op.parameters.map((p, pIdx) => (
                    <div key={p.parameter} className="grid grid-cols-12 gap-2 items-center bg-white dark:bg-slate-800 border border-border dark:border-slate-700 rounded-md px-2.5 py-2">
                      <span className="col-span-1 text-center text-muted text-[11px]">{p.siNo}</span>
                      <span className="col-span-3 text-[12px] font-medium text-ink dark:text-slate-100 truncate">{p.parameterLabel}</span>
                      <input
                        className="col-span-3 input py-1 text-[11px]"
                        placeholder={`Spec override (base: ${p.baseSpec || '—'})`}
                        value={p.specificationOverride}
                        onChange={(e) => updateOverride(opIdx, pIdx, 'specificationOverride', e.target.value)}
                      />
                      <input
                        className="col-span-2 input py-1 text-[11px]"
                        placeholder="Unit override"
                        value={p.unitOverride}
                        onChange={(e) => updateOverride(opIdx, pIdx, 'unitOverride', e.target.value)}
                      />
                      <input
                        className="col-span-2 input py-1 text-[11px]"
                        placeholder="Method override"
                        value={p.methodOverride}
                        onChange={(e) => updateOverride(opIdx, pIdx, 'methodOverride', e.target.value)}
                      />
                      <button className="col-span-1 text-muted hover:text-danger flex justify-center" onClick={() => removeParameter(opIdx, pIdx)}>
                        <TbX size={14} />
                      </button>
                    </div>
                  ))}

                  <select
                    className="select mt-1"
                    value=""
                    onChange={(e) => addParameter(opIdx, e.target.value)}
                  >
                    <option value="">+ Add parameter from Parameter Master…</option>
                    {allParameters
                      .filter((p) => !op.parameters.some((existing) => existing.parameter === p._id))
                      .map((p) => <option key={p._id} value={p._id}>{p.name} ({p.specification})</option>)}
                  </select>
                </div>
              )}
            </div>
          ))}

          <div className="flex items-center gap-2 pt-1">
            <select className="select flex-1" value={addOpId} onChange={(e) => setAddOpId(e.target.value)}>
              <option value="">Select an operation to add…</option>
              {allOperations
                .filter((o) => !operations.some((existing) => existing.operation === o._id))
                .map((o) => <option key={o._id} value={o._id}>OP {o.opNumber} — {o.name}</option>)}
            </select>
            <button className="btn-outline shrink-0" onClick={addOperation}><TbPlus size={14} /> Add Operation</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
