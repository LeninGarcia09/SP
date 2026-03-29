import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/shared/Layout';
import { DashboardPage } from './pages/Dashboard';
import { ProjectsPage } from './pages/Projects';
import { ProjectDetailPage } from './pages/ProjectDetail';
import { PersonnelPage } from './pages/Personnel';
import { PersonnelDetailPage } from './pages/PersonnelDetail';
import { InventoryPage } from './pages/Inventory';
import { InventoryDetailPage } from './pages/InventoryDetail';
import { UsersPage } from './pages/Users';
import { ProgramsPage } from './pages/Programs';
import { ProgramDetailPage } from './pages/ProgramDetail';
import { OpportunitiesPage } from './pages/Opportunities';
import { OpportunityDetailPage } from './pages/OpportunityDetail';
import { AccountsPage } from './pages/Accounts';
import { AccountDetailPage } from './pages/AccountDetail';
import { ContactsPage } from './pages/Contacts';
import { ContactDetailPage } from './pages/ContactDetail';
import { PipelinesPage } from './pages/Pipelines';
import { SkillsPage } from './pages/Skills';
import { CapacityPlanningPage } from './pages/CapacityPlanning';
import { TrashPage } from './pages/Trash';
import { AdminPage } from './pages/Admin';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/programs" element={<ProgramsPage />} />
        <Route path="/programs/:id" element={<ProgramDetailPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/opportunities" element={<OpportunitiesPage />} />
        <Route path="/opportunities/:id" element={<OpportunityDetailPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/accounts/:id" element={<AccountDetailPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/contacts/:id" element={<ContactDetailPage />} />
        <Route path="/pipelines" element={<PipelinesPage />} />
        <Route path="/personnel" element={<PersonnelPage />} />
        <Route path="/personnel/:id" element={<PersonnelDetailPage />} />
        <Route path="/skills" element={<SkillsPage />} />
        <Route path="/capacity" element={<CapacityPlanningPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/inventory/:id" element={<InventoryDetailPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/trash" element={<TrashPage />} />
      </Route>
    </Routes>
  );
}
