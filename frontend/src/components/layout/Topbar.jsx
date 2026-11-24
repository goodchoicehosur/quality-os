import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  TbSearch, TbBell, TbPlus, TbSun, TbMoon, TbLogout, TbUserCircle, TbSettings, TbAlertTriangle, TbMenu2,
} from 'react-icons/tb';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ncApi from '../../api/nc.api';

export default function Topbar({ title, breadcrumb, onMenuClick }) {
  const { user, logout, hasRole } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    ncApi.list({ status: 'Open', limit: 6 }).then((res) => setAlerts(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <header className="relative z-30 h-auto min-h-[76px] bg-card/90 dark:bg-slate-800 border-b border-border dark:border-slate-700 flex items-center gap-4 px-4 py-3.5 sm:px-7 shrink-0 no-print backdrop-blur">
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-slate-50 text-muted hover:text-ink dark:border-slate-700 dark:bg-slate-900 dark:hover:text-white"
        aria-label="Open navigation"
      >
        <TbMenu2 size={18} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="font-display text-[16px] font-semibold text-ink dark:text-slate-100 leading-tight truncate">{title}</div>
        {breadcrumb && (
          <div className="text-[11px] text-muted leading-tight mt-1 truncate">
            {breadcrumb.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && ' / '}
                {i === breadcrumb.length - 1 ? <span className="text-acc font-medium">{b}</span> : b}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto shrink-0">
        <div className="hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-border dark:border-slate-700 rounded-xl px-3 py-2 text-[12px] text-muted w-44">
          <TbSearch size={14} />
          <span>Search…</span>
        </div>

        <button
          onClick={toggle}
          className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border dark:border-slate-700 flex items-center justify-center text-muted hover:text-ink dark:hover:text-white"
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <TbSun size={15} /> : <TbMoon size={15} />}
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border dark:border-slate-700 flex items-center justify-center text-muted hover:text-ink dark:hover:text-white relative"
          >
            <TbBell size={15} />
            {alerts.length > 0 && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-danger rounded-full" />}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg shadow-popover z-40 overflow-hidden"
              >
                <div className="px-3.5 py-2.5 border-b border-border dark:border-slate-700 text-[13px] font-medium text-ink dark:text-slate-100">
                  Open Non-Conformities
                </div>
                <div className="max-h-72 overflow-y-auto scroll-thin">
                  {alerts.length === 0 ? (
                    <p className="text-xs text-muted px-3.5 py-4">You're all caught up — no open NCs.</p>
                  ) : (
                    alerts.map((a) => (
                      <button
                        key={a._id}
                        onClick={() => { setNotifOpen(false); navigate(`/nc/${a._id}`); }}
                        className="w-full text-left px-3.5 py-2.5 border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-start gap-2"
                      >
                        <TbAlertTriangle size={15} className="text-danger mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[12px] font-medium text-ink dark:text-slate-100">{a.ncId}</p>
                          <p className="text-[11px] text-muted truncate">{a.productionLine?.name} · {a.parameter?.name}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <button
                  onClick={() => { setNotifOpen(false); navigate('/nc'); }}
                  className="w-full text-center py-2 text-[12px] text-acc font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  View all non-conformities
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {hasRole('Admin', 'QualityManager', 'Supervisor', 'Auditor') && (
          <button className="btn-primary btn-sm shrink-0" onClick={() => navigate('/inspections/new')}>
            <TbPlus size={14} /> <span className="hidden sm:inline">New Inspection</span><span className="sm:hidden">New</span>
          </button>
        )}

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="w-10 h-10 rounded-full bg-[#E8ECDD] text-[#3D6449] flex items-center justify-center text-[11px] font-bold"
          >
            {user?.initials || 'U'}
          </button>
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg shadow-popover z-40 overflow-hidden"
              >
                <div className="px-3.5 py-3 border-b border-border dark:border-slate-700">
                  <p className="text-[13px] font-medium text-ink dark:text-slate-100">{user?.name}</p>
                  <p className="text-[11px] text-muted">{user?.role} · {user?.email}</p>
                </div>
                <button
                  onClick={() => { setProfileOpen(false); navigate('/profile'); }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-[12px] text-ink dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <TbUserCircle size={15} /> My Profile
                </button>
                <button
                  onClick={() => { setProfileOpen(false); navigate('/settings'); }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-[12px] text-ink dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <TbSettings size={15} /> Settings
                </button>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-[12px] text-danger hover:bg-red-50 dark:hover:bg-red-950/40 border-t border-border dark:border-slate-700"
                >
                  <TbLogout size={15} /> Log out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
