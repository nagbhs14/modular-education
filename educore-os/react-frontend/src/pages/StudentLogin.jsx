import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext, TenantContext } from '../App';

const StudentLogin = () => {
  const { loginStudent } = useContext(AuthContext);
  const tenant = useContext(TenantContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/api/auth/student-login', { username, password });
      loginStudent(res.data.token);
    } catch(err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    }
  };

  const displayName = tenant?.name || tenant?.subdomain || 'Institution';

  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <header style={{ borderBottom: '1px solid #e5e7eb', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '28px', height: '28px', background: '#7c3aed', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '13px' }}>{displayName.charAt(0)}</div>
        <span style={{ fontWeight: 600, fontSize: '15px', color: '#111827' }}>{displayName}</span>
        <span style={{ color: '#d1d5db' }}>·</span>
        <span style={{ color: '#6b7280', fontSize: '12px' }}>Student Portal</span>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '340px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '4px', color: '#111827' }}>Student Login</h1>
          <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '28px' }}>Use the username and password given by your teacher.</p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 500, color: '#374151' }}>Username</label>
              <input className="field" value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 500, color: '#374151' }}>Password</label>
              <input className="field" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <p style={{ color: '#dc2626', fontSize: '13px' }}>{error}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '4px', background: '#7c3aed' }}>Login</button>
          </form>
        </div>
      </main>

      <footer style={{ borderTop: '1px solid #e5e7eb', padding: '14px 32px', textAlign: 'center', color: '#9ca3af', fontSize: '11px' }}>
        Powered by EduCore
      </footer>
    </div>
  );
};

export default StudentLogin;
