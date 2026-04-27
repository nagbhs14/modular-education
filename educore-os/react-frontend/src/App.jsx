import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Context
export const TenantContext = React.createContext();
export const AuthContext = React.createContext();

// Component Imports
import GlobalLanding from './pages/GlobalLanding';
import TenantPortal from './pages/TenantPortal';
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
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
      // In local dev, API is always on port 3000
      const apiUrl = `http://${host}:3000`;
      axios.defaults.baseURL = apiUrl;

      // To fetch tenant info before login, we probably need a public public endpoint
      // For now, if we have a token, we grab settings
      const token = localStorage.getItem(`token_${subdomain}`);
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const res = await axios.get('/api/settings');
        setTenant(res.data);
        
        // Also decode token or fetch user me
        // Simple mock decoding for prototype UI:
        const userPayload = JSON.parse(atob(token.split('.')[1]));
        setUser(userPayload);
      } else {
        // If no token, we just know the subdomain but need public settings
        setTenant({ subdomain });
      }
    } catch(err) {
      console.error(err);
      setTenant(null); // Tenant not found
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    determineTenant();
  }, []);

  const login = (token) => {
    const host = window.location.hostname;
    const sub = host.split('.')[0];
    localStorage.setItem(`token_${sub}`, token);
    window.location.reload();
  };

  const logout = () => {
    const host = window.location.hostname;
    const sub = host.split('.')[0];
    localStorage.removeItem(`token_${sub}`);
    window.location.reload();
  };

  if (loading) return <div>Loading EduCore OS...</div>;

  // Render Global Landing
  if (isGlobal) {
    return <GlobalLanding />;
  }

  // Render Tenant Route
  if (!tenant) return <div>404 - Institution Not Found</div>;

  return (
    <TenantContext.Provider value={tenant}>
      <AuthContext.Provider value={{ user, login, logout }}>
        <Router>
          <div className="app-container" style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
            <Routes>
              {!user ? (
                <Route path="*" element={<TenantPortal />} />
              ) : (
                <>
                  <Route path="/" element={
                    user.role === 'admin' ? <Navigate to="/admin" /> :
                    user.role === 'teacher' ? <Navigate to="/teacher" /> :
                    user.role === 'student' ? <Navigate to="/student" /> :
                    <Navigate to="/unauthorized" />
                  } />
                  
                  <Route path="/admin/*" element={user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
                  <Route path="/teacher/*" element={user.role === 'teacher' ? <TeacherDashboard /> : <Navigate to="/" />} />
                  <Route path="/student/*" element={user.role === 'student' ? <StudentDashboard /> : <Navigate to="/" />} />
                  
                  <Route path="/unauthorized" element={
                    <div className="flex flex-col items-center justify-center min-h-screen">
                      <h2 className="text-2xl font-bold mb-4">Unauthorized Access</h2>
                      <p className="text-slate-400 mb-6">You don't have permission to access this area or your role is unknown.</p>
                      <button onClick={logout} className="bg-purple-600 px-6 py-2 rounded-lg">Logout & Try Again</button>
                    </div>
                  } />
                  
                  <Route path="*" element={<Navigate to="/" />} />
                </>
              )}
            </Routes>
          </div>
        </Router>
      </AuthContext.Provider>
    </TenantContext.Provider>
  );
}

export default App;
