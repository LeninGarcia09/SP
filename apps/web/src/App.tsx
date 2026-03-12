import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/shared/Layout';
import { DashboardPage } from './pages/Dashboard';
import { ProjectsPage } from './pages/Projects';
import { PersonnelPage } from './pages/Personnel';
import { InventoryPage } from './pages/Inventory';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/personnel" element={<PersonnelPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
      </Route>
    </Routes>
  );
}
