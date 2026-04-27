import React, { useContext, useState, useEffect } from 'react';
import { AuthContext, TenantContext } from '../../App';
import axios from 'axios';

const L = ({children}) => <label style={{display:'block',marginBottom:'5px',fontSize:'13px',fontWeight:500,color:'#374151'}}>{children}</label>;

/* ─── Classes ─── */
const ClassesTab = () => {
  const [classes, setClasses] = useState([]); const [name, setName] = useState('');
  const [sel, setSel] = useState(null); const [students, setStudents] = useState([]);
  const load = () => axios.get('/api/sis/classes').then(r => setClasses(r.data));
  useEffect(() => { load(); }, []);
  const add = async (e) => { e.preventDefault(); if(!name.trim()) return; await axios.post('/api/sis/classes', { name }); setName(''); load(); };
  const viewClass = async (c) => { setSel(c); const r = await axios.get(`/api/sis/students/class/${c.id}`); setStudents(r.data); };

  if (sel) return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px'}}>
        <button onClick={()=>setSel(null)} className="btn btn-outline" style={{padding:'6px 12px',fontSize:'12px'}}>← Back</button>
        <h2 style={{fontSize:'18px',fontWeight:600}}>{sel.name}</h2>
        <span style={{color:'#9ca3af',fontSize:'13px'}}>{students.length} students</span>
      </div>
      <table className="tbl"><thead><tr><th>UID</th><th>Name</th><th>Username</th></tr></thead>
      <tbody>{students.map(s=><tr key={s.id}><td style={{fontFamily:'monospace',fontSize:'12px',color:'#2563eb'}}>{s.system_uid}</td><td>{s.name}</td><td style={{color:'#6b7280'}}>{s.username}</td></tr>)}
      {students.length===0&&<tr><td colSpan={3} style={{color:'#9ca3af',textAlign:'center',padding:'24px'}}>No students in this class</td></tr>}</tbody></table>
    </div>
  );

  return (
    <div>
      <h2 style={{fontSize:'18px',fontWeight:600,marginBottom:'20px'}}>Classes & Batches</h2>
      <form onSubmit={add} style={{display:'flex',gap:'10px',marginBottom:'24px',maxWidth:'400px'}}>
        <input className="field" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Class 10-A" required style={{flex:1}} />
        <button type="submit" className="btn btn-primary">Add</button>
      </form>
      <table className="tbl"><thead><tr><th>Class Name</th><th>Students</th><th></th></tr></thead>
      <tbody>{classes.map(c=><tr key={c.id} className="clickable" onClick={()=>viewClass(c)}><td style={{fontWeight:500}}>{c.name}</td><td>{c.student_count}</td><td style={{color:'#2563eb',fontSize:'13px'}}>View →</td></tr>)}
      {classes.length===0&&<tr><td colSpan={3} style={{color:'#9ca3af',textAlign:'center',padding:'24px'}}>No classes yet</td></tr>}</tbody></table>
    </div>
  );
};

