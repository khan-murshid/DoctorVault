import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Patients } from './pages/Patients';
import { PatientProfile } from './pages/PatientProfile';
import { BedManagement } from './pages/BedManagement';
import { Doctors } from './pages/Doctors';
import { Families } from './pages/Families';
import { DischargeRecords } from './pages/DischargeRecords';
import { DrObvi } from './pages/DrObvi';


function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="patients" element={<Patients />} />
            <Route path="patients/:id" element={<PatientProfile />} />
            <Route path="beds" element={<BedManagement />} />
            <Route path="doctors" element={<Doctors />} />
            <Route path="families" element={<Families />} />
            <Route path="discharge" element={<DischargeRecords />} />
            <Route path="dr-obvi" element={<DrObvi />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
