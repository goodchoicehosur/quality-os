import React from 'react';
import { TbUsers } from 'react-icons/tb';
import MasterDataPage from '../components/common/MasterDataPage';
import usersApi from '../api/users.api';

const ROLE_OPTIONS = [
  { value: 'Admin', label: 'Admin' },
  { value: 'QualityManager', label: 'Quality Manager' },
  { value: 'Supervisor', label: 'Supervisor' },
  { value: 'Auditor', label: 'Auditor' },
  { value: 'Viewer', label: 'Viewer' },
];

const ROLE_CHIP = {
  Admin: 'chip-nok',
  QualityManager: 'chip-warn',
  Supervisor: 'chip-prog',
  Auditor: 'chip-pending',
  Viewer: 'chip-gray',
};

const columns = [
  {
    key: 'name', label: 'Name',
    render: (r) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-light text-acc flex items-center justify-center text-[10px] font-medium shrink-0">{r.initials}</div>
        <span className="font-medium text-ink dark:text-slate-100">{r.name}</span>
      </div>
    ),
  },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role', render: (r) => <span className={`chip ${ROLE_CHIP[r.role] || 'chip-gray'}`}>{r.role}</span> },
  { key: 'phone', label: 'Phone' },
  {
    key: 'active', label: 'Status',
    render: (r) => <span className={`chip ${r.active ? 'chip-ok' : 'chip-gray'}`}>{r.active ? 'Active' : 'Inactive'}</span>,
  },
];

const fields = [
  { name: 'name', label: 'Full Name', required: true, placeholder: 'e.g. Priya Sundaram' },
  { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'name@company.com' },
  { name: 'role', label: 'Role', type: 'select', required: true, options: ROLE_OPTIONS },
  { name: 'phone', label: 'Phone', placeholder: '+91 98765 43210' },
  { name: 'password', label: 'Password', type: 'password', placeholder: 'Set password', hint: 'Leave blank when editing to keep the current password unchanged.' },
  { name: 'active', label: 'Status', type: 'checkbox', checkboxLabel: 'Active' },
];

export default function Users() {
  return (
    <MasterDataPage
      title="User Management"
      description="Admin: full access. Quality Manager: master data, inspections and NC approvals (no user admin). Supervisor: inspections and NC workflow. Auditor: submit inspections and add NC comments/attachments. Viewer: read-only."
      icon={TbUsers}
      api={usersApi}
      columns={columns}
      fields={fields}
      newLabel="New User"
      deleteMessage="This deactivates the user (their historical inspections and NCs are preserved). They can be reactivated later by editing the record."
    />
  );
}
