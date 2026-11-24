import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, matchPath } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const ROUTE_META = [
  { path: '/dashboard', title: 'Executive Dashboard', crumb: ['Home', 'Dashboard'] },
  { path: '/inspections', title: 'Daily Inspection', crumb: ['Home', 'Daily Inspection'] },
  { path: '/inspections/new', title: 'Start Inspection', crumb: ['Home', 'Daily Inspection', 'New'] },
  { path: '/inspections/:id', title: 'Inspection Entry', crumb: ['Home', 'Daily Inspection', 'IPIR'] },
  { path: '/nc', title: 'Non-Conformities', crumb: ['Home', 'Non-Conformities'] },
  { path: '/nc/:id', title: 'Non-Conformity Detail', crumb: ['Home', 'Non-Conformities', 'Detail'] },
  { path: '/analytics', title: 'Analytics', crumb: ['Home', 'Analytics'] },
  { path: '/reports/daily', title: 'Daily Report', crumb: ['Home', 'Reports', 'Daily Report'] },
  { path: '/reports/monthly', title: 'Monthly Report', crumb: ['Home', 'Reports', 'Monthly Report'] },
  { path: '/reports/pareto', title: 'Pareto Analysis', crumb: ['Home', 'Reports', 'Pareto Analysis'] },
  { path: '/masters/customers', title: 'Customer Master', crumb: ['Home', 'Master Data', 'Customers'] },
  { path: '/masters/series', title: 'Series Master', crumb: ['Home', 'Master Data', 'Series'] },
  { path: '/masters/production-lines', title: 'Production Line Master', crumb: ['Home', 'Master Data', 'Production Lines'] },
  { path: '/masters/models', title: 'Model Master', crumb: ['Home', 'Master Data', 'Models'] },
  { path: '/masters/operations', title: 'Process Master', crumb: ['Home', 'Master Data', 'Operations'] },
  { path: '/masters/parameters', title: 'Parameter Master', crumb: ['Home', 'Master Data', 'Parameters'] },
  { path: '/masters/templates', title: 'Inspection Templates', crumb: ['Home', 'Master Data', 'Templates'] },
  { path: '/users', title: 'User Management', crumb: ['Home', 'User Management'] },
  { path: '/settings', title: 'Settings', crumb: ['Home', 'Settings'] },
  { path: '/profile', title: 'My Profile', crumb: ['Home', 'My Profile'] },
];

function resolveMeta(pathname) {
  const match = ROUTE_META.find((r) => matchPath({ path: r.path, end: true }, pathname));
  return match || { title: 'QualityOS', crumb: ['Home'] };
}

export default function AppLayout() {
  const location = useLocation();
  const meta = resolveMeta(location.pathname);
  const isFullBleed = matchPath('/inspections/:id', location.pathname) || location.pathname === '/inspections/new';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const root = document.querySelector('.workspace-main');
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { root, rootMargin: '0px 0px -36px 0px', threshold: 0.08 });

    const observeTargets = (node) => {
      if (!(node instanceof Element)) return;
      if (node.matches('.card, .dashboard-hero')) {
        node.classList.add('scroll-reveal');
        observer.observe(node);
      }
      node.querySelectorAll('.card, .dashboard-hero').forEach((target) => {
        target.classList.add('scroll-reveal');
        observer.observe(target);
      });
    };

    observeTargets(root);
    const mutations = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach(observeTargets));
    });
    mutations.observe(root, { childList: true, subtree: true });

    return () => {
      mutations.disconnect();
      observer.disconnect();
    };
  }, [location.pathname, location.key]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-qbg dark:bg-slate-900">
      <div
        className={`fixed inset-0 z-30 bg-slate-950/60 transition-opacity duration-200 lg:hidden ${mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setMobileMenuOpen(false)}
      />
      <Sidebar mobile={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={meta.title} breadcrumb={meta.crumb} onMenuClick={() => setMobileMenuOpen(true)} />
        <main className={`workspace-main flex-1 overflow-y-auto scroll-thin ${isFullBleed ? '' : 'p-4 sm:p-7 xl:p-9'}`}>
          <div key={location.pathname} className="route-enter min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
