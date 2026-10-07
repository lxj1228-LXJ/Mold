import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import Molds from './pages/Molds';
import Maintenance from './pages/Maintenance';
import Repairs from './pages/Repairs';
import Parts from './pages/Parts';
import Alerts from './pages/Alerts';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/molds" element={<Molds />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/repairs" element={<Repairs />} />
        <Route path="/parts" element={<Parts />} />
        <Route path="/alerts" element={<Alerts />} />
      </Route>
    </Routes>
  );
}
