import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  TbShieldCheck, TbLayoutDashboard, TbClipboardCheck, TbAlertTriangle, TbChartBar,
  TbFileDescription, TbReport, TbChartDots, TbBuildingFactory, TbCube, TbTool,
  TbListCheck, TbUsers, TbSettings, TbUserCircle, TbTemplate, TbBriefcase, TbX,
} from 'react-icons/tb';
import jbmLogo from '../../assets/jbm-logo.png';
import downloadLogo from '../../assets/download.jpg';
import dashboardApi from '../../api/dashboard.api';
import ncApi from '../../api/nc.api';
import { useAuth } from '../../context/AuthContext';

const linkBase =
  'sidebar-link flex items-center gap-3 rounded-xl mx-2 px-3.5 py-2.5 text-[13px] font-medium transition-all duration-150 text-white/70 hover:bg-white/10 hover:text-white';
const linkActive = 'sidebar-link-active';

function NavItem({ to, icon: Icon, children, badge, onClick }) {
  return (
    <NavLink to={to} onClick={onClick} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}>
      <Icon size={16} className="shrink-0" />
      <span className="flex-1 truncate">{children}</span>
      {badge > 0 && (
        <span className="ml-auto bg-danger text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">{badge}</span>
      )}
    </NavLink>
  );
}

function NavLabel({ children }) {
  return <div className="text-white/35 text-[10px] font-semibold tracking-[0.16em] px-4 pt-5 pb-2 uppercase">{children}</div>;
}

export default function Sidebar({ mobile = false, onClose }) {
  const { hasRole } = useAuth();
  const [pendingInspections, setPendingInspections] = useState(0);
  const [openNC, setOpenNC] = useState(0);

  useEffect(() => {
    dashboardApi.overview().then((res) => setPendingInspections(res.data.pendingInspections)).catch(() => {});
    ncApi.list({ status: 'Open' }).then((res) => setOpenNC(res.count)).catch(() => {});
  }, []);

  return (
    <aside className={`flex h-full flex-col overflow-y-auto scroll-thin bg-nav no-print ${mobile ? 'fixed inset-y-0 left-0 z-40 w-[84vw] max-w-[280px] shadow-2xl' : 'hidden lg:flex lg:w-[248px] lg:min-w-[248px]'}`}>
      <div className="sidebar-brand flex items-center justify-between px-5 pt-6 pb-5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <img src={jbmLogo} alt="JBM Logo" className="h-9 w-auto object-contain rounded-md bg-white/90 p-0.5" />
            <img src={downloadLogo} alt="NMPL Logo" className="h-9 w-auto object-contain rounded-md bg-white/90 p-0.5" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-white">
            <TbShieldCheck size={18} className="text-[#C4BCFF]" />
            <span className="font-display text-[17px] font-semibold tracking-tight">QualityOS</span>
          </div>
          <div className="text-white/40 text-[10px] mt-1 tracking-wide">NMPL · QUALITY OPERATIONS</div>
        </div>
        {mobile && (
          <button type="button" onClick={onClose} className="rounded-md p-2 text-white/80 hover:bg-white/10 hover:text-white lg:hidden" aria-label="Close menu">
            <TbX size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 py-2.5">
        <NavItem to="/dashboard" icon={TbLayoutDashboard} onClick={onClose}>Dashboard</NavItem>

        <NavLabel>Inspection</NavLabel>
        <NavItem to="/inspections" icon={TbClipboardCheck} badge={pendingInspections} onClick={onClose}>Daily Inspection</NavItem>
        <NavItem to="/nc" icon={TbAlertTriangle} badge={openNC} onClick={onClose}>Non-Conformities</NavItem>
        <NavItem to="/analytics" icon={TbChartBar} onClick={onClose}>Analytics</NavItem>

        <NavLabel>Reports</NavLabel>
        <NavItem to="/reports/daily" icon={TbFileDescription} onClick={onClose}>Daily Report</NavItem>
        <NavItem to="/reports/monthly" icon={TbReport} onClick={onClose}>Monthly Report</NavItem>
        <NavItem to="/reports/pareto" icon={TbChartDots} onClick={onClose}>Pareto Analysis</NavItem>

        <NavLabel>Master Data</NavLabel>
        <NavItem to="/masters/customers" icon={TbBriefcase} onClick={onClose}>Customer Master</NavItem>
        <NavItem to="/masters/series" icon={TbListCheck} onClick={onClose}>Series Master</NavItem>
        <NavItem to="/masters/production-lines" icon={TbBuildingFactory} onClick={onClose}>Production Lines</NavItem>
        <NavItem to="/masters/models" icon={TbCube} onClick={onClose}>Model Master</NavItem>
        <NavItem to="/masters/operations" icon={TbTool} onClick={onClose}>Process Master</NavItem>
        <NavItem to="/masters/parameters" icon={TbListCheck} onClick={onClose}>Parameter Master</NavItem>
        <NavItem to="/masters/templates" icon={TbTemplate} onClick={onClose}>Inspection Templates</NavItem>
        {hasRole('Admin') && <NavItem to="/users" icon={TbUsers} onClick={onClose}>User Management</NavItem>}

        <NavLabel>System</NavLabel>
        <NavItem to="/settings" icon={TbSettings} onClick={onClose}>Settings</NavItem>
        <NavItem to="/profile" icon={TbUserCircle} onClick={onClose}>My Profile</NavItem>
      </nav>
    </aside>
  );
}
