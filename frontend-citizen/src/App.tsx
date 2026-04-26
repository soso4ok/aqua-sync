import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MobileLayout from './components/MobileLayout';
import CameraView from './components/CameraView';
import ProfileView from './components/ProfileView';
import DetailView from './components/DetailView';
import ShopView from './components/ShopView';
import LoginView from './components/LoginView';
import ConfirmationView from './components/ConfirmationView';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-data-white">
        <Loader2 className="w-8 h-8 animate-spin text-galileo-teal" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-data-white">
        <Loader2 className="w-8 h-8 animate-spin text-galileo-teal" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginView />}
      />

      {/* Protected */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MobileLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CameraView />} />
        <Route path="profile" element={<ProfileView />} />
      </Route>

      <Route path="/report/:id" element={<ProtectedRoute><DetailView /></ProtectedRoute>} />
      <Route path="/shop" element={<ProtectedRoute><ShopView /></ProtectedRoute>} />
      <Route path="/confirm" element={<ProtectedRoute><ConfirmationView /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