/* ─── Students ─── */
const StudentsTab = () => {
  const tenant = useContext(TenantContext);
  const [students, setStudents] = useState([]); const [classes, setClasses] = useState([]);
  const [show, setShow] = useState(false); const [editPw, setEditPw] = useState(null); const [newPw, setNewPw] = useState('');
  const [form, setForm] = useState({name:'',username:'',password:'',class_id:''});
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const load = async () => { const [s,c] = await Promise.all([axios.get('/api/sis/students'),axios.get('/api/sis/classes')]); setStudents(s.data); setClasses(c.data); };
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault(); setErr('');
    try { await axios.post('/api/sis/students', form); setForm({name:'',username:'',password:'',class_id:''}); setShow(false); setMsg('Student added'); load(); }
    catch(e) { setErr(e.response?.data?.error||'Failed'); }
    setTimeout(()=>setMsg(''),3000);
  };
  const changePw = async () => {
    if(!newPw.trim()) return;
    await axios.put(`/api/sis/students/${editPw.id}/password`, {password:newPw});
    setEditPw(null); setNewPw(''); setMsg('Password updated'); load(); setTimeout(()=>setMsg(''),3000);
  };
  const studentUrl = `http://${tenant?.subdomain}.localhost:${window.location.port||5173}/student-login`;

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <h2 style={{fontSize:'18px',fontWeight:600}}>Students</h2>
        <button onClick={()=>{setShow(!show);setErr('');}} className="btn btn-primary">{show?'Cancel':'+ Add Student'}</button>
      </div>
      <div style={{background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:'6px',padding:'10px 14px',marginBottom:'20px',fontSize:'12px',color:'#6b7280'}}>
        Student login link: <code style={{color:'#2563eb'}}>{studentUrl}</code>
      </div>
      {msg && <p style={{color:'#15803d',fontSize:'13px',marginBottom:'12px'}}>✓ {msg}</p>}

      {show && (
        <div className="card" style={{padding:'20px',marginBottom:'20px',maxWidth:'420px'}}>
          <form onSubmit={add} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            <div><L>Full Name</L><input className="field" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Student name" required /></div>
            <div><L>Username</L><input className="field" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} placeholder="Login username" required /></div>
            <div><L>Password</L><input className="field" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Login password" required /></div>
            <div><L>Class</L><select className="field" value={form.class_id} onChange={e=>setForm({...form,class_id:e.target.value})}><option value="">No class</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            {err && <p style={{color:'#dc2626',fontSize:'13px'}}>{err}</p>}
            <button type="submit" className="btn btn-primary">Create Student</button>
          </form>
        </div>
      )}

      {editPw && (
        <div className="modal-overlay" onClick={()=>setEditPw(null)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()} style={{padding:'24px'}}>
            <h3 style={{fontWeight:600,marginBottom:'4px'}}>Change Password</h3>
            <p style={{color:'#6b7280',fontSize:'13px',marginBottom:'16px'}}>{editPw.name} ({editPw.username})</p>
            <div style={{marginBottom:'12px'}}><L>Current Password</L><div className="field" style={{background:'#f9fafb',color:'#374151'}}>{editPw.password}</div></div>
            <div style={{marginBottom:'16px'}}><L>New Password</L><input className="field" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Enter new password" /></div>
            <div style={{display:'flex',gap:'10px'}}><button onClick={changePw} className="btn btn-primary">Update</button><button onClick={()=>setEditPw(null)} className="btn btn-outline">Cancel</button></div>
          </div>
        </div>
      )}

      <table className="tbl"><thead><tr><th>UID</th><th>Name</th><th>Username</th><th>Class</th><th>Password</th><th></th></tr></thead>
      <tbody>{students.map(s=><tr key={s.id}>
        <td style={{fontFamily:'monospace',fontSize:'12px',color:'#2563eb'}}>{s.system_uid}</td>
        <td style={{fontWeight:500}}>{s.name}</td><td style={{color:'#6b7280'}}>{s.username}</td><td>{s.class_name||'—'}</td>
        <td style={{fontFamily:'monospace',fontSize:'12px',color:'#6b7280'}}>{s.password}</td>
        <td><button onClick={()=>{setEditPw(s);setNewPw('');}} style={{color:'#2563eb',background:'none',border:'none',cursor:'pointer',fontSize:'13px'}}>Change</button></td>
      </tr>)}
      {students.length===0&&<tr><td colSpan={6} style={{color:'#9ca3af',textAlign:'center',padding:'24px'}}>No students yet</td></tr>}</tbody></table>
    </div>
  );
};

