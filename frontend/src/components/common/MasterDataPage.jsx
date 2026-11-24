import React, { useEffect, useMemo, useState } from 'react';
import { TbPlus, TbSearch, TbEdit, TbTrash, TbDatabaseOff } from 'react-icons/tb';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import Loader from './Loader';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../api/axios';

/**
 * A fully generic master-data screen: search box, "+ New" button, table,
 * and a create/edit modal built from a field schema. Every admin master
 * page (Customer, Series, Model, Production Line, Operation, Parameter,
 * Users) is a thin wrapper around this component.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} props.description
 * @param {React.ComponentType} props.icon
 * @param {Object} props.api - { list, create, update, remove }
 * @param {Array} props.columns - [{ key, label, render(row) }]
 * @param {Array} props.fields - [{ name, label, type, required, options, placeholder, span }]
 * @param {Function} [props.transformSubmit] - (values) => payload sent to the API
 * @param {Function} [props.getInitialValues] - (row|null) => form values
 * @param {string} [props.newLabel]
 */
export default function MasterDataPage({
  title,
  description,
  icon: Icon,
  api,
  columns,
  fields,
  transformSubmit,
  getInitialValues,
  newLabel = 'New Record',
  extraHeaderContent = null,
  deleteMessage,
}) {
  const toast = useToast();
  const { hasRole } = useAuth();
  const canManage = hasRole('Admin', 'QualityManager');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.list(q ? { q } : undefined);
      setRows(res.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const openCreate = () => {
    setEditing(null);
    setValues(getInitialValues ? getInitialValues(null) : defaultValues(fields));
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setValues(getInitialValues ? getInitialValues(row) : hydrateValues(fields, row));
    setModalOpen(true);
  };

  const handleChange = (name, val) => setValues((v) => ({ ...v, [name]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = transformSubmit ? transformSubmit(values) : values;
      if (editing) {
        await api.update(editing._id, payload);
        toast.success('Record updated successfully.');
      } else {
        await api.create(payload);
        toast.success('Record created successfully.');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.remove(deleteTarget._id);
      toast.success('Record removed.');
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
          {Icon && (
            <div className="w-10 h-10 rounded-lg bg-light text-acc flex items-center justify-center shrink-0">
              <Icon size={20} />
            </div>
          )}
          <div>
            <h1 className="text-lg font-semibold text-ink">{title}</h1>
            {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {extraHeaderContent}
          {canManage && (
            <button className="btn-primary" onClick={openCreate}>
              <TbPlus size={15} /> {newLabel}
            </button>
          )}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-3 border-b border-border flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <TbSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" size={15} />
            <input
              className="input pl-8"
              placeholder="Search…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <span className="text-xs text-muted ml-auto">{rows.length} record{rows.length === 1 ? '' : 's'}</span>
        </div>

        <div className="overflow-x-auto scroll-thin">
          {loading ? (
            <div className="py-14"><Loader label="Loading records…" /></div>
          ) : rows.length === 0 ? (
            <div className="py-14 flex flex-col items-center gap-2 text-muted">
              <TbDatabaseOff size={26} />
              <p className="text-sm">No records found.</p>
            </div>
          ) : (
            <table className="master-table">
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c.key}>{c.label}</th>
                  ))}
                  {canManage && <th className="w-20 text-right pr-3">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row._id}>
                    {columns.map((c) => (
                      <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
                    ))}
                    {canManage && (
                      <td className="text-right pr-3">
                        <button className="text-muted hover:text-acc p-1.5 rounded hover:bg-light mr-1" onClick={() => openEdit(row)} title="Edit">
                          <TbEdit size={15} />
                        </button>
                        <button className="text-muted hover:text-danger p-1.5 rounded hover:bg-red-50" onClick={() => setDeleteTarget(row)} title="Delete">
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit ${title.replace(/s$/, '')}` : `New ${title.replace(/s$/, '')}`}
        footer={
          <>
            <button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" form="master-form" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <form id="master-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-3.5">
          {fields.map((f) => (
            <div key={f.name} className={f.span === 2 ? 'col-span-2' : 'col-span-1'}>
              <label className="label">
                {f.label} {f.required && <span className="text-danger">*</span>}
              </label>
              <FieldInput field={f} value={values[f.name]} onChange={(v) => handleChange(f.name, v)} />
              {f.hint && <p className="text-[11px] text-muted mt-1">{f.hint}</p>}
            </div>
          ))}
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete record?"
        message={deleteMessage || `This will permanently remove "${deleteTarget?.name || deleteTarget?.reportId || 'this record'}". This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}

function FieldInput({ field, value, onChange }) {
  const { type = 'text', options = [], placeholder, required, min, step } = field;

  if (type === 'select') {
    return (
      <select className="select" value={value ?? ''} onChange={(e) => onChange(e.target.value)} required={required}>
        <option value="" disabled>Select…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }

  if (type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 mt-1.5">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-acc" />
        <span className="text-[13px] text-muted">{field.checkboxLabel || 'Active'}</span>
      </label>
    );
  }

  if (type === 'textarea') {
    return (
      <textarea
        className="input"
        rows={3}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    );
  }

  return (
    <input
      className="input"
      type={type}
      placeholder={placeholder}
      value={value ?? ''}
      min={min}
      step={step}
      onChange={(e) => onChange(type === 'number' ? e.target.valueAsNumber : e.target.value)}
      required={required}
    />
  );
}

function defaultValues(fields) {
  const v = {};
  fields.forEach((f) => {
    v[f.name] = f.type === 'checkbox' ? true : '';
  });
  return v;
}

function hydrateValues(fields, row) {
  const v = {};
  fields.forEach((f) => {
    const raw = row[f.name];
    v[f.name] = raw && typeof raw === 'object' && raw._id ? raw._id : raw ?? (f.type === 'checkbox' ? true : '');
  });
  return v;
}
