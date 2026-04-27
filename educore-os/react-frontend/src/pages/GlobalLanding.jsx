import React, { useState } from 'react';
import axios from 'axios';

const GlobalLanding = () => {
  const [view, setView] = useState('home');
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

  const Label = ({children}) => <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 500, color: '#374151' }}>{children}</label>;

  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: '#1a1a1a', fontFamily: "'Inter', system-ui, sans-serif", display: 'flex', flexDirection: 'column' }}>
      
      <header style={{ borderBottom: '1px solid #e5e7eb', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', background: '#2563eb', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '13px' }}>E</div>
          <span style={{ fontWeight: 600, fontSize: '15px' }}>EduCore</span>
        </div>
        {view !== 'home' && (
          <button onClick={() => { setView('home'); setError(''); setMessage(''); setResult(null); }} className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 14px' }}>
            ← Back
          </button>
        )}
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        
        {view === 'home' && (
          <div style={{ textAlign: 'center', maxWidth: '520px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 700, marginBottom: '12px', lineHeight: 1.2, color: '#111827' }}>
              Manage your tuition center, simply.
            </h1>
            <p style={{ color: '#6b7280', fontSize: '15px', marginBottom: '40px', lineHeight: 1.6 }}>
              Attendance, results, notices, and student communication — all in one place.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setView('register')} className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '14px' }}>
                Register New Institution
              </button>
              <button onClick={() => setView('login')} className="btn btn-outline" style={{ padding: '12px 28px', fontSize: '14px' }}>
                Login to Existing
              </button>
            </div>
          </div>
        )}

        {view === 'register' && (
          <div style={{ width: '100%', maxWidth: '420px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '4px' }}>Register Your Institution</h2>
            <p style={{ color: '#6b7280', marginBottom: '28px', fontSize: '13px' }}>Set up your digital campus in seconds.</p>

            {result ? (
              <div className="card" style={{ padding: '28px' }}>
                <p style={{ color: '#15803d', fontWeight: 600, marginBottom: '20px' }}>✓ {message}</p>
                <div style={{ marginBottom: '20px' }}>
                  <Label>Admin Portal</Label>
                  <a href={result.adminLoginUrl} style={{ color: '#2563eb', wordBreak: 'break-all', fontSize: '13px' }}>{result.adminLoginUrl}</a>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <Label>Student Login Link</Label>
                  <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '10px 12px', color: '#374151', wordBreak: 'break-all', fontSize: '13px', fontFamily: 'monospace' }}>
                    {result.studentLoginUrl}
                  </div>
                  <p style={{ color: '#9ca3af', fontSize: '11px', marginTop: '4px' }}>Share this link with your students.</p>
                </div>
                <button onClick={() => window.location.href = result.adminLoginUrl} className="btn btn-primary" style={{ width: '100%' }}>
                  Go to Admin Portal →
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div><Label>Institution Name</Label><input className="field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Sharma Coaching Center" required /></div>
                <div><Label>Subdomain Code</Label><input className="field" value={form.subdomain} onChange={e => setForm({...form, subdomain: e.target.value})} placeholder="e.g. sharmacoaching" required /><p style={{ color: '#9ca3af', fontSize: '11px', marginTop: '3px' }}>{form.subdomain ? form.subdomain.toLowerCase().replace(/[^a-z0-9]/g, '') : '...'}.localhost</p></div>
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '14px', marginTop: '4px' }}><p style={{ color: '#6b7280', fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>ADMIN ACCOUNT</p></div>
                <div><Label>Your Name</Label><input className="field" value={form.adminName} onChange={e => setForm({...form, adminName: e.target.value})} placeholder="e.g. Rajesh Sharma" required /></div>
                <div><Label>Admin Username</Label><input className="field" value={form.adminUsername} onChange={e => setForm({...form, adminUsername: e.target.value})} placeholder="e.g. rajesh" required /></div>
                <div><Label>Admin Password</Label><input className="field" type="password" value={form.adminPassword} onChange={e => setForm({...form, adminPassword: e.target.value})} placeholder="••••••••" required /></div>
                {error && <p style={{ color: '#dc2626', fontSize: '13px' }}>{error}</p>}
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '4px' }}>Create Institution</button>
              </form>
            )}
          </div>
        )}

        {view === 'login' && (
          <div style={{ width: '100%', maxWidth: '380px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '4px' }}>Login to Your Institution</h2>
            <p style={{ color: '#6b7280', marginBottom: '28px', fontSize: '13px' }}>Enter your institution code to access the admin portal.</p>
            <form onSubmit={handleGoToPortal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><Label>Institution Code (Subdomain)</Label><input className="field" value={loginSub} onChange={e => setLoginSub(e.target.value)} placeholder="e.g. sharmacoaching" required /><p style={{ color: '#9ca3af', fontSize: '11px', marginTop: '3px' }}>{loginSub ? loginSub.toLowerCase().replace(/[^a-z0-9]/g, '') : '...'}.localhost</p></div>
              {error && <p style={{ color: '#dc2626', fontSize: '13px' }}>{error}</p>}
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Go to Admin Portal →</button>
            </form>
          </div>
        )}

      </main>

      <footer style={{ borderTop: '1px solid #e5e7eb', padding: '14px 32px', textAlign: 'center', color: '#9ca3af', fontSize: '11px' }}>
        Powered by EduCore
      </footer>
    </div>
  );
};

export default GlobalLanding;
