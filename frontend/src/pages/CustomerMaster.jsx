import React from 'react';
import { TbBriefcase } from 'react-icons/tb';
import MasterDataPage from '../components/common/MasterDataPage';
import customersApi from '../api/customers.api';

const columns = [
  { key: 'name', label: 'Customer Name', render: (r) => <span className="font-medium text-ink dark:text-slate-100">{r.name}</span> },
  { key: 'code', label: 'Code' },
  { key: 'contactPerson', label: 'Contact Person' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  {
    key: 'active',
    label: 'Status',
    render: (r) => (
      <span className={r.active ? 'badge-green' : 'badge-gray'} style={{ display: 'inline-block', padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 500, background: r.active ? '#F0FDF4' : '#F1F5F9', color: r.active ? '#166534' : '#475569' }}>
        {r.active ? 'Active' : 'Inactive'}
      </span>
    ),
  },
];

const fields = [
  { name: 'name', label: 'Customer Name', required: true, placeholder: 'e.g. Mahindra & Mahindra' },
  { name: 'code', label: 'Customer Code', required: true, placeholder: 'e.g. MAHM' },
  { name: 'contactPerson', label: 'Contact Person', placeholder: 'e.g. Suresh Kumar' },
  { name: 'email', label: 'Email', type: 'email', placeholder: 'contact@customer.com' },
  { name: 'phone', label: 'Phone', placeholder: '+91 98765 43210' },
  { name: 'address', label: 'Address', type: 'textarea', span: 2, placeholder: 'Registered address' },
  { name: 'active', label: 'Status', type: 'checkbox', checkboxLabel: 'Active' },
];

export default function CustomerMaster() {
  return (
    <MasterDataPage
      title="Customer Master"
      description="OEM customers this plant supplies to. Series and Models are grouped under a customer."
      icon={TbBriefcase}
      api={customersApi}
      columns={columns}
      fields={fields}
      newLabel="New Customer"
    />
  );
}
