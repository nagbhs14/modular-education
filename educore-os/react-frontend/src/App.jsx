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

  useEffect(() => {
    const host = window.location.hostname;
    let subdomain = null;
    if (host.includes('.')) {
      const parts = host.split('.');
      if (parts[0] !== 'www' && parts[0] !== 'localhost') subdomain = parts[0];
    }
    if (!subdomain) { setIsGlobal(true); setLoading(false); return; }

    // Set base URL for all API calls
    const apiBase = `http://${host}:3000`;
    axios.defaults.baseURL = apiBase;

    // Fetch tenant name
    axios.get(`http://localhost:3000/tenants/check/${subdomain}`)
      .then(r => setTenant(r.data))
      .catch(() => setTenant({ subdomain }));

    // Check stored tokens
    const adminToken = localStorage.getItem(`admin_token_${subdomain}`);
    const studentToken = localStorage.getItem(`student_token_${subdomain}`);
    const token = adminToken || studentToken;

    if (token) {
      try {
        const p = JSON.parse(atob(token.split('.')[1]));
        if (p.exp * 1000 < Date.now()) {
          localStorage.removeItem(`admin_token_${subdomain}`);
          localStorage.removeItem(`student_token_${subdomain}`);
        } else {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUser(p);
        }
      } catch(e) {
        localStorage.removeItem(`admin_token_${subdomain}`);
        localStorage.removeItem(`student_token_${subdomain}`);
      }
    }
    setLoading(false);
  }, []);

  const getSub = () => window.location.hostname.split('.')[0];

  const loginAdmin = (token) => {
    localStorage.setItem(`admin_token_${getSub()}`, token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const p = JSON.parse(atob(token.split('.')[1]));
    setUser(p);
  };

  const loginStudent = (token) => {
    localStorage.setItem(`student_token_${getSub()}`, token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const p = JSON.parse(atob(token.split('.')[1]));
    setUser(p);
  };

  const logout = () => {
    localStorage.removeItem(`admin_token_${getSub()}`);
    localStorage.removeItem(`student_token_${getSub()}`);
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f8fafc',fontFamily:"'Plus Jakarta Sans',sans-serif"}}><p style={{color:'#94a3b8'}}>Loading...</p></div>;
  if (isGlobal) return <GlobalLanding />;
  if (!tenant) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f8fafc'}}><div style={{textAlign:'center'}}><div style={{fontSize:'32px',fontWeight:700,color:'#dc2626'}}>404</div><p style={{color:'#64748b'}}>Institution not found</p></div></div>;

  return (
    <TenantContext.Provider value={tenant}>
      <AuthContext.Provider value={{ user, loginAdmin, loginStudent, logout }}>
        <Router>
          <Routes>
            <Route path="/" element={user && (user.role==='admin'||user.role==='teacher') ? <Navigate to="/admin" /> : <AdminLogin />} />
            <Route path="/student-login" element={user && user.role==='student' ? <Navigate to="/student" /> : <StudentLogin />} />
            <Route path="/admin/*" element={user && (user.role==='admin'||user.role==='teacher') ? <AdminDashboard /> : <Navigate to="/" />} />
            <Route path="/student/*" element={user && user.role==='student' ? <StudentDashboard /> : <Navigate to="/student-login" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthContext.Provider>
    </TenantContext.Provider>
  );
}

export default App;
