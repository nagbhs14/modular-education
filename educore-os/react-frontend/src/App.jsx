import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Contexts
export const TenantContext = createContext();
export const AuthContext = createContext();

// Pages
import GlobalLanding from './pages/GlobalLanding';
import AdminLogin from './pages/AdminLogin';
import StudentLogin from './pages/StudentLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentDashboard from './pages/student/StudentDashboard';

function App() {
  const [tenant, setTenant] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGlobal, setIsGlobal] = useState(false);

  const determineTenant = async () => {
    const host = window.location.hostname;
    let subdomain = null;
    if (host.includes('.')) {
      const parts = host.split('.');
      if (parts[0] !== 'www' && parts[0] !== 'localhost') {
        subdomain = parts[0];
      }
    }

    if (!subdomain) {
      setIsGlobal(true);
      setLoading(false);
      return;
    }

    try {
      const apiUrl = `http://${host}:3000`;
      axios.defaults.baseURL = apiUrl;

      // Check which token exists
      const adminToken = localStorage.getItem(`admin_token_${subdomain}`);
      const studentToken = localStorage.getItem(`student_token_${subdomain}`);
      const token = adminToken || studentToken;

      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const userPayload = JSON.parse(atob(token.split('.')[1]));
        setUser({ ...userPayload, tokenType: adminToken ? 'admin' : 'student' });
      }

      setTenant({ subdomain });
    } catch(err) {
      console.error(err);
      setTenant(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    determineTenant();
  }, []);

  const loginAdmin = (token) => {
    const host = window.location.hostname;
    const sub = host.split('.')[0];
    localStorage.setItem(`admin_token_${sub}`, token);
    window.location.href = '/admin';
  };

  const loginStudent = (token) => {
    const host = window.location.hostname;
    const sub = host.split('.')[0];
    localStorage.setItem(`student_token_${sub}`, token);
    window.location.href = '/student';
  };

  const logout = () => {
    const host = window.location.hostname;
    const sub = host.split('.')[0];
    localStorage.removeItem(`admin_token_${sub}`);
    localStorage.removeItem(`student_token_${sub}`);
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c', color: '#e4e4e7', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>EDUCORE OS</div>
          <div style={{ color: '#71717a', fontSize: '13px' }}>Loading...</div>
        </div>
      </div>
    );
  }

  // Global landing (no subdomain)
  if (isGlobal) {
    return <GlobalLanding />;
  }

  // 404 — tenant not found
  if (!tenant) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c', color: '#e4e4e7', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', fontWeight: 800, color: '#ef4444' }}>404</div>
          <div style={{ color: '#71717a', marginTop: '8px' }}>Institution not found</div>
        </div>
      </div>
    );
  }

  return (
    <TenantContext.Provider value={tenant}>
      <AuthContext.Provider value={{ user, loginAdmin, loginStudent, logout }}>
        <Router>
          <Routes>
            {/* Admin login page */}
            <Route path="/" element={
              user && (user.role === 'admin' || user.role === 'teacher')
                ? <Navigate to="/admin" />
                : <AdminLogin />
            } />

            {/* Student login page */}
            <Route path="/student-login" element={
              user && user.role === 'student'
                ? <Navigate to="/student" />
                : <StudentLogin />
            } />

            {/* Admin dashboard (admin or teacher) */}
            <Route path="/admin/*" element={
              user && (user.role === 'admin' || user.role === 'teacher')
                ? <AdminDashboard />
                : <Navigate to="/" />
            } />

            {/* Student dashboard */}
            <Route path="/student/*" element={
              user && user.role === 'student'
                ? <StudentDashboard />
                : <Navigate to="/student-login" />
            } />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthContext.Provider>
    </TenantContext.Provider>
  );
}

export default App;
