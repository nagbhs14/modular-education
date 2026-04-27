import React, { useContext, useState, useEffect } from 'react';
import { AuthContext, TenantContext } from '../../App';
import axios from 'axios';

/* ─── Dashboard ─── */
const StudentHome = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState({ attendance: 0, results: [], notices: [] });

  useEffect(() => {
    const load = async () => {
      try {
        const [att, res, not] = await Promise.all([
          axios.get('/api/attendance/my'),
          axios.get('/api/results'),
          axios.get('/api/communication')
        ]);
        setData({
          attendance: att.data.percentage,
          results: res.data.slice(0, 3),
          notices: not.data.slice(0, 2)
        });
      } catch(e) {}
    };
    load();
  }, []);

  return (
    <div>
      <h2 style={{fontSize:'24px',fontWeight:700,marginBottom:'8px'}}>Welcome back, {user?.name}</h2>
      <p style={{color:'#64748b',fontSize:'14px',marginBottom:'32px'}}>Here is your academic progress overview for today.</p>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))',gap:'20px',marginBottom:'32px'}}>
        <div className="card" style={{padding:'24px',display:'flex',flexDirection:'column',justifyContent:'center',borderLeft:'4px solid #7c3aed'}}>
          <div style={{color:'#64748b',fontSize:'12px',fontWeight:700,letterSpacing:'0.05em',textTransform:'uppercase',marginBottom:'8px'}}>Current Attendance</div>
          <div style={{fontSize:'32px',fontWeight:700,color:'#0f172a'}}>{data.attendance}%</div>
          <div style={{marginTop:'4px',fontSize:'12px',color:data.attendance < 75 ? '#dc2626' : '#10b981',fontWeight:600}}>
            {data.attendance < 75 ? '⚠️ Below requirement' : '✓ Good standing'}
          </div>
        </div>
        <div className="card" style={{padding:'24px',background:'#fff'}}>
          <div style={{color:'#64748b',fontSize:'12px',fontWeight:700,letterSpacing:'0.05em',textTransform:'uppercase',marginBottom:'12px'}}>Recent Performance</div>
          {data.results.length > 0 ? (
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {data.results.map((r,i) => (
                <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                  <span style={{fontWeight:600}}>{r.exam_name}</span>
                  <span style={{color:'#2563eb',fontWeight:700}}>{r.score}%</span>
                </div>
              ))}
            </div>
          ) : <p style={{fontSize:'13px',color:'#94a3b8'}}>No recent assessments.</p>}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(400px, 1fr))',gap:'20px'}}>
        <div className="card" style={{padding:'24px'}}>
          <h3 style={{fontSize:'16px',fontWeight:700,marginBottom:'20px'}}>Latest Announcements</h3>
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {data.notices.map((n,i) => (
              <div key={i} style={{padding:'12px',background:'#f8fafc',borderRadius:'8px',borderLeft:'3px solid #e2e8f0'}}>
                <p style={{fontSize:'13px',lineHeight:1.6,color:'#334155'}}>{n.message}</p>
                <div style={{marginTop:'8px',fontSize:'10px',color:'#94a3b8',fontWeight:700,textTransform:'uppercase'}}>{new Date(n.created_at).toLocaleDateString()}</div>
              </div>
            ))}
            {data.notices.length === 0 && <p style={{color:'#94a3b8',fontSize:'13px',textAlign:'center'}}>No new notices.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Notices ─── */
const NoticesTab = () => {
  const [list, setList] = useState([]);
  useEffect(()=>{axios.get('/api/communication').then(r=>setList(r.data)).catch(()=>{});},[]);
  return (
    <div>
      <h2 style={{fontSize:'20px',fontWeight:700,marginBottom:'24px'}}>Notice Board</h2>
      <div style={{display:'flex',flexDirection:'column',gap:'16px',maxWidth:'600px'}}>
        {list.map(a=>(<div key={a.id} className="card" style={{padding:'24px'}}>
          <p style={{lineHeight:1.8,color:'#334155',whiteSpace:'pre-line',fontSize:'15px'}}>{a.message}</p>
          <div style={{marginTop:'16px',display:'flex',alignItems:'center',gap:'8px',color:'#94a3b8',fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em'}}>By {a.author} · {new Date(a.created_at).toLocaleDateString()}</div>
        </div>))}
        {list.length===0&&<div className="card" style={{padding:'40px',textAlign:'center',color:'#94a3b8'}}>No announcements at this time.</div>}
      </div>
    </div>
  );
};

/* ─── Attendance ─── */
const AttendanceTab = () => {
  const [data, setData] = useState({records:[],percentage:0,alert:false});
  useEffect(()=>{axios.get('/api/attendance/my').then(r=>setData(r.data)).catch(()=>{});},[]);
  return (
    <div>
      <h2 style={{fontSize:'20px',fontWeight:700,marginBottom:'24px'}}>My Attendance</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:'20px',marginBottom:'32px',maxWidth:'600px'}}>
        <div className="card" style={{padding:'20px',textAlign:'center'}}>
          <div style={{fontSize:'11px',fontWeight:700,color:'#64748b',textTransform:'uppercase',marginBottom:'8px'}}>Attendance Score</div>
          <div style={{fontSize:'32px',fontWeight:800,color:data.alert?'#dc2626':'#2563eb'}}>{data.percentage}%</div>
        </div>
        {data.alert && (
          <div className="card" style={{padding:'20px',background:'#fef2f2',border:'1px solid #fca5a5',display:'flex',alignItems:'center'}}>
            <p style={{color:'#dc2626',fontSize:'13px',fontWeight:600,margin:0}}>⚠️ Your attendance is below the 75% requirement.</p>
          </div>
        )}
      </div>
      <div className="card" style={{maxWidth:'600px'}}>
        <table className="tbl"><thead><tr><th>Date</th><th>Status</th></tr></thead>
        <tbody>{data.records.map((r,i)=>(<tr key={i}><td style={{fontWeight:600,color:'#475569'}}>{r.date}</td><td><span className={`badge ${r.status==='present'?'badge-present':'badge-absent'}`}>{r.status}</span></td></tr>))}
        {data.records.length===0&&<tr><td colSpan={2} style={{color:'#94a3b8',textAlign:'center',padding:'40px'}}>No records found.</td></tr>}</tbody></table>
      </div>
    </div>
  );
};

/* ─── Results ─── */
const ResultsTab = () => {
  const [results, setResults] = useState([]);
  useEffect(()=>{axios.get('/api/results').then(r=>setResults(r.data)).catch(()=>{});},[]);
  return (
    <div>
      <h2 style={{fontSize:'20px',fontWeight:700,marginBottom:'24px'}}>Academic Results</h2>
      <div className="card" style={{maxWidth:'600px'}}>
        <table className="tbl"><thead><tr><th>Assessment Name</th><th style={{textAlign:'right'}}>Score</th></tr></thead>
        <tbody>{results.map((r,i)=>(<tr key={i}><td style={{fontWeight:600,color:'#1e293b'}}>{r.exam_name}</td><td style={{textAlign:'right',fontFamily:'monospace',fontWeight:800,color:'#2563eb',fontSize:'15px'}}>{r.score}%</td></tr>))}
        {results.length===0&&<tr><td colSpan={2} style={{color:'#94a3b8',textAlign:'center',padding:'40px'}}>No assessment results available.</td></tr>}</tbody></table>
      </div>
    </div>
  );
};

/* ─── Messages ─── */
const MessagesTab = () => {
  const [view, setView] = useState('inbox');
  const [inbox, setInbox] = useState([]); const [sent, setSent] = useState([]); const [contacts, setContacts] = useState([]);
  const [sel, setSel] = useState(null);
  const [form, setForm] = useState({receiver_id:'',subject:'',body:''});
  const [msg, setMsg] = useState('');

  const loadAll = () => {
    axios.get('/api/messages/inbox').then(r=>setInbox(r.data));
    axios.get('/api/messages/sent').then(r=>setSent(r.data));
    axios.get('/api/messages/contacts').then(r=>setContacts(r.data));
  };
  useEffect(loadAll, []);

  const open = async (m) => { setSel(m); if(!m.is_read&&view==='inbox'){await axios.put(`/api/messages/${m.id}/read`);loadAll();} };
  const send = async (e) => { e.preventDefault(); await axios.post('/api/messages',form); setForm({receiver_id:'',subject:'',body:''}); setMsg('Message sent successfully!'); loadAll(); setView('sent'); setTimeout(()=>setMsg(''),3000); };

  const curList = view==='inbox'?inbox:sent;
  return (
    <div>
      <h2 style={{fontSize:'20px',fontWeight:700,marginBottom:'24px'}}>Communication</h2>
      <div className="tab-bar" style={{marginBottom:'24px',borderRadius:'8px',border:'1px solid #e2e8f0',overflow:'hidden',width:'fit-content'}}>
        {['inbox','sent','compose'].map(v=>(<button key={v} onClick={()=>{setView(v);setSel(null);}} className={`tab-btn ${view===v?'active':''}`} style={{fontSize:'12px',textTransform:'uppercase',letterSpacing:'0.05em'}}>{v}</button>))}
      </div>
      {msg&&<p style={{color:'#10b981',fontSize:'13px',fontWeight:600,marginBottom:'16px'}}>✓ {msg}</p>}
      
      {view==='compose'?(
        <div className="card" style={{padding:'32px',maxWidth:'500px'}}>
          <form onSubmit={send} style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            <div><label style={{display:'block',marginBottom:'5px',fontSize:'13px',fontWeight:600,color:'#475569'}}>Select Recipient</label><select className="field" required value={form.receiver_id} onChange={e=>setForm({...form,receiver_id:e.target.value})}><option value="">Select Teacher...</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label style={{display:'block',marginBottom:'5px',fontSize:'13px',fontWeight:600,color:'#475569'}}>Subject</label><input className="field" placeholder="Topic" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} required/></div>
            <div><label style={{display:'block',marginBottom:'5px',fontSize:'13px',fontWeight:600,color:'#475569'}}>Message Body</label><textarea className="field" rows={6} placeholder="Describe your query..." required value={form.body} onChange={e=>setForm({...form,body:e.target.value})} style={{resize:'none'}} /></div>
            <button type="submit" className="btn btn-primary" style={{background:'#7c3aed'}}>Send to Teacher</button>
          </form>
        </div>
      ):(
        <div style={{display:'flex',gap:'20px',minHeight:'400px'}}>
          <div className="card" style={{width:'260px',flexShrink:0,overflowY:'auto',background:'#fff'}}>
            {curList.map(m=>(<div key={m.id} onClick={()=>open(m)} style={{padding:'16px',borderBottom:'1px solid #f1f5f9',cursor:'pointer',background:sel?.id===m.id?'#f8fafc':'#fff',borderLeft:sel?.id===m.id?'3px solid #7c3aed':'3px solid transparent'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}><span style={{fontWeight:(view==='inbox'&&!m.is_read)?700:600,fontSize:'13px',color:'#1e293b'}}>{view==='inbox'?m.sender_name:m.receiver_name}</span>{view==='inbox'&&!m.is_read&&<span style={{width:'8px',height:'8px',background:'#7c3aed',borderRadius:'50%'}}/>}</div>
              <div style={{color:'#64748b',fontSize:'12px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.subject||'(no subject)'}</div>
            </div>))}
            {curList.length===0&&<div style={{padding:'40px',color:'#94a3b8',textAlign:'center',fontSize:'13px'}}>No conversations.</div>}
          </div>
          <div className="card" style={{flex:1,padding:sel?'24px':'0',display:'flex',flexDirection:'column',background:'#fff'}}>
            {sel?(<><h3 style={{fontSize:'18px',fontWeight:700,marginBottom:'4px',color:'#0f172a'}}>{sel.subject||'(no subject)'}</h3><p style={{color:'#64748b',fontSize:'12px',marginBottom:'24px'}}>{view==='inbox'?`From ${sel.sender_name}`:`To ${sel.receiver_name}`} · {new Date(sel.created_at).toLocaleString()}</p><div style={{color:'#334155',whiteSpace:'pre-line',lineHeight:1.8,fontSize:'15px'}}>{sel.body}</div></>):(<div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'#cbd5e1',fontSize:'14px',fontWeight:500}}>Select a message to view content.</div>)}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Complaints ─── */
const ComplaintsTab = () => {
  const [list, setList] = useState([]); const [show, setShow] = useState(false);
  const [form, setForm] = useState({subject:'',body:''}); const [msg, setMsg] = useState('');
  useEffect(()=>{axios.get('/api/messages/complaints').then(r=>setList(r.data)).catch(()=>{});},[]);
  const submit = async (e) => { e.preventDefault(); await axios.post('/api/messages/complaints',form); setForm({subject:'',body:''}); setShow(false); setMsg('Your grievance has been registered.'); axios.get('/api/messages/complaints').then(r=>setList(r.data)); setTimeout(()=>setMsg(''),3000); };
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
        <h2 style={{fontSize:'20px',fontWeight:700}}>Grievance Redressal</h2>
        <button onClick={()=>setShow(!show)} className="btn btn-primary" style={{background:'#7c3aed'}}>{show?'Cancel':'+ Register Grievance'}</button>
      </div>
      {msg&&<p style={{color:'#10b981',fontSize:'13px',fontWeight:600,marginBottom:'16px'}}>✓ {msg}</p>}
      {show&&(<div className="card" style={{padding:'24px',marginBottom:'32px',maxWidth:'500px'}}><form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:'16px'}}>
        <div><label style={{display:'block',marginBottom:'5px',fontSize:'13px',fontWeight:600,color:'#475569'}}>Subject of Grievance</label><input className="field" placeholder="Topic" required value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} /></div>
        <div><label style={{display:'block',marginBottom:'5px',fontSize:'13px',fontWeight:600,color:'#475569'}}>Description</label><textarea className="field" rows={5} placeholder="Describe the issue in detail..." required value={form.body} onChange={e=>setForm({...form,body:e.target.value})} style={{resize:'none'}} /></div>
        <button type="submit" className="btn btn-primary" style={{background:'#7c3aed'}}>Submit Grievance</button>
      </form></div>)}
      <div style={{display:'flex',flexDirection:'column',gap:'16px',maxWidth:'600px'}}>
        {list.map(c=>(<div key={c.id} className="card" style={{padding:'24px'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'12px'}}><h4 style={{fontSize:'16px',fontWeight:700,color:'#1e293b'}}>{c.subject}</h4><span className={`badge ${c.status==='open'?'badge-warn':'badge-present'}`}>{c.status}</span></div>
          <p style={{color:'#334155',whiteSpace:'pre-line',lineHeight:1.7,fontSize:'14px'}}>{c.body}</p>
          {c.admin_reply&&<div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'8px',padding:'16px',marginTop:'16px'}}><p style={{color:'#64748b',fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'4px'}}>Institution Reply</p><p style={{fontSize:'14px',color:'#1e293b'}}>{c.admin_reply}</p></div>}
          <div style={{marginTop:'12px',fontSize:'11px',color:'#94a3b8',fontWeight:600}}>{new Date(c.created_at).toLocaleString()}</div>
        </div>))}
        {list.length===0&&<div className="card" style={{padding:'40px',textAlign:'center',color:'#94a3b8'}}>No grievances filed yet.</div>}
      </div>
    </div>
  );
};

