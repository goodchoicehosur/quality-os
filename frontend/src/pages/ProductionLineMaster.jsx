import React, { useEffect, useState } from 'react';
import { TbBuildingFactory } from 'react-icons/tb';
import MasterDataPage from '../components/common/MasterDataPage';
import linesApi from '../api/lines.api';
import modelsApi from '../api/models.api';

export default function ProductionLineMaster() {
  const [modelOptions, setModelOptions] = useState([]);

  useEffect(() => {
    modelsApi.list().then((res) => setModelOptions(res.data.map((m) => ({ value: m._id, label: m.name }))));
  }, []);

  const columns = [
    { key: 'name', label: 'Line', render: (r) => <span className="font-medium text-ink dark:text-slate-100">{r.name}</span> },
    { key: 'code', label: 'Code' },
    { key: 'defaultModel', label: 'Default Model', render: (r) => r.defaultModel?.name || '—' },
    { key: 'location', label: 'Location' },
    { key: 'description', label: 'Description' },
    {
      key: 'active', label: 'Status',
      render: (r) => <span className={`chip ${r.active ? 'chip-ok' : 'chip-gray'}`}>{r.active ? 'Active' : 'Inactive'}</span>,
    },
  ];

  const fields = [
    { name: 'name', label: 'Line Name', required: true, placeholder: 'e.g. FML-2' },
    { name: 'code', label: 'Line Code', required: true, placeholder: 'e.g. FML-2' },
    { name: 'defaultModel', label: 'Default Model', type: 'select', options: modelOptions },
    { name: 'location', label: 'Location', placeholder: 'e.g. Shop Floor A' },
    { name: 'description', label: 'Description', type: 'textarea', span: 2 },
    { name: 'active', label: 'Status', type: 'checkbox', checkboxLabel: 'Active' },
  ];

  return (
    <MasterDataPage
      title="Production Line Master"
      description="Physical production lines on the shop floor (FML-1, FML-2…). Inspection templates are scoped to a line + model."
      icon={TbBuildingFactory}
      api={linesApi}
      columns={columns}
      fields={fields}
      newLabel="New Production Line"
    />
  );
}
