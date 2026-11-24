import React, { useEffect, useState } from 'react';
import { TbListCheck } from 'react-icons/tb';
import MasterDataPage from '../components/common/MasterDataPage';
import seriesApi from '../api/series.api';
import customersApi from '../api/customers.api';

export default function SeriesMaster() {
  const [customerOptions, setCustomerOptions] = useState([]);

  useEffect(() => {
    customersApi.list().then((res) => {
      setCustomerOptions(res.data.map((c) => ({ value: c._id, label: `${c.name} (${c.code})` })));
    });
  }, []);

  const columns = [
    { key: 'name', label: 'Series Name', render: (r) => <span className="font-medium text-ink dark:text-slate-100">{r.name}</span> },
    { key: 'code', label: 'Code' },
    { key: 'customer', label: 'Customer', render: (r) => r.customer?.name || '—' },
    { key: 'description', label: 'Description' },
    {
      key: 'active', label: 'Status',
      render: (r) => <span className={`chip ${r.active ? 'chip-ok' : 'chip-gray'}`}>{r.active ? 'Active' : 'Inactive'}</span>,
    },
  ];

  const fields = [
    { name: 'name', label: 'Series Name', required: true, placeholder: 'e.g. U-Series' },
    { name: 'code', label: 'Series Code', required: true, placeholder: 'e.g. U-SERIES' },
    { name: 'customer', label: 'Customer', type: 'select', required: true, options: customerOptions },
    { name: 'description', label: 'Description', type: 'textarea', span: 2 },
    { name: 'active', label: 'Status', type: 'checkbox', checkboxLabel: 'Active' },
  ];

  return (
    <MasterDataPage
      title="Series Master"
      description="Vehicle / part series grouped under each customer, e.g. Mahindra's U-Series."
      icon={TbListCheck}
      api={seriesApi}
      columns={columns}
      fields={fields}
      newLabel="New Series"
    />
  );
}