/* ─── Shell ─── */
const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const tenant = useContext(TenantContext);
  const [tab, setTab] = useState('dashboard');
  const displayName = tenant?.name || tenant?.subdomain || 'Institution';
  
  const tabs = [
    {key:'dashboard',label:'Dashboard',icon:'📊'},
    {key:'notices',label:'Notices',icon:'📢'},
    {key:'attendance',label:'Attendance',icon:'✅'},
    {key:'results',label:'Results',icon:'🏆'},
    {key:'messages',label:'Messages',icon:'✉️'},
    {key:'complaints',label:'Complaints',icon:'📝'}
  ];

  const renderTab = () => { switch(tab){case 'dashboard':return <StudentHome/>;case 'notices':return <NoticesTab/>;case 'attendance':return <AttendanceTab/>;case 'results':return <ResultsTab/>;case 'messages':return <MessagesTab/>;case 'complaints':return <ComplaintsTab/>;default:return <StudentHome/>;} };

  return (
    <div style={{minHeight:'100vh',background:'#f8fafc',display:'flex'}}>
      <div className="sidebar" style={{borderRightColor:'#e2e8f0'}}>
        <div className="sidebar-brand">
          <div style={{width:'28px',height:'28px',background:'#7c3aed',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'#fff',fontSize:'14px'}}>E</div>
          <span style={{fontWeight:700,fontSize:'16px',color:'#0f172a',letterSpacing:'-0.02em'}}>EduCore</span>
        </div>
        <div className="sidebar-nav">
          {tabs.map(t=><button key={t.key} onClick={()=>setTab(t.key)} className={`sidebar-item ${tab===t.key?'active':''}`} style={tab===t.key?{color:'#7c3aed',background:'#f5f3ff'}:{}}><span>{t.icon}</span> {t.label}</button>)}
        </div>
        <div className="sidebar-footer">
          <button onClick={logout} className="sidebar-item" style={{color:'#dc2626'}}><span>🚪</span> Logout</button>
        </div>
      </div>
      
      <div className="main-content">
        <header className="topbar">
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <div style={{textAlign:'right'}}><div style={{fontSize:'13px',fontWeight:700,color:'#1e293b'}}>{user?.name}</div><div style={{fontSize:'11px',color:'#64748b',textTransform:'uppercase',fontWeight:700,letterSpacing:'0.05em'}}>{displayName} · Student</div></div>
            <div style={{width:'36px',height:'36px',background:'#f5f3ff',color:'#7c3aed',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:700}}>S</div>
          </div>
        </header>
        <main style={{flex:1,padding:'40px',maxWidth:'1200px',margin:'0 auto',width:'100%',boxSizing:'border-box'}}>{renderTab()}</main>
        <footer style={{padding:'24px 40px',textAlign:'center',color:'#94a3b8',fontSize:'12px',fontWeight:500}}>Powered by EduCore</footer>
      </div>
    </div>
  );
};

export default StudentDashboard;
