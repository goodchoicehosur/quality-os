import React from 'react';

const MAP = {
  // Inspection entry statuses
  Draft: 'chip-gray',
  InProgress: 'chip-prog',
  SubmittedForReview: 'chip-warn',
  Completed: 'chip-ok',
  Locked: 'chip-gray',
  // NC statuses
  Open: 'chip-nok',
  UnderCA: 'chip-warn',
  PendingApproval: 'chip-prog',
  Closed: 'chip-ok',
  // Severities
  Low: 'chip-gray',
  Medium: 'chip-warn',
  High: 'chip-nok',
  Critical: 'chip-nok',
  // Generic
  Active: 'chip-ok',
  Inactive: 'chip-gray',
  Alert: 'chip-nok',
  Idle: 'chip-gray',
};

const LABEL_OVERRIDES = {
  InProgress: 'In Progress',
  SubmittedForReview: 'Pending Review',
  UnderCA: 'Under CA',
  PendingApproval: 'Pending Approval',
};

export default function StatusChip({ value, className = '' }) {
  const cls = MAP[value] || 'chip-gray';
  return <span className={`${cls} ${className}`}>{LABEL_OVERRIDES[value] || value}</span>;
}
