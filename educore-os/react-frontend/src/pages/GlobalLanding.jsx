import React, { useState } from 'react';
import axios from 'axios';

const Label = ({children}) => <label style={{display:'block',marginBottom:'5px',fontSize:'13px',fontWeight:600,color:'#334155'}}>{children}</label>;

const GlobalLanding = () => {
  const [view, setView] = useState('home');
  const [form, setForm] = useState({name:'',subdomain:'',adminName:'',adminUsername:'',adminPassword:''});
  const [loginSub, setLoginSub] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault(); setError(''); setResult(null);
    try { const r = await axios.post('http://localhost:3000/tenants', form); setResult(r.data); }
    catch(e) { setError(e.response?.data?.error||'Failed'); }
  };
  const handleGoToPortal = (e) => {
    e.preventDefault(); setError('');
    const sub = loginSub.toLowerCase().replace(/[^a-z0-9]/g,'');
    if(!sub){setError('Enter institution code');return;}
    window.location.href = `http://${sub}.localhost:${window.location.port||5173}`;
  };

  return (
    <div style={{minHeight:'100vh',background:'#f8fafc',color:'#191b23',fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif",display:'flex',flexDirection:'column'}}>
      <header style={{borderBottom:'1px solid #e2e8f0',padding:'14px 32px',background:'#fff',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'32px',height:'32px',background:'#2563eb',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'#fff',fontSize:'15px'}}>E</div>
          <span style={{fontWeight:700,fontSize:'16px',color:'#1e293b'}}>EduCore</span>
        </div>
        {view!=='home'&&<button onClick={()=>{setView('home');setError('');setResult(null);}} className="btn btn-outline btn-sm">← Back</button>}
      </header>

      <main style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 24px'}}>
        {view==='home'&&(
          <div style={{textAlign:'center',maxWidth:'480px'}}>
            {/* Big Logo */}
            <div style={{marginBottom:'32px'}}>
              <div style={{width:'80px',height:'80px',background:'#2563eb',borderRadius:'20px',display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:'16px',boxShadow:'0 8px 30px rgba(37,99,235,0.2)'}}>
                <span style={{color:'#fff',fontSize:'36px',fontWeight:800}}>E</span>
              </div>
              <h1 style={{fontSize:'40px',fontWeight:800,color:'#0f172a',marginBottom:'4px',letterSpacing:'-0.02em'}}>EduCore</h1>
              <p style={{color:'#94a3b8',fontSize:'13px',fontWeight:600,letterSpacing:'0.05em',textTransform:'uppercase'}}>Academic Management</p>
            </div>
            <p style={{color:'#64748b',fontSize:'15px',marginBottom:'36px',lineHeight:1.7}}>
              Manage your tuition center — attendance, results, notices and student communication, all in one place.
            </p>
            <div style={{display:'flex',gap:'12px',justifyContent:'center'}}>
              <button onClick={()=>setView('register')} className="btn btn-primary" style={{padding:'12px 28px',fontSize:'14px'}}>Register Institution</button>
              <button onClick={()=>setView('login')} className="btn btn-outline" style={{padding:'12px 28px',fontSize:'14px'}}>Login</button>
            </div>
          </div>
        )}

        {view==='register'&&(
          <div style={{width:'100%',maxWidth:'420px'}}>
            <h2 style={{fontSize:'22px',fontWeight:700,marginBottom:'4px'}}>Register Institution</h2>
            <p style={{color:'#64748b',marginBottom:'24px',fontSize:'13px'}}>Set up in seconds.</p>
            {result?(
              <div className="card" style={{padding:'24px'}}>
                <p style={{color:'#15803d',fontWeight:600,marginBottom:'16px'}}>✓ Created successfully!</p>
                <div style={{marginBottom:'16px'}}><Label>Admin Portal</Label><a href={result.adminLoginUrl} style={{color:'#2563eb',fontSize:'13px',wordBreak:'break-all'}}>{result.adminLoginUrl}</a></div>
                <div style={{marginBottom:'16px'}}><Label>Student Login Link</Label><div style={{background:'#f1f5f9',borderRadius:'8px',padding:'10px 12px',fontFamily:'monospace',fontSize:'12px',color:'#334155',wordBreak:'break-all'}}>{result.studentLoginUrl}</div><p style={{color:'#94a3b8',fontSize:'11px',marginTop:'4px'}}>Share with students</p></div>
                <button onClick={()=>window.location.href=result.adminLoginUrl} className="btn btn-primary" style={{width:'100%'}}>Open Admin Portal →</button>
              </div>
            ):(
              <form onSubmit={handleRegister} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                <div><Label>Institution Name</Label><input className="field" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Sharma Coaching" required/></div>
                <div><Label>Subdomain Code</Label><input className="field" value={form.subdomain} onChange={e=>setForm({...form,subdomain:e.target.value})} placeholder="e.g. sharmacoaching" required/><p style={{color:'#94a3b8',fontSize:'11px',marginTop:'3px'}}>{form.subdomain?form.subdomain.toLowerCase().replace(/[^a-z0-9]/g,''):'...'}.localhost</p></div>
                <div style={{borderTop:'1px solid #e2e8f0',paddingTop:'14px'}}><p style={{color:'#64748b',fontSize:'12px',fontWeight:700,letterSpacing:'0.05em',marginBottom:'8px'}}>ADMIN ACCOUNT</p></div>
                <div><Label>Your Name</Label><input className="field" value={form.adminName} onChange={e=>setForm({...form,adminName:e.target.value})} placeholder="Full name" required/></div>
                <div><Label>Username</Label><input className="field" value={form.adminUsername} onChange={e=>setForm({...form,adminUsername:e.target.value})} required/></div>
                <div><Label>Password</Label><input className="field" type="password" value={form.adminPassword} onChange={e=>setForm({...form,adminPassword:e.target.value})} required/></div>
                {error&&<p style={{color:'#dc2626',fontSize:'13px'}}>{error}</p>}
                <button type="submit" className="btn btn-primary" style={{width:'100%'}}>Create Institution</button>
              </form>
            )}
          </div>
        )}

        {view==='login'&&(
          <div style={{width:'100%',maxWidth:'380px'}}>
            <h2 style={{fontSize:'22px',fontWeight:700,marginBottom:'4px'}}>Login</h2>
            <p style={{color:'#64748b',marginBottom:'24px',fontSize:'13px'}}>Enter your institution code.</p>
            <form onSubmit={handleGoToPortal} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
              <div><Label>Institution Code</Label><input className="field" value={loginSub} onChange={e=>setLoginSub(e.target.value)} placeholder="e.g. sharmacoaching" required/></div>
              {error&&<p style={{color:'#dc2626',fontSize:'13px'}}>{error}</p>}
              <button type="submit" className="btn btn-primary" style={{width:'100%'}}>Go to Portal →</button>
            </form>
          </div>
        )}
      </main>

      <footer style={{borderTop:'1px solid #e2e8f0',padding:'14px 32px',textAlign:'center',color:'#94a3b8',fontSize:'11px',background:'#fff'}}>Powered by EduCore</footer>
    </div>
  );
};

export default GlobalLanding;
