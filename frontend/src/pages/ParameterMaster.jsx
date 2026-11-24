import React, { useEffect, useState } from 'react';
import { TbListCheck } from 'react-icons/tb';
import MasterDataPage from '../components/common/MasterDataPage';
import parametersApi from '../api/parameters.api';
import operationsApi from '../api/operations.api';
import modelsApi from '../api/models.api';

export default function ParameterMaster() {
  const [operationOptions, setOperationOptions] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);

  useEffect(() => {
    operationsApi.list().then((res) => setOperationOptions(res.data.map((o) => ({ value: o._id, label: `OP ${o.opNumber} — ${o.name}` }))));
    modelsApi.list().then((res) => setModelOptions(res.data.map((m) => ({ value: m._id, label: m.name }))));
  }, []);

  const columns = [
    { key: 'siNo', label: 'SI No.', render: (r) => <span className="si-num">{r.siNo}</span> },
    { key: 'name', label: 'Parameter Name', render: (r) => <span className="font-medium text-ink dark:text-slate-100">{r.name}</span> },
    { key: 'specification', label: 'Specification' },
    { key: 'unit', label: 'Unit' },
    { key: 'method', label: 'Method' },
    {
      key: 'type', label: 'Type',
      render: (r) => <span className="chip chip-pending">{r.type}</span>,
    },
    { key: 'model', label: 'Model', render: (r) => r.model?.name || '—' },
    { key: 'operation', label: 'Operation', render: (r) => (r.operation ? `OP ${r.operation.opNumber} · ${r.operation.processName}` : '—') },
    { key: 'frequency', label: 'Frequency' },
    {
      key: 'active', label: 'Status',
      render: (r) => <span className={`chip ${r.active ? 'chip-ok' : 'chip-gray'}`}>{r.active ? 'Active' : 'Inactive'}</span>,
    },
  ];

  const fields = [
    { name: 'name', label: 'Parameter Name', required: true, placeholder: 'e.g. Weld Current' },
    { name: 'siNo', label: 'SI No.', type: 'number', required: true, min: 1 },
    { name: 'model', label: 'Model', type: 'select', required: true, options: modelOptions },
    { name: 'operation', label: 'Operation', type: 'select', required: true, options: operationOptions },
    { name: 'specification', label: 'Specification', required: true, placeholder: 'e.g. 17 ±1 KA' },
    { name: 'unit', label: 'Unit', placeholder: 'e.g. KA' },
    { name: 'method', label: 'Method', placeholder: 'e.g. Amp Meter' },
    { name: 'type', label: 'Type', type: 'select', options: [{ value: 'Process', label: 'Process' }, { value: 'Product', label: 'Product' }], required: true },
    { name: 'frequency', label: 'Frequency', placeholder: 'e.g. Every 2 hrs' },
    { name: 'active', label: 'Status', type: 'checkbox', checkboxLabel: 'Active' },
  ];

  return (
    <MasterDataPage
      title="Parameter Master"
      description="Inspection parameters (spec, unit, method, frequency) per model + operation. These populate every Excel-replica sheet automatically via Inspection Templates."
      icon={TbListCheck}
      api={parametersApi}
      columns={columns}
      fields={fields}
      newLabel="New Parameter"
    />
  );
}