/* ─── Attendance ─── */
const AttendanceTab = () => {
  const [classes, setClasses] = useState([]); const [selClass, setSelClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState([]); const [msg, setMsg] = useState('');
  useEffect(() => { axios.get('/api/sis/classes').then(r=>setClasses(r.data)); }, []);

  const loadStudents = async () => {
    if(!selClass) { setRecords([]); return; }
    const r = await axios.get(`/api/attendance/class/${selClass}?date=${date}`);
    setRecords(r.data);
  };
  useEffect(() => { if(selClass) loadStudents(); }, [selClass, date]);

  const toggle = (i) => { const u=[...records]; u[i].status = u[i].status==='present'?'absent':'present'; setRecords(u); };
  const markAll = (s) => setRecords(records.map(r=>({...r,status:s})));
  const save = async () => {
    await axios.post('/api/attendance/mark', { date, records: records.map(r=>({student_id:r.student_id,status:r.status})) });
    setMsg('Saved!'); setTimeout(()=>setMsg(''),3000);
  };

  return (
    <div>
      <h2 style={{fontSize:'18px',fontWeight:600,marginBottom:'20px'}}>Mark Attendance</h2>
      <div style={{display:'flex',gap:'10px',marginBottom:'20px',flexWrap:'wrap'}}>
        <select className="field" style={{maxWidth:'200px'}} value={selClass} onChange={e=>setSelClass(e.target.value)}>
          <option value="">Select Class</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" className="field" style={{maxWidth:'170px'}} value={date} onChange={e=>setDate(e.target.value)} />
      </div>
      {msg && <p style={{color:'#15803d',fontSize:'13px',marginBottom:'12px'}}>✓ {msg}</p>}
      {!selClass && <p style={{color:'#9ca3af',fontSize:'13px'}}>Select a class to mark attendance.</p>}
      {selClass && records.length>0 && (
        <>
          <div style={{display:'flex',gap:'8px',marginBottom:'14px'}}>
            <button onClick={()=>markAll('present')} className="btn btn-outline" style={{fontSize:'12px',padding:'5px 12px'}}>All Present</button>
            <button onClick={()=>markAll('absent')} className="btn btn-outline" style={{fontSize:'12px',padding:'5px 12px'}}>All Absent</button>
          </div>
          <table className="tbl" style={{marginBottom:'16px'}}><thead><tr><th>UID</th><th>Name</th><th>Status</th></tr></thead>
          <tbody>{records.map((r,i)=><tr key={i} className="clickable" onClick={()=>toggle(i)}>
            <td style={{fontFamily:'monospace',fontSize:'12px',color:'#2563eb'}}>{r.system_uid}</td>
            <td>{r.student_name}</td>
            <td><span className={`badge ${r.status==='present'?'badge-present':'badge-absent'}`}>{r.status}</span></td>
          </tr>)}</tbody></table>
          <button onClick={save} className="btn btn-primary">Save Attendance</button>
        </>
      )}
      {selClass && records.length===0 && <p style={{color:'#9ca3af',fontSize:'13px'}}>No students in this class.</p>}
    </div>
  );
};

/* ─── Results ─── */
const ResultsTab = () => {
  const [classes, setClasses] = useState([]); const [selClass, setSelClass] = useState('');
  const [students, setStudents] = useState([]); const [results, setResults] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({system_uid:'',exam_name:'',score:'',grades:''}); const [msg, setMsg] = useState('');
  useEffect(() => { axios.get('/api/sis/classes').then(r=>setClasses(r.data)); axios.get('/api/results').then(r=>setResults(r.data)); }, []);
  useEffect(() => { if(selClass) axios.get(`/api/sis/students/class/${selClass}`).then(r=>setStudents(r.data)); else setStudents([]); }, [selClass]);

  const publish = async (e) => {
    e.preventDefault();
    try { await axios.post('/api/results', {...form, score:parseFloat(form.score), published:1}); setForm({system_uid:'',exam_name:'',score:'',grades:''}); setShow(false); setMsg('Published!'); axios.get('/api/results').then(r=>setResults(r.data)); }
    catch(e) { setMsg(e.response?.data?.error||'Failed'); }
    setTimeout(()=>setMsg(''),3000);
  };

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <h2 style={{fontSize:'18px',fontWeight:600}}>Results</h2>
        <button onClick={()=>setShow(!show)} className="btn btn-primary">{show?'Cancel':'+ Publish Result'}</button>
      </div>
      {msg && <p style={{color:'#15803d',fontSize:'13px',marginBottom:'12px'}}>✓ {msg}</p>}
      {show && (
        <div className="card" style={{padding:'20px',marginBottom:'20px',maxWidth:'420px'}}>
          <form onSubmit={publish} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            <div><L>Select Class</L><select className="field" value={selClass} onChange={e=>setSelClass(e.target.value)}><option value="">Select class first</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            {selClass && <div><L>Student</L><select className="field" required value={form.system_uid} onChange={e=>setForm({...form,system_uid:e.target.value})}><option value="">Select Student</option>{students.map(s=><option key={s.id} value={s.system_uid}>{s.system_uid} — {s.name}</option>)}</select></div>}
            <div><L>Exam Name</L><input className="field" placeholder="e.g. Unit Test 1" required value={form.exam_name} onChange={e=>setForm({...form,exam_name:e.target.value})} /></div>
            <div style={{display:'flex',gap:'10px'}}><div style={{flex:1}}><L>Score</L><input className="field" type="number" required value={form.score} onChange={e=>setForm({...form,score:e.target.value})} /></div><div style={{flex:1}}><L>Grade</L><input className="field" value={form.grades} onChange={e=>setForm({...form,grades:e.target.value})} /></div></div>
            <button type="submit" className="btn btn-primary">Publish</button>
          </form>
        </div>
      )}
      <table className="tbl"><thead><tr><th>UID</th><th>Student</th><th>Exam</th><th>Score</th><th>Grade</th></tr></thead>
      <tbody>{results.map((r,i)=><tr key={i}><td style={{fontFamily:'monospace',fontSize:'12px',color:'#2563eb'}}>{r.system_uid}</td><td>{r.name}</td><td>{r.exam_name}</td><td>{r.score}</td><td style={{color:'#7c3aed',fontWeight:600}}>{r.grades||'—'}</td></tr>)}
      {results.length===0&&<tr><td colSpan={5} style={{color:'#9ca3af',textAlign:'center',padding:'24px'}}>No results</td></tr>}</tbody></table>
    </div>
  );
};

