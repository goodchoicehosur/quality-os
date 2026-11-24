import React from 'react';
import { TbTool } from 'react-icons/tb';
import MasterDataPage from '../components/common/MasterDataPage';
import operationsApi from '../api/operations.api';

const columns = [
  { key: 'opNumber', label: 'OP No.', render: (r) => <span className="op-num">{r.opNumber}</span> },
  { key: 'name', label: 'Operation Name', render: (r) => <span className="font-medium text-ink dark:text-slate-100">{r.name}</span> },
  { key: 'processName', label: 'Process Badge', render: (r) => <span className="proc-badge">{r.processName}</span> },
  { key: 'description', label: 'Description' },
  {
    key: 'active', label: 'Status',
    render: (r) => <span className={`chip ${r.active ? 'chip-ok' : 'chip-gray'}`}>{r.active ? 'Active' : 'Inactive'}</span>,
  },
];

const fields = [
  { name: 'opNumber', label: 'OP Number', type: 'number', required: true, placeholder: 'e.g. 20', min: 1 },
  { name: 'name', label: 'Operation Name', required: true, placeholder: 'e.g. Outer Spot Welding' },
  { name: 'processName', label: 'Process Badge Label', required: true, placeholder: 'e.g. Spot Weld' },
  { name: 'description', label: 'Description', type: 'textarea', span: 2 },
  { name: 'active', label: 'Status', type: 'checkbox', checkboxLabel: 'Active' },
];

export default function OperationMaster() {
  return (
    <MasterDataPage
      title="Process Master"
      description="Manufacturing operations / stations (OP 20, OP 30…) that inspection parameters are attached to."
      icon={TbTool}
      api={operationsApi}
      columns={columns}
      fields={fields}
      newLabel="New Operation"
    />
  );
}
