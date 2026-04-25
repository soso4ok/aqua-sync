/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Profile from './components/Profile';
import Settings from './components/Settings';
import { SearchProvider } from './context/SearchContext';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // Simple auth simulation
  const login = () => setIsAuthenticated(true);
  const logout = () => setIsAuthenticated(false);

  return (
    <SearchProvider>
      <Router>
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/" /> : <Login onLogin={login} />
          } />

          <Route path="/" element={
            isAuthenticated ? <Layout onLogout={logout} /> : <Navigate to="/login" />
          }>
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </SearchProvider>
  );
}