/* ─── Notices ─── */
const NoticesTab = () => {
  const [list, setList] = useState([]); const [text, setText] = useState('');
  useEffect(()=>{axios.get('/api/communication').then(r=>setList(r.data));},[]);
  const post = async (e) => { e.preventDefault(); await axios.post('/api/communication',{message:text}); setText(''); axios.get('/api/communication').then(r=>setList(r.data)); };
  return (
    <div>
      <h2 style={{fontSize:'18px',fontWeight:600,marginBottom:'20px'}}>Notices</h2>
      <form onSubmit={post} style={{maxWidth:'540px',marginBottom:'28px'}}>
        <textarea className="field" rows={3} value={text} onChange={e=>setText(e.target.value)} placeholder="Write a notice..." required style={{marginBottom:'10px'}} />
        <button type="submit" className="btn btn-primary">Post Notice</button>
      </form>
      <div style={{display:'flex',flexDirection:'column',gap:'10px',maxWidth:'540px'}}>
        {list.map(a=>(<div key={a.id} className="card" style={{padding:'14px 16px'}}><p style={{lineHeight:1.6,whiteSpace:'pre-line'}}>{a.message}</p><p style={{color:'#9ca3af',fontSize:'11px',marginTop:'10px'}}>By {a.author} · {new Date(a.created_at).toLocaleString()}</p></div>))}
        {list.length===0&&<p style={{color:'#9ca3af'}}>No notices yet.</p>}
      </div>
    </div>
  );
};

