import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ProjectViewer from './pages/ProjectViewer';
import PitchPage from './pages/PitchPage';
import Calendar from './pages/Calendar';
import Jobs from './pages/Jobs';
import Home from './pages/Home';
import Proposals from './pages/Proposals';
import ProposalBuilder from './pages/ProposalBuilder';
import ProposalPublic from './pages/ProposalPublic';
import PdfSigner from './pages/PdfSigner';
import MaterialOrders from './pages/MaterialOrders';
import Performance from './pages/Performance';
import WorkOrders from './pages/WorkOrders';
import Invoices from './pages/Invoices';
import Contacts from './pages/Contacts';
import FileManager from './pages/FileManager';
import Catalog from './pages/Catalog';
import Automations from './pages/Automations';
import Communications from './pages/Communications';
import Settings from './pages/Settings';
import Payments from './pages/Payments';
import RoofrSites from './pages/RoofrSites';
import Jarvis from './pages/Jarvis';
import Pipeline from './pages/Pipeline';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pages with sidebar */}
        <Route element={<SidebarLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/measurements" element={<Dashboard />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/proposals" element={<Proposals />} />
          <Route path="/pdf-signer" element={<PdfSigner />} />
          <Route path="/material-orders" element={<MaterialOrders />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/work-orders" element={<WorkOrders />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/file-manager" element={<FileManager />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/automations" element={<Automations />} />
          <Route path="/communications" element={<Communications />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/jarvis" element={<Jarvis />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/roofr-sites" element={<RoofrSites />} />
        </Route>

        {/* Settings (full-screen, own sidebar) */}
        <Route path="/settings" element={<Settings />} />

        {/* Project viewer (full-screen, no sidebar) */}
        <Route path="/project/:id" element={<ProjectViewer />} />

        {/* Proposal builder (full-screen, no sidebar) */}
        <Route path="/proposals/new" element={<ProposalBuilder />} />
        <Route path="/proposals/edit/:id" element={<ProposalBuilder />} />

        {/* Public proposal page (homeowner view — no sidebar, no login) */}
        <Route path="/p/:id" element={<ProposalPublic />} />

        {/* Pitch tool (opens in separate tab) */}
        <Route path="/pitch" element={<PitchPage />} />
      </Routes>
    </BrowserRouter>
  );
}

function SidebarLayout() {
  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="layout-main">
        <Outlet />
      </div>
    </div>
  );
}

export default App;
