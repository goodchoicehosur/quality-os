import React, { useEffect, useState } from 'react';
import { TbCube } from 'react-icons/tb';
import MasterDataPage from '../components/common/MasterDataPage';
import modelsApi from '../api/models.api';
import customersApi from '../api/customers.api';
import seriesApi from '../api/series.api';

export default function ModelMaster() {
  const [customerOptions, setCustomerOptions] = useState([]);
  const [seriesOptions, setSeriesOptions] = useState([]);

  useEffect(() => {
    customersApi.list().then((res) => setCustomerOptions(res.data.map((c) => ({ value: c._id, label: c.name }))));
    seriesApi.list().then((res) => setSeriesOptions(res.data.map((s) => ({ value: s._id, label: `${s.name} (${s.customer?.name || ''})` }))));
  }, []);

  const columns = [
    { key: 'name', label: 'Model', render: (r) => <span className="font-medium text-ink dark:text-slate-100">{r.name}</span> },
    { key: 'code', label: 'Code' },
    { key: 'customer', label: 'Customer', render: (r) => r.customer?.name || '—' },
    { key: 'series', label: 'Series', render: (r) => r.series?.name || '—' },
    {
      key: 'active', label: 'Status',
      render: (r) => <span className={`chip ${r.active ? 'chip-ok' : 'chip-gray'}`}>{r.active ? 'Active' : 'Inactive'}</span>,
    },
  ];

  const fields = [
    { name: 'name', label: 'Model Name', required: true, placeholder: 'e.g. U245' },
    { name: 'code', label: 'Model Code', required: true, placeholder: 'e.g. U245' },
    { name: 'customer', label: 'Customer', type: 'select', required: true, options: customerOptions },
    { name: 'series', label: 'Series', type: 'select', options: seriesOptions },
    { name: 'description', label: 'Description', type: 'textarea', span: 2 },
    { name: 'active', label: 'Status', type: 'checkbox', checkboxLabel: 'Active' },
  ];

  return (
    <MasterDataPage
      title="Model Master"
      description="Product / vehicle models inspected on the shop floor. Parameters and templates are built per model."
      icon={TbCube}
      api={modelsApi}
      columns={columns}
      fields={fields}
      newLabel="New Model"
    />
  );
}
