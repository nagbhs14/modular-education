import React, { useState } from 'react';
import axios from 'axios';

const GlobalLanding = () => {
  const [view, setView] = useState('home'); // home | register | login
  const [form, setForm] = useState({ name: '', subdomain: '', adminName: '', adminUsername: '', adminPassword: '' });
  const [loginSub, setLoginSub] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setMessage(''); setResult(null);
    try {
      const res = await axios.post('http://localhost:3000/tenants', form);
      setResult(res.data);
      setMessage(`Institution "${res.data.name}" created successfully!`);
    } catch(err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  const handleGoToPortal = (e) => {
    e.preventDefault();
    setError('');
    const sub = loginSub.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!sub) { setError('Enter your institution code'); return; }
    window.location.href = `http://${sub}.localhost:${window.location.port || 5173}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c', color: '#e4e4e7', fontFamily: "'Inter', system-ui, sans-serif", display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <header style={{ borderBottom: '1px solid #2a2a2e', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', background: '#00d1ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#000', fontSize: '14px' }}>E</div>
          <span style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '1px' }}>EDUCORE OS</span>
        </div>
        {view !== 'home' && (
          <button onClick={() => { setView('home'); setError(''); setMessage(''); setResult(null); }} style={{ background: 'none', border: '1px solid #2a2a2e', color: '#a1a1aa', padding: '8px 16px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ← Back
          </button>
        )}
      </header>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        
        {view === 'home' && (
          <div style={{ textAlign: 'center', maxWidth: '600px' }}>
            <h1 style={{ fontSize: '48px', fontWeight: 800, marginBottom: '12px', lineHeight: 1.1 }}>
              Your Institution,<br />
              <span style={{ color: '#00d1ff' }}>Digitized.</span>
            </h1>
            <p style={{ color: '#71717a', fontSize: '16px', marginBottom: '48px', lineHeight: 1.6 }}>
              Manage students, attendance, results, notices and communication — all from one platform built for small tuitions and coaching centers.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setView('register')} className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '14px' }}>
                Register New Institution
              </button>
              <button onClick={() => setView('login')} className="btn btn-secondary" style={{ padding: '14px 32px', fontSize: '14px' }}>
                Login to Existing
              </button>
            </div>
          </div>
        )}

        {view === 'register' && (
          <div style={{ width: '100%', maxWidth: '480px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Register Your Institution</h2>
            <p style={{ color: '#71717a', marginBottom: '32px', fontSize: '13px' }}>Set up your digital campus in seconds.</p>

            {result ? (
              <div style={{ background: '#111114', border: '1px solid #2a2a2e', padding: '32px' }}>
                <div style={{ color: '#22c55e', fontWeight: 700, fontSize: '16px', marginBottom: '16px' }}>✓ {message}</div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ color: '#71717a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>Admin Portal</label>
                  <a href={result.adminLoginUrl} style={{ color: '#00d1ff', wordBreak: 'break-all', fontSize: '14px' }}>{result.adminLoginUrl}</a>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ color: '#71717a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>Student Login Link</label>
                  <div style={{ background: '#18181b', border: '1px solid #3a3a3e', padding: '12px', color: '#00d1ff', wordBreak: 'break-all', fontSize: '13px', fontFamily: 'monospace' }}>
                    {result.studentLoginUrl}
                  </div>
                  <p style={{ color: '#71717a', fontSize: '11px', marginTop: '6px' }}>Share this link with your students so they can log in.</p>
                </div>
                <button onClick={() => window.location.href = result.adminLoginUrl} className="btn btn-primary" style={{ width: '100%' }}>
                  Go to Admin Portal →
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ color: '#71717a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Institution Name</label>
                  <input className="field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Sharma Coaching Center" required />
                </div>
                <div>
                  <label style={{ color: '#71717a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Subdomain Code</label>
                  <input className="field" value={form.subdomain} onChange={e => setForm({...form, subdomain: e.target.value})} placeholder="e.g. sharmacoaching" required />
                  <p style={{ color: '#3a3a3e', fontSize: '11px', marginTop: '4px' }}>{form.subdomain ? form.subdomain.toLowerCase().replace(/[^a-z0-9]/g, '') : '...'}.localhost</p>
                </div>
                <div style={{ borderTop: '1px solid #2a2a2e', paddingTop: '16px', marginTop: '8px' }}>
                  <p style={{ color: '#a1a1aa', fontSize: '12px', marginBottom: '12px', fontWeight: 600 }}>ADMIN ACCOUNT</p>
                </div>
                <div>
                  <label style={{ color: '#71717a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Your Name</label>
                  <input className="field" value={form.adminName} onChange={e => setForm({...form, adminName: e.target.value})} placeholder="e.g. Rajesh Sharma" required />
                </div>
                <div>
                  <label style={{ color: '#71717a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Admin Username</label>
                  <input className="field" value={form.adminUsername} onChange={e => setForm({...form, adminUsername: e.target.value})} placeholder="e.g. rajesh" required />
                </div>
                <div>
                  <label style={{ color: '#71717a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Admin Password</label>
                  <input className="field" type="password" value={form.adminPassword} onChange={e => setForm({...form, adminPassword: e.target.value})} placeholder="••••••••" required />
                </div>
                {error && <p style={{ color: '#ef4444', fontSize: '13px' }}>{error}</p>}
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>Create Institution</button>
              </form>
            )}
          </div>
        )}

        {view === 'login' && (
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Login to Your Institution</h2>
            <p style={{ color: '#71717a', marginBottom: '32px', fontSize: '13px' }}>Enter your institution code to access the admin portal.</p>
            <form onSubmit={handleGoToPortal} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ color: '#71717a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Institution Code (Subdomain)</label>
                <input className="field" value={loginSub} onChange={e => setLoginSub(e.target.value)} placeholder="e.g. sharmacoaching" required />
                <p style={{ color: '#3a3a3e', fontSize: '11px', marginTop: '4px' }}>{loginSub ? loginSub.toLowerCase().replace(/[^a-z0-9]/g, '') : '...'}.localhost</p>
              </div>
              {error && <p style={{ color: '#ef4444', fontSize: '13px' }}>{error}</p>}
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Go to Admin Portal →</button>
            </form>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #2a2a2e', padding: '16px 32px', textAlign: 'center', color: '#3a3a3e', fontSize: '11px' }}>
        © {new Date().getFullYear()} EduCore OS — Built for small tuitions and coaching centers.
      </footer>
    </div>
  );
};

export default GlobalLanding;
