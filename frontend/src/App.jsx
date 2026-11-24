import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import InspectionList from './pages/InspectionList';
import InspectionNew from './pages/InspectionNew';
import InspectionEntry from './pages/InspectionEntry';
import NCList from './pages/NCList';
import NCDetail from './pages/NCDetail';
import CustomerMaster from './pages/CustomerMaster';
import SeriesMaster from './pages/SeriesMaster';
import ModelMaster from './pages/ModelMaster';
import ProductionLineMaster from './pages/ProductionLineMaster';
import OperationMaster from './pages/OperationMaster';
import ParameterMaster from './pages/ParameterMaster';
import TemplateMaster from './pages/TemplateMaster';
import Users from './pages/Users';
import DailyReport from './pages/reports/DailyReport';
import MonthlyReport from './pages/reports/MonthlyReport';
import ParetoAnalysis from './pages/reports/ParetoAnalysis';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/inspections" element={<InspectionList />} />
        <Route
          path="/inspections/new"
          element={
            <ProtectedRoute roles={['Admin', 'QualityManager', 'Supervisor', 'Auditor']}>
              <InspectionNew />
            </ProtectedRoute>
          }
        />
        <Route path="/inspections/:id" element={<InspectionEntry />} />

        <Route path="/nc" element={<NCList />} />
        <Route path="/nc/:id" element={<NCDetail />} />

        <Route path="/analytics" element={<Analytics />} />

        <Route path="/reports/daily" element={<DailyReport />} />
        <Route path="/reports/monthly" element={<MonthlyReport />} />
        <Route path="/reports/pareto" element={<ParetoAnalysis />} />

        <Route path="/masters/customers" element={<CustomerMaster />} />
        <Route path="/masters/series" element={<SeriesMaster />} />
        <Route path="/masters/production-lines" element={<ProductionLineMaster />} />
        <Route path="/masters/models" element={<ModelMaster />} />
        <Route path="/masters/operations" element={<OperationMaster />} />
        <Route path="/masters/parameters" element={<ParameterMaster />} />
        <Route path="/masters/templates" element={<TemplateMaster />} />

        <Route
          path="/users"
          element={
            <ProtectedRoute roles={['Admin']}>
              <Users />
            </ProtectedRoute>
          }
        />

        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