/* ─── Messages ─── */
const MessagesTab = () => {
  const [inbox, setInbox] = useState([]); const [sel, setSel] = useState(null); const [reply, setReply] = useState('');
  useEffect(()=>{axios.get('/api/messages/inbox').then(r=>setInbox(r.data));},[]);
  const open = async (m) => { setSel(m); if(!m.is_read){await axios.put(`/api/messages/${m.id}/read`);setInbox(p=>p.map(x=>x.id===m.id?{...x,is_read:1}:x));} };
  const send = async () => { if(!reply.trim())return; await axios.post('/api/messages',{receiver_id:sel.sender_id,subject:`Re: ${sel.subject}`,body:reply}); setReply(''); alert('Reply sent'); };
  return (
    <div>
      <h2 style={{fontSize:'18px',fontWeight:600,marginBottom:'20px'}}>Messages</h2>
      <div style={{display:'flex',gap:'14px',minHeight:'360px'}}>
        <div style={{width:'260px',flexShrink:0,border:'1px solid #e5e7eb',borderRadius:'8px',overflowY:'auto',background:'#fff'}}>
          {inbox.map(m=>(<div key={m.id} onClick={()=>open(m)} style={{padding:'12px 14px',borderBottom:'1px solid #f3f4f6',cursor:'pointer',background:sel?.id===m.id?'#f9fafb':'#fff'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'2px'}}><span style={{fontWeight:m.is_read?400:600,fontSize:'13px'}}>{m.sender_name}</span>{!m.is_read&&<span style={{width:'7px',height:'7px',background:'#2563eb',borderRadius:'50%',display:'inline-block'}}/>}</div>
            <div style={{color:'#6b7280',fontSize:'12px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.subject||'(no subject)'}</div>
            <div style={{color:'#d1d5db',fontSize:'11px',marginTop:'3px'}}>{new Date(m.created_at).toLocaleDateString()}</div>
          </div>))}
          {inbox.length===0&&<div style={{padding:'20px',color:'#9ca3af',textAlign:'center',fontSize:'13px'}}>No messages</div>}
        </div>
        <div style={{flex:1,border:'1px solid #e5e7eb',borderRadius:'8px',background:'#fff',padding:sel?'20px':'0',display:'flex',flexDirection:'column'}}>
          {sel?(<><h3 style={{fontSize:'15px',fontWeight:600,marginBottom:'2px'}}>{sel.subject||'(no subject)'}</h3><p style={{color:'#6b7280',fontSize:'12px',marginBottom:'14px'}}>From {sel.sender_name} · {new Date(sel.created_at).toLocaleString()}</p><div style={{flex:1,color:'#374151',whiteSpace:'pre-line',lineHeight:1.7,fontSize:'14px',marginBottom:'20px'}}>{sel.body}</div><div style={{borderTop:'1px solid #e5e7eb',paddingTop:'14px'}}><textarea className="field" rows={2} value={reply} onChange={e=>setReply(e.target.value)} placeholder="Reply..." style={{marginBottom:'10px'}}/><button onClick={send} className="btn btn-primary">Send Reply</button></div></>):(<div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'#d1d5db',fontSize:'13px'}}>Select a message</div>)}
        </div>
      </div>
    </div>
  );
};

