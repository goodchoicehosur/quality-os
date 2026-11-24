import React, { useState } from 'react';
import { TbUserCircle } from 'react-icons/tb';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import authApi from '../api/auth.api';
import { getErrorMessage } from '../api/axios';

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authApi.updateMe({ name, phone });
      setUser(res.data);
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fadeIn max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 rounded-full bg-light text-acc flex items-center justify-center text-lg font-medium shrink-0">
          {user?.initials}
        </div>
        <div>
          <h1 className="text-lg font-semibold text-ink dark:text-slate-100">{user?.name}</h1>
          <p className="text-xs text-muted mt-0.5">{user?.role} \u00b7 {user?.email}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-title flex items-center gap-1.5 mb-3"><TbUserCircle size={15} /> Profile Details</div>
        <form onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input bg-slate-50 dark:bg-slate-900" value={user?.email} disabled />
            <p className="text-[11px] text-muted mt-1">Contact an administrator to change your email address.</p>
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className="label">Role</label>
            <input className="input bg-slate-50 dark:bg-slate-900" value={user?.role} disabled />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </form>
      </div>
    </div>
  );
}
