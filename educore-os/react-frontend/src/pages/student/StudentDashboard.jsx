import React, { useContext, useState, useEffect } from 'react';
import { AuthContext, TenantContext } from '../../App';
import axios from 'axios';

/* ─── Notices ─── */
const NoticesTab = () => {
  const [list, setList] = useState([]);
  useEffect(()=>{axios.get('/api/communication').then(r=>setList(r.data)).catch(()=>{});},[]);
  return (
    <div>
      <h2 style={{fontSize:'18px',fontWeight:600,marginBottom:'20px'}}>Notices</h2>
      <div style={{display:'flex',flexDirection:'column',gap:'10px',maxWidth:'540px'}}>
        {list.map(a=>(<div key={a.id} className="card" style={{padding:'14px 16px'}}><p style={{lineHeight:1.6,whiteSpace:'pre-line'}}>{a.message}</p><p style={{color:'#9ca3af',fontSize:'11px',marginTop:'10px'}}>By {a.author} · {new Date(a.created_at).toLocaleString()}</p></div>))}
        {list.length===0&&<p style={{color:'#9ca3af'}}>No notices yet.</p>}
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
      <h2 style={{fontSize:'18px',fontWeight:600,marginBottom:'20px'}}>My Attendance</h2>
      <div className="card" style={{padding:'16px 20px',marginBottom:'20px',maxWidth:'240px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{color:'#6b7280',fontSize:'13px'}}>Overall</span>
        <span style={{fontSize:'24px',fontWeight:700,fontFamily:'monospace',color:data.alert?'#dc2626':'#15803d'}}>{data.percentage}%</span>
      </div>
      {data.alert&&<div style={{background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:'6px',padding:'10px 14px',color:'#dc2626',fontSize:'13px',marginBottom:'20px',maxWidth:'380px'}}>Your attendance is below 75%</div>}
      <table className="tbl" style={{maxWidth:'400px'}}><thead><tr><th>Date</th><th>Status</th></tr></thead>
      <tbody>{data.records.map((r,i)=>(<tr key={i}><td style={{color:'#6b7280'}}>{r.date}</td><td><span className={`badge ${r.status==='present'?'badge-present':'badge-absent'}`}>{r.status}</span></td></tr>))}
      {data.records.length===0&&<tr><td colSpan={2} style={{color:'#9ca3af',textAlign:'center',padding:'20px'}}>No records</td></tr>}</tbody></table>
    </div>
  );
};

/* ─── Results ─── */
const ResultsTab = () => {
  const [results, setResults] = useState([]);
  useEffect(()=>{axios.get('/api/results').then(r=>setResults(r.data)).catch(()=>{});},[]);
  return (
    <div>
      <h2 style={{fontSize:'18px',fontWeight:600,marginBottom:'20px'}}>My Results</h2>
      <table className="tbl" style={{maxWidth:'500px'}}><thead><tr><th>Exam</th><th>Score</th><th>Grade</th></tr></thead>
      <tbody>{results.map((r,i)=>(<tr key={i}><td>{r.exam_name}</td><td style={{fontFamily:'monospace',color:'#2563eb'}}>{r.score}</td><td style={{color:'#7c3aed',fontWeight:600}}>{r.grades||'—'}</td></tr>))}
      {results.length===0&&<tr><td colSpan={3} style={{color:'#9ca3af',textAlign:'center',padding:'20px'}}>No results</td></tr>}</tbody></table>
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

  useEffect(()=>{axios.get('/api/messages/inbox').then(r=>setInbox(r.data));axios.get('/api/messages/sent').then(r=>setSent(r.data));axios.get('/api/messages/contacts').then(r=>setContacts(r.data));},[]);

  const open = async (m) => { setSel(m); if(!m.is_read&&view==='inbox'){await axios.put(`/api/messages/${m.id}/read`);setInbox(p=>p.map(x=>x.id===m.id?{...x,is_read:1}:x));} };
  const send = async (e) => { e.preventDefault(); await axios.post('/api/messages',form); setForm({receiver_id:'',subject:'',body:''}); setMsg('Sent!'); axios.get('/api/messages/sent').then(r=>setSent(r.data)); setView('sent'); setTimeout(()=>setMsg(''),3000); };

  const curList = view==='inbox'?inbox:sent;
  return (
    <div>
      <h2 style={{fontSize:'18px',fontWeight:600,marginBottom:'20px'}}>Messages</h2>
      <div style={{display:'flex',gap:'0',marginBottom:'20px',borderBottom:'1px solid #e5e7eb'}}>
        {['inbox','sent','compose'].map(v=>(<button key={v} onClick={()=>{setView(v);setSel(null);}} style={{padding:'9px 18px',background:'none',border:'none',borderBottom:view===v?'2px solid #7c3aed':'2px solid transparent',color:view===v?'#7c3aed':'#6b7280',fontSize:'12px',fontWeight:500,textTransform:'uppercase',cursor:'pointer'}}>{v}</button>))}
      </div>
      {msg&&<p style={{color:'#15803d',fontSize:'13px',marginBottom:'12px'}}>✓ {msg}</p>}
      {view==='compose'?(
        <form onSubmit={send} style={{maxWidth:'440px',display:'flex',flexDirection:'column',gap:'12px'}}>
          <select className="field" required value={form.receiver_id} onChange={e=>setForm({...form,receiver_id:e.target.value})}><option value="">Select Teacher</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <input className="field" placeholder="Subject" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} />
          <textarea className="field" rows={5} placeholder="Your message..." required value={form.body} onChange={e=>setForm({...form,body:e.target.value})} />
          <button type="submit" className="btn btn-primary" style={{background:'#7c3aed'}}>Send</button>
        </form>
      ):(
        <div style={{display:'flex',gap:'14px',minHeight:'320px'}}>
          <div style={{width:'240px',flexShrink:0,border:'1px solid #e5e7eb',borderRadius:'8px',overflowY:'auto',background:'#fff'}}>
            {curList.map(m=>(<div key={m.id} onClick={()=>open(m)} style={{padding:'12px 14px',borderBottom:'1px solid #f3f4f6',cursor:'pointer',background:sel?.id===m.id?'#f9fafb':'#fff'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'2px'}}><span style={{fontWeight:(view==='inbox'&&!m.is_read)?600:400,fontSize:'13px'}}>{view==='inbox'?m.sender_name:m.receiver_name}</span>{view==='inbox'&&!m.is_read&&<span style={{width:'7px',height:'7px',background:'#7c3aed',borderRadius:'50%',display:'inline-block'}}/>}</div>
              <div style={{color:'#6b7280',fontSize:'12px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.subject||'(no subject)'}</div>
            </div>))}
            {curList.length===0&&<div style={{padding:'20px',color:'#9ca3af',textAlign:'center',fontSize:'13px'}}>No messages</div>}
          </div>
          <div style={{flex:1,border:'1px solid #e5e7eb',borderRadius:'8px',background:'#fff',padding:sel?'20px':'0',display:'flex',flexDirection:'column'}}>
            {sel?(<><h3 style={{fontSize:'15px',fontWeight:600,marginBottom:'2px'}}>{sel.subject||'(no subject)'}</h3><p style={{color:'#6b7280',fontSize:'12px',marginBottom:'14px'}}>{view==='inbox'?`From ${sel.sender_name}`:`To ${sel.receiver_name}`} · {new Date(sel.created_at).toLocaleString()}</p><div style={{color:'#374151',whiteSpace:'pre-line',lineHeight:1.7,fontSize:'14px'}}>{sel.body}</div></>):(<div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'#d1d5db',fontSize:'13px'}}>Select a message</div>)}
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
  const submit = async (e) => { e.preventDefault(); await axios.post('/api/messages/complaints',form); setForm({subject:'',body:''}); setShow(false); setMsg('Submitted'); axios.get('/api/messages/complaints').then(r=>setList(r.data)); setTimeout(()=>setMsg(''),3000); };
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <h2 style={{fontSize:'18px',fontWeight:600}}>My Complaints</h2>
        <button onClick={()=>setShow(!show)} className="btn btn-primary" style={{background:'#7c3aed'}}>{show?'Cancel':'+ New Complaint'}</button>
      </div>
      {msg&&<p style={{color:'#15803d',fontSize:'13px',marginBottom:'12px'}}>✓ {msg}</p>}
      {show&&(<div className="card" style={{padding:'20px',marginBottom:'20px',maxWidth:'440px'}}><form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
        <input className="field" placeholder="Subject" required value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} />
        <textarea className="field" rows={4} placeholder="Describe..." required value={form.body} onChange={e=>setForm({...form,body:e.target.value})} />
        <button type="submit" className="btn btn-primary" style={{background:'#7c3aed'}}>Submit</button>
      </form></div>)}
      <div style={{display:'flex',flexDirection:'column',gap:'10px',maxWidth:'540px'}}>
        {list.map(c=>(<div key={c.id} className="card" style={{padding:'14px 16px'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}><h4 style={{fontWeight:500}}>{c.subject}</h4><span className={`badge ${c.status==='open'?'badge-warn':'badge-present'}`}>{c.status}</span></div>
          <p style={{color:'#374151',whiteSpace:'pre-line',lineHeight:1.6,fontSize:'13px'}}>{c.body}</p>
          {c.admin_reply&&<div style={{background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:'6px',padding:'10px',marginTop:'10px'}}><p style={{color:'#6b7280',fontSize:'11px',marginBottom:'3px'}}>REPLY</p><p style={{fontSize:'13px'}}>{c.admin_reply}</p></div>}
          <p style={{color:'#d1d5db',fontSize:'11px',marginTop:'8px'}}>{new Date(c.created_at).toLocaleString()}</p>
        </div>))}
        {list.length===0&&<p style={{color:'#9ca3af'}}>No complaints.</p>}
      </div>
    </div>
  );
};

/* ─── Shell ─── */
const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const tenant = useContext(TenantContext);
  const [tab, setTab] = useState('notices');
  const displayName = tenant?.name || tenant?.subdomain || 'Institution';
  const tabs = [{key:'notices',label:'Notices'},{key:'attendance',label:'Attendance'},{key:'results',label:'Results'},{key:'messages',label:'Messages'},{key:'complaints',label:'Complaints'}];
  const renderTab = () => { switch(tab){case 'notices':return <NoticesTab/>;case 'attendance':return <AttendanceTab/>;case 'results':return <ResultsTab/>;case 'messages':return <MessagesTab/>;case 'complaints':return <ComplaintsTab/>;default:return <NoticesTab/>;} };

  return (
    <div style={{minHeight:'100vh',background:'#fafafa',display:'flex',flexDirection:'column',fontFamily:"'Inter',system-ui,sans-serif"}}>
      <header style={{borderBottom:'1px solid #e5e7eb',padding:'0 24px',display:'flex',alignItems:'center',justifyContent:'space-between',height:'50px',background:'#fff',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'26px',height:'26px',background:'#7c3aed',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'#fff',fontSize:'12px'}}>{displayName.charAt(0)}</div>
          <span style={{fontWeight:600,fontSize:'14px',color:'#111827'}}>{displayName}</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
          <span style={{color:'#6b7280',fontSize:'13px'}}>{user?.name}</span>
          {user?.systemUid&&<span style={{color:'#7c3aed',fontFamily:'monospace',fontSize:'12px'}}>{user.systemUid}</span>}
          <button onClick={logout} className="btn btn-outline" style={{fontSize:'11px',padding:'5px 12px',color:'#dc2626',borderColor:'#fca5a5'}}>Logout</button>
        </div>
      </header>
      <div className="tab-bar" style={{paddingLeft:'24px',background:'#fff',flexShrink:0}}>
        {tabs.map(t=><button key={t.key} onClick={()=>setTab(t.key)} className={`tab-btn ${tab===t.key?'active':''}`} style={tab===t.key?{color:'#7c3aed',borderBottomColor:'#7c3aed'}:{}}>{t.label}</button>)}
      </div>
      <main style={{flex:1,padding:'28px 24px',overflowY:'auto'}}>{renderTab()}</main>
      <footer style={{borderTop:'1px solid #e5e7eb',padding:'12px 24px',textAlign:'center',color:'#9ca3af',fontSize:'11px',background:'#fff'}}>Powered by EduCore</footer>
    </div>
  );
};

export default StudentDashboard;