/* ─── Complaints ─── */
const ComplaintsTab = () => {
  const [list, setList] = useState([]); const [sel, setSel] = useState(null); const [reply, setReply] = useState('');
  useEffect(()=>{axios.get('/api/messages/complaints').then(r=>setList(r.data));},[]);
  const send = async () => { if(!reply.trim())return; await axios.put(`/api/messages/complaints/${sel.id}/reply`,{reply,status:'resolved'}); setReply(''); setSel(null); axios.get('/api/messages/complaints').then(r=>setList(r.data)); };
  if(sel) return (
    <div style={{maxWidth:'540px'}}>
      <button onClick={()=>setSel(null)} className="btn btn-outline" style={{marginBottom:'16px',fontSize:'12px',padding:'6px 12px'}}>← Back</button>
      <div style={{marginBottom:'12px'}}><span className={`badge ${sel.status==='open'?'badge-warn':'badge-present'}`}>{sel.status}</span> <span style={{color:'#6b7280',fontSize:'12px',marginLeft:'8px'}}>{sel.student_name}</span></div>
      <h3 style={{fontWeight:600,marginBottom:'8px'}}>{sel.subject}</h3>
      <p style={{color:'#374151',whiteSpace:'pre-line',lineHeight:1.7,marginBottom:'16px'}}>{sel.body}</p>
      {sel.admin_reply&&<div style={{background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:'6px',padding:'12px',marginBottom:'16px'}}><p style={{color:'#6b7280',fontSize:'11px',marginBottom:'4px'}}>YOUR REPLY</p><p>{sel.admin_reply}</p></div>}
      {sel.status==='open'&&<div><textarea className="field" rows={3} value={reply} onChange={e=>setReply(e.target.value)} placeholder="Reply..." style={{marginBottom:'10px'}}/><button onClick={send} className="btn btn-primary">Reply & Resolve</button></div>}
    </div>
  );
  return (
    <div>
      <h2 style={{fontSize:'18px',fontWeight:600,marginBottom:'20px'}}>Complaints</h2>
      <table className="tbl"><thead><tr><th>Student</th><th>Subject</th><th>Status</th><th>Date</th></tr></thead>
      <tbody>{list.map(c=><tr key={c.id} className="clickable" onClick={()=>setSel(c)}><td>{c.student_name}</td><td>{c.subject}</td><td><span className={`badge ${c.status==='open'?'badge-warn':'badge-present'}`}>{c.status}</span></td><td style={{color:'#6b7280',fontSize:'12px'}}>{new Date(c.created_at).toLocaleDateString()}</td></tr>)}
      {list.length===0&&<tr><td colSpan={4} style={{color:'#9ca3af',textAlign:'center',padding:'24px'}}>No complaints</td></tr>}</tbody></table>
    </div>
  );
};

/* ─── Shell ─── */
const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const tenant = useContext(TenantContext);
  const [tab, setTab] = useState('classes');
  const displayName = tenant?.name || tenant?.subdomain || 'Institution';
  const tabs = [{key:'classes',label:'Classes'},{key:'students',label:'Students'},{key:'attendance',label:'Attendance'},{key:'results',label:'Results'},{key:'notices',label:'Notices'},{key:'messages',label:'Messages'},{key:'complaints',label:'Complaints'}];

  const renderTab = () => { switch(tab){case 'classes':return <ClassesTab/>;case 'students':return <StudentsTab/>;case 'attendance':return <AttendanceTab/>;case 'results':return <ResultsTab/>;case 'notices':return <NoticesTab/>;case 'messages':return <MessagesTab/>;case 'complaints':return <ComplaintsTab/>;default:return <ClassesTab/>;} };

  return (
    <div style={{minHeight:'100vh',background:'#fafafa',display:'flex',flexDirection:'column',fontFamily:"'Inter',system-ui,sans-serif"}}>
      <header style={{borderBottom:'1px solid #e5e7eb',padding:'0 24px',display:'flex',alignItems:'center',justifyContent:'space-between',height:'50px',background:'#fff',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'26px',height:'26px',background:'#2563eb',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'#fff',fontSize:'12px'}}>{displayName.charAt(0)}</div>
          <span style={{fontWeight:600,fontSize:'14px',color:'#111827'}}>{displayName}</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
          <span style={{color:'#6b7280',fontSize:'13px'}}>{user?.name}</span>
          <button onClick={logout} className="btn btn-outline" style={{fontSize:'11px',padding:'5px 12px',color:'#dc2626',borderColor:'#fca5a5'}}>Logout</button>
        </div>
      </header>
      <div className="tab-bar" style={{paddingLeft:'24px',background:'#fff',flexShrink:0}}>
        {tabs.map(t=><button key={t.key} onClick={()=>setTab(t.key)} className={`tab-btn ${tab===t.key?'active':''}`}>{t.label}</button>)}
      </div>
      <main style={{flex:1,padding:'28px 24px',overflowY:'auto'}}>{renderTab()}</main>
      <footer style={{borderTop:'1px solid #e5e7eb',padding:'12px 24px',textAlign:'center',color:'#9ca3af',fontSize:'11px',background:'#fff'}}>Powered by EduCore</footer>
    </div>
  );
};

export default AdminDashboard;
