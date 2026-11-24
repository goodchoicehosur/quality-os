import React, { useState } from 'react';
import { TbSettings, TbMoon, TbSun, TbBell, TbLock, TbInfoCircle } from 'react-icons/tb';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import authApi from '../api/auth.api';
import { getErrorMessage } from '../api/axios';

const NOTIF_KEY = 'qos_notif_prefs';
const defaultPrefs = { criticalNC: true, dailySummary: true, submissionReminders: false, weeklyReport: true };

export default function Settings() {
  const { dark, toggle } = useTheme();
  const { user, setUser } = useAuth();
  const toast = useToast();

  const [prefs, setPrefs] = useState(() => {
    try { return { ...defaultPrefs, ...JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}') }; } catch { return defaultPrefs; }
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const togglePref = (key) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    try {
      const res = await authApi.updateMe({ password: newPassword });
      setUser(res.data);
      toast.success('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fadeIn max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-light text-acc flex items-center justify-center shrink-0"><TbSettings size={20} /></div>
        <div>
          <h1 className="text-lg font-semibold text-ink dark:text-slate-100">Settings</h1>
          <p className="text-xs text-muted mt-0.5">Personal preferences for your QualityOS session.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="card">
          <div className="card-title flex items-center gap-1.5 mb-3">{dark ? <TbMoon size={15} /> : <TbSun size={15} />} Appearance</div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-ink dark:text-slate-100">Dark mode</p>
              <p className="text-[11px] text-muted">Applies across the dashboard, admin pages, and reports.</p>
            </div>
            <Switch checked={dark} onChange={toggle} />
          </div>
        </div>

        <div className="card">
          <div className="card-title flex items-center gap-1.5 mb-3"><TbBell size={15} /> Notification Preferences</div>
          <div className="divide-y divide-slate-50 dark:divide-slate-700">
            {[
              { key: 'criticalNC', label: 'Critical non-conformity alerts', sub: 'Immediate notification when a Critical severity NC is raised.' },
              { key: 'dailySummary', label: 'Daily quality summary', sub: 'End-of-day rollup of quality % and NC counts across all lines.' },
              { key: 'submissionReminders', label: 'Pending submission reminders', sub: 'Reminder when an inspection is left in Draft for over 2 hours.' },
              { key: 'weeklyReport', label: 'Weekly report digest', sub: 'A Monday morning summary of the previous week\u2019s performance.' },
            ].map((p) => (
              <div key={p.key} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div>
                  <p className="text-[13px] text-ink dark:text-slate-100">{p.label}</p>
                  <p className="text-[11px] text-muted">{p.sub}</p>
                </div>
                <Switch checked={prefs[p.key]} onChange={() => togglePref(p.key)} />
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title flex items-center gap-1.5 mb-3"><TbLock size={15} /> Account Security</div>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="label">Current password</label>
              <input type="password" className="input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" />
            </div>
            <div>
              <label className="label">New password</label>
              <input type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Updating…' : 'Update Password'}</button>
          </form>
        </div>

        <div className="card">
          <div className="card-title flex items-center gap-1.5 mb-3"><TbInfoCircle size={15} /> System Information</div>
          <div className="grid grid-cols-2 gap-2.5 text-[12px]">
            <InfoRow label="Application" value="QualityOS v2.4.1" />
            <InfoRow label="Signed in as" value={`${user?.name} (${user?.role})`} />
            <InfoRow label="API endpoint" value={import.meta.env.VITE_API_URL || 'http://localhost:5000/api'} />
            <InfoRow label="Environment" value={import.meta.env.MODE} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Switch({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${checked ? 'bg-acc' : 'bg-slate-300 dark:bg-slate-600'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-muted text-[10px] uppercase tracking-wide font-medium">{label}</p>
      <p className="text-ink dark:text-slate-100 mt-0.5 truncate">{value}</p>
    </div>
  );
}
