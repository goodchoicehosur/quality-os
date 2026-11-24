import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TbShieldCheck, TbMail, TbLock, TbLoader2, TbBuildingFactory, TbClipboardCheck, TbChartBar } from 'react-icons/tb';
import { useAuth } from '../context/AuthContext';
import jbmLogo from '../assets/jbm-logo.png';
import downloadLogo from '../assets/download.jpg';

export default function Login() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('admin@qualityos.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname || '/dashboard'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);
    if (res.success) {
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen flex bg-qbg dark:bg-slate-900">
      {/* Branding panel */}
      <div className="login-brand hidden lg:flex w-[49%] relative overflow-hidden flex-col justify-between p-12 xl:p-16">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative">
            <div className="flex items-center gap-3 mb-8">
              <img src={jbmLogo} alt="JBM Logo" className="h-12 w-auto object-contain rounded-md bg-white/90 p-0.5" />
              <img src={downloadLogo} alt="NMPL Logo" className="h-12 w-auto object-contain rounded-md bg-white/90 p-0.5" />
            </div>
            <div className="flex items-center gap-2 text-white text-xl font-semibold">
              <TbShieldCheck size={26} />
              <span className="font-display tracking-tight">QualityOS</span>
            </div>
            <p className="text-white/45 text-[10px] uppercase tracking-[0.16em] mt-2">v2.4.1 · NMPL Production</p>
          </div>
        <div className="relative">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-display text-white text-4xl xl:text-[46px] font-medium leading-[1.12] tracking-[-0.05em] max-w-lg"
          >
            Digitizing the shop-floor inspection sheet — without changing how your Auditors work.
          </motion.h1>
          <p className="text-white/60 text-[14px] mt-5 max-w-md leading-relaxed">
            Every parameter, every shift, every corrective action — captured the moment it happens
            and rolled straight up into real-time quality intelligence.
          </p>

          <div className="flex gap-8 mt-12">
            {[
              { icon: TbBuildingFactory, label: 'Production Lines', value: '8' },
              { icon: TbClipboardCheck, label: 'Inspections / day', value: '120+' },
              { icon: TbChartBar, label: 'Avg. Quality', value: '94.7%' },
            ].map((s) => (
              <div key={s.label} className="text-white">
                <s.icon size={18} className="text-[#C4BCFF] mb-2" />
                <div className="font-display text-2xl font-semibold">{s.value}</div>
                <div className="text-white/50 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/35 text-xs">© {new Date().getFullYear()} QualityOS. Internal manufacturing use only.</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center bg-qbg dark:bg-slate-900 px-4 py-8 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="login-card w-full max-w-md rounded-[28px] border border-border bg-white/85 p-6 backdrop-blur sm:p-9 dark:border-slate-700 dark:bg-slate-800/90"
        >
          <div className="lg:hidden flex items-center gap-2 text-nav dark:text-white text-lg font-medium mb-8">
            <TbShieldCheck size={22} /> QualityOS
          </div>

          <p className="text-[10px] uppercase tracking-[0.18em] text-acc font-bold mb-3">Welcome back</p>
          <h2 className="font-display text-[27px] font-semibold tracking-tight text-ink dark:text-slate-100">Sign in to your account</h2>
          <p className="text-sm text-muted mt-2 mb-8">Enter your credentials to access the quality management system.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <TbMail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                <input
                  type="email"
                  required
                  className="input pl-9"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <TbLock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                <input
                  type="password"
                  required
                  className="input pl-9"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-[12px] text-danger bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full justify-center py-2.5 text-[13px]" disabled={submitting}>
              {submitting ? <TbLoader2 className="animate-spin" size={16} /> : null}
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-7 p-3.5 rounded-lg bg-light dark:bg-slate-800 border border-acc/20 dark:border-slate-700 text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed">
            <strong className="text-acc">Demo credentials</strong> (after running <code className="text-[11px]">npm run seed</code>):
            <br />Admin — admin@qualityos.local / Admin@12345
            <br />Auditor — priya.s@qualityos.local / Auditor@123
          </div>
        </motion.div>
      </div>
    </div>
  );
}
