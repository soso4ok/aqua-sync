import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MobileLayout from './components/MobileLayout';
import CameraView from './components/CameraView';
import ProfileView from './components/ProfileView';
import DetailView from './components/DetailView';
import ShopView from './components/ShopView';
import ConfirmationView from './components/ConfirmationView';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MobileLayout />}>
          <Route index element={<CameraView />} />
          <Route path="profile" element={<ProfileView />} />
        </Route>
        
        <Route path="/report/:id" element={<DetailView />} />
        <Route path="/shop" element={<ShopView />} />
        <Route path="/confirm" element={<ConfirmationView />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
