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

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <header style={{ borderBottom: '1px solid #2a2a2e', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '32px', height: '32px', background: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#000', fontSize: '14px' }}>E</div>
        <span style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '1px', color: '#e4e4e7' }}>EDUCORE OS</span>
        <span style={{ color: '#2a2a2e', margin: '0 4px' }}>|</span>
        <span style={{ color: '#71717a', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student Portal</span>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#e4e4e7', marginBottom: '8px' }}>Student Login</h1>
            <p style={{ color: '#71717a', fontSize: '13px' }}>
              Institution: <span style={{ color: '#c084fc' }}>{tenant?.subdomain}</span>
            </p>
            <p style={{ color: '#3a3a3e', fontSize: '12px', marginTop: '4px' }}>Use the username and password provided by your teacher.</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ color: '#71717a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Username</label>
              <input className="field" value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
            </div>
            <div>
              <label style={{ color: '#71717a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Password</label>
              <input className="field" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: '13px' }}>{error}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px', background: '#c084fc', borderColor: '#c084fc' }}>Login</button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default StudentLogin;
