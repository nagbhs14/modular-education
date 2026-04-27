import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext, TenantContext } from '../App';

const StudentLogin = () => {
  const { loginStudent } = useContext(AuthContext);
  const tenant = useContext(TenantContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const displayName = tenant?.name || tenant?.subdomain || 'Institution';

  const handleLogin = async (e) => {
    e.preventDefault(); setError('');
    try { const r = await axios.post('/api/auth/student-login',{username,password}); loginStudent(r.data.token); }
    catch(e) { setError(e.response?.data?.error||'Invalid credentials'); }
  };

  return (
    <div style={{minHeight:'100vh',background:'#f8fafc',display:'flex',flexDirection:'column',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <header style={{borderBottom:'1px solid #e2e8f0',padding:'14px 32px',background:'#fff',display:'flex',alignItems:'center',gap:'10px'}}>
        <div style={{width:'28px',height:'28px',background:'#7c3aed',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'#fff',fontSize:'13px'}}>{displayName.charAt(0)}</div>
        <span style={{fontWeight:600,fontSize:'15px',color:'#1e293b'}}>{displayName}</span>
        <span style={{color:'#cbd5e1'}}>·</span>
        <span style={{color:'#64748b',fontSize:'12px'}}>Student Portal</span>
      </header>
      <main style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 24px'}}>
        <div style={{width:'100%',maxWidth:'340px'}}>
          <h1 style={{fontSize:'22px',fontWeight:700,marginBottom:'4px'}}>Student Login</h1>
          <p style={{color:'#64748b',fontSize:'13px',marginBottom:'28px'}}>Use the username and password given by your teacher.</p>
          <form onSubmit={handleLogin} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
            <div><label style={{display:'block',marginBottom:'5px',fontSize:'13px',fontWeight:600,color:'#334155'}}>Username</label><input className="field" value={username} onChange={e=>setUsername(e.target.value)} required autoFocus/></div>
            <div><label style={{display:'block',marginBottom:'5px',fontSize:'13px',fontWeight:600,color:'#334155'}}>Password</label><input className="field" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></div>
            {error&&<p style={{color:'#dc2626',fontSize:'13px'}}>{error}</p>}
            <button type="submit" className="btn btn-primary" style={{width:'100%',background:'#7c3aed'}}>Login</button>
          </form>
        </div>
      </main>
      <footer style={{borderTop:'1px solid #e2e8f0',padding:'14px',textAlign:'center',color:'#94a3b8',fontSize:'11px',background:'#fff'}}>Powered by EduCore</footer>
    </div>
  );
};
export default StudentLogin;
