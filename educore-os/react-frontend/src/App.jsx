import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

export const TenantContext = createContext();
export const AuthContext = createContext();

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

      // Fetch tenant info (public endpoint)
      let tenantInfo = { subdomain };
      try {
        const tRes = await axios.get(`http://localhost:3000/tenants/check/${subdomain}`);
        tenantInfo = tRes.data;
      } catch(e) { /* tenant might not exist yet */ }

      const adminToken = localStorage.getItem(`admin_token_${subdomain}`);
      const studentToken = localStorage.getItem(`student_token_${subdomain}`);
      const token = adminToken || studentToken;

      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const userPayload = JSON.parse(atob(token.split('.')[1]));
          // Check if token is expired
          if (userPayload.exp * 1000 < Date.now()) {
            localStorage.removeItem(`admin_token_${subdomain}`);
            localStorage.removeItem(`student_token_${subdomain}`);
          } else {
            setUser({ ...userPayload, tokenType: adminToken ? 'admin' : 'student' });
          }
        } catch(e) {
          localStorage.removeItem(`admin_token_${subdomain}`);
          localStorage.removeItem(`student_token_${subdomain}`);
        }
      }

      setTenant(tenantInfo);
    } catch(err) {
      console.error(err);
      setTenant(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { determineTenant(); }, []);

  const loginAdmin = (token) => {
    const sub = window.location.hostname.split('.')[0];
    localStorage.setItem(`admin_token_${sub}`, token);
    window.location.href = '/admin';
  };

  const loginStudent = (token) => {
    const sub = window.location.hostname.split('.')[0];
    localStorage.setItem(`student_token_${sub}`, token);
    window.location.href = '/student';
  };

  const logout = () => {
    const sub = window.location.hostname.split('.')[0];
    localStorage.removeItem(`admin_token_${sub}`);
    localStorage.removeItem(`student_token_${sub}`);
    delete axios.defaults.headers.common['Authorization'];
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', color: '#1a1a1a', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ color: '#9ca3af', fontSize: '13px' }}>Loading...</div>
      </div>
    );
  }

  if (isGlobal) return <GlobalLanding />;

  if (!tenant) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', color: '#1a1a1a', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', fontWeight: 700, color: '#dc2626' }}>404</div>
          <div style={{ color: '#6b7280', marginTop: '4px' }}>Institution not found</div>
        </div>
      </div>
    );
  }

  return (
    <TenantContext.Provider value={tenant}>
      <AuthContext.Provider value={{ user, loginAdmin, loginStudent, logout }}>
        <Router>
          <Routes>
            <Route path="/" element={
              user && (user.role === 'admin' || user.role === 'teacher') ? <Navigate to="/admin" /> : <AdminLogin />
            } />
            <Route path="/student-login" element={
              user && user.role === 'student' ? <Navigate to="/student" /> : <StudentLogin />
            } />
            <Route path="/admin/*" element={
              user && (user.role === 'admin' || user.role === 'teacher') ? <AdminDashboard /> : <Navigate to="/" />
            } />
            <Route path="/student/*" element={
              user && user.role === 'student' ? <StudentDashboard /> : <Navigate to="/student-login" />
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthContext.Provider>
    </TenantContext.Provider>
  );
}

export default App;
