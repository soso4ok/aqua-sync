/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import ReportForm from './pages/ReportForm';
import Profile from './pages/Profile';
import ReportsHistory from './pages/ReportsHistory';
import Community from './pages/Community';
import Scan from './pages/Scan';
import Navigation from './components/Navigation';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Simple state persistence for demo purposes
  useEffect(() => {
    const onboarding = localStorage.getItem('onboarding_complete');
    if (onboarding) setHasCompletedOnboarding(true);
    
    const auth = localStorage.getItem('auth_token');
    if (auth) setIsAuthenticated(true);
  }, []);

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-data">
        <main className="flex-grow pb-24 md:pb-0 md:pl-20">
          <Routes>
            <Route 
              path="/" 
              element={!hasCompletedOnboarding ? <Navigate to="/onboarding" /> : <Navigate to="/home" />} 
            />
            <Route path="/onboarding" element={<Onboarding onComplete={() => setHasCompletedOnboarding(true)} />} />
            <Route path="/home" element={<Home />} />
            <Route path="/report" element={<ReportForm />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/history" element={<ReportsHistory />} />
            <Route path="/community" element={<Community />} />
            <Route path="/scan" element={<Scan />} />
          </Routes>
        </main>
        
        {hasCompletedOnboarding && <Navigation />}
      </div>
    </Router>
  );
}
