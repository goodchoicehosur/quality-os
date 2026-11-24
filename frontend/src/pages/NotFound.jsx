import React from 'react';
import { Link } from 'react-router-dom';
import { TbShieldCheck } from 'react-icons/tb';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-qbg px-6">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-light text-acc flex items-center justify-center mx-auto mb-4">
          <TbShieldCheck size={28} />
        </div>
        <h1 className="text-4xl font-semibold text-nav mb-2">404</h1>
        <p className="text-muted text-sm mb-6">This page doesn't exist, or you don't have access to it.</p>
        <Link to="/dashboard" className="btn-primary inline-flex">Back to Dashboard</Link>
      </div>
    </div>
  );
}
