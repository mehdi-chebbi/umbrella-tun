import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import NDTTunisie from './pages/NDTTunisie';
import Geoportail from './pages/Geoportail';
import TableauDeBord from './pages/TableauDeBord';
import SuccessStories from './pages/SuccessStories';
import Resources from './pages/Resources';
import Apercu from './pages/Apercu';
import TableauDeBordNDT from './pages/TableauDeBordNDT';
import AdminLogin from './pages/admin/Login';
import AdminLayout from './pages/admin/Layout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminLayers from './pages/admin/Layers';
import AdminClips from './pages/admin/Clips';
import ProtectedRoute from './components/ProtectedRoute';
import ChatAgent from './components/ChatAgent';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <>
    <ScrollToTop />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/ndt-en-tunisie" element={<NDTTunisie />} />
      <Route path="/geoportail" element={<Geoportail />} />
      <Route path="/apercu" element={<Apercu />} />
      <Route path="/tableau-de-bord" element={<TableauDeBord />} />
      <Route path="/tableau-de-bord-ndt" element={<TableauDeBordNDT />} />
      <Route path="/acquis-et-success-stories" element={<SuccessStories />} />
      <Route path="/ressources" element={<Resources />} />
      <Route path="/admin/connexion" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin" replace />} />
        <Route path="" element={<AdminDashboard />} />
        <Route path="utilisateurs" element={<AdminUsers />} />
        <Route path="couches" element={<AdminLayers />} />
        <Route path="decoupages" element={<AdminClips />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <ChatAgent />
    </>
  );
}

export default App;
