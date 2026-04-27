import React, { useContext, useState, useEffect } from 'react';
import { AuthContext, TenantContext } from '../../App';
import axios from 'axios';

const L = ({children}) => <label style={{display:'block',marginBottom:'5px',fontSize:'13px',fontWeight:600,color:'#475569'}}>{children}</label>;

/* ─── Dashboard ─── */
const DashboardHome = () => {
  const [stats, setStats] = useState({ students: 0, classes: 0, attendance: 0 });
  useEffect(() => {
    const load = async () => {
      const [s, c] = await Promise.all([axios.get('/api/sis/students'), axios.get('/api/sis/classes')]);
      setStats({ students: s.data.length, classes: c.data.length, attendance: 94.2 });
    };
    load();
  }, []);

  return (
    <div>
      <h2 style={{fontSize:'24px',fontWeight:700,marginBottom:'8px'}}>Institutional Dashboard</h2>
      <p style={{color:'#64748b',fontSize:'14px',marginBottom:'32px'}}>Overview of academic performance and administrative metrics.</p>
      
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))',gap:'20px',marginBottom:'40px'}}>
        <div className="card" style={{padding:'24px'}}>
          <div style={{color:'#64748b',fontSize:'12px',fontWeight:700,letterSpacing:'0.05em',textTransform:'uppercase',marginBottom:'12px'}}>Total Enrollment</div>
          <div style={{fontSize:'32px',fontWeight:700,color:'#0f172a'}}>{stats.students.toLocaleString()}</div>
          <div style={{marginTop:'8px',fontSize:'12px',color:'#10b981',fontWeight:600}}>+4.2% from last month</div>
        </div>
        <div className="card" style={{padding:'24px'}}>
          <div style={{color:'#64748b',fontSize:'12px',fontWeight:700,letterSpacing:'0.05em',textTransform:'uppercase',marginBottom:'12px'}}>Avg. Attendance</div>
          <div style={{fontSize:'32px',fontWeight:700,color:'#0f172a'}}>{stats.attendance}%</div>
          <div style={{marginTop:'8px',fontSize:'12px',color:'#64748b'}}>Stable</div>
        </div>
        <div className="card" style={{padding:'24px'}}>
          <div style={{color:'#64748b',fontSize:'12px',fontWeight:700,letterSpacing:'0.05em',textTransform:'uppercase',marginBottom:'12px'}}>Classes Active</div>
          <div style={{fontSize:'32px',fontWeight:700,color:'#0f172a'}}>{stats.classes}</div>
          <div style={{marginTop:'8px',fontSize:'12px',color:'#64748b'}}>All sessions ongoing</div>
        </div>
      </div>

      <div className="card" style={{padding:'24px'}}>
        <h3 style={{fontSize:'18px',fontWeight:700,marginBottom:'20px'}}>System Modules</h3>
        <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
          {['SIS Management', 'Attendance Tracker', 'Result Publisher', 'Notice Board'].map(m => (
            <div key={m} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px',background:'#f8fafc',borderRadius:'8px'}}>
              <span style={{fontWeight:600,fontSize:'14px'}}>{m}</span>
              <span className="badge badge-present">Active</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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
      <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'24px'}}>
        <button onClick={()=>setSel(null)} className="btn btn-outline btn-sm">← Back</button>
        <h2 style={{fontSize:'20px',fontWeight:700}}>{sel.name}</h2>
      </div>
      <div className="card">
        <table className="tbl"><thead><tr><th>UID</th><th>Name</th><th>Username</th></tr></thead>
        <tbody>{students.map(s=><tr key={s.id}><td style={{fontFamily:'monospace',fontSize:'12px',color:'#2563eb'}}>{s.system_uid}</td><td style={{fontWeight:500}}>{s.name}</td><td style={{color:'#64748b'}}>{s.username}</td></tr>)}
        {students.length===0&&<tr><td colSpan={3} style={{color:'#94a3b8',textAlign:'center',padding:'32px'}}>No students in this class</td></tr>}</tbody></table>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
        <h2 style={{fontSize:'20px',fontWeight:700}}>Classes & Batches</h2>
        <form onSubmit={add} style={{display:'flex',gap:'8px'}}>
          <input className="field" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Class 10-A" required style={{width:'200px'}} />
          <button type="submit" className="btn btn-primary">Add Class</button>
        </form>
      </div>
      <div className="card">
        <table className="tbl"><thead><tr><th>Class Name</th><th>Students</th><th style={{textAlign:'right'}}>Action</th></tr></thead>
        <tbody>{classes.map(c=><tr key={c.id} className="clickable" onClick={()=>viewClass(c)}><td style={{fontWeight:600}}>{c.name}</td><td>{c.student_count}</td><td style={{textAlign:'right',color:'#2563eb',fontSize:'13px',fontWeight:600}}>Manage →</td></tr>)}
        {classes.length===0&&<tr><td colSpan={3} style={{color:'#94a3b8',textAlign:'center',padding:'32px'}}>No classes yet</td></tr>}</tbody></table>
      </div>
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
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
        <h2 style={{fontSize:'20px',fontWeight:700}}>Student Management</h2>
        <button onClick={()=>{setShow(!show);setErr('');}} className="btn btn-primary">{show?'Cancel':'+ New Enrollment'}</button>
      </div>
      <div style={{background:'#f1f5f9',borderRadius:'8px',padding:'12px 16px',marginBottom:'24px',fontSize:'13px',color:'#475569',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span>Student Login URL: <code style={{color:'#2563eb',marginLeft:'8px',fontWeight:600}}>{studentUrl}</code></span>
        <button onClick={()=>navigator.clipboard.writeText(studentUrl)} style={{background:'none',border:'none',color:'#2563eb',cursor:'pointer',fontSize:'11px',fontWeight:700}}>COPY</button>
      </div>
      {msg && <p style={{color:'#10b981',fontSize:'13px',fontWeight:600,marginBottom:'16px'}}>✓ {msg}</p>}

      {show && (
        <div className="card" style={{padding:'24px',marginBottom:'32px',maxWidth:'440px'}}>
          <form onSubmit={add} style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            <div><L>Full Name</L><input className="field" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. John Doe" required /></div>
            <div><L>Username</L><input className="field" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} placeholder="e.g. john123" required /></div>
            <div><L>Password</L><input className="field" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Set password" required /></div>
            <div><L>Assign Class</L><select className="field" value={form.class_id} onChange={e=>setForm({...form,class_id:e.target.value})}><option value="">No class</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            {err && <p style={{color:'#dc2626',fontSize:'13px',fontWeight:500}}>{err}</p>}
            <button type="submit" className="btn btn-primary">Enroll Student</button>
          </form>
        </div>
      )}

      {editPw && (
        <div className="modal-overlay" onClick={()=>setEditPw(null)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()} style={{padding:'32px'}}>
            <h3 style={{fontSize:'18px',fontWeight:700,marginBottom:'8px'}}>Manage Credentials</h3>
            <p style={{color:'#64748b',fontSize:'13px',marginBottom:'24px'}}>{editPw.name} ({editPw.username})</p>
            <div style={{marginBottom:'16px'}}><L>Current Password</L><div className="field" style={{background:'#f8fafc',color:'#475569',fontWeight:600}}>{editPw.password}</div></div>
            <div style={{marginBottom:'24px'}}><L>New Password</L><input className="field" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Enter new password" /></div>
            <div style={{display:'flex',gap:'12px'}}><button onClick={changePw} className="btn btn-primary" style={{flex:1}}>Update Password</button><button onClick={()=>setEditPw(null)} className="btn btn-outline" style={{flex:1}}>Cancel</button></div>
          </div>
        </div>
      )}

      <div className="card">
        <table className="tbl"><thead><tr><th>UID</th><th>Student Name</th><th>Username</th><th>Class</th><th>Password</th><th style={{textAlign:'right'}}>Action</th></tr></thead>
        <tbody>{students.map(s=><tr key={s.id}>
          <td style={{fontFamily:'monospace',fontSize:'12px',color:'#2563eb',fontWeight:600}}>{s.system_uid}</td>
          <td style={{fontWeight:600}}>{s.name}</td><td style={{color:'#64748b'}}>{s.username}</td><td>{s.class_name||'—'}</td>
          <td style={{fontFamily:'monospace',fontSize:'12px',color:'#94a3b8'}}>{s.password}</td>
          <td style={{textAlign:'right'}}><button onClick={()=>{setEditPw(s);setNewPw('');}} style={{color:'#2563eb',background:'none',border:'none',cursor:'pointer',fontSize:'13px',fontWeight:600}}>Edit</button></td>
        </tr>)}
        {students.length===0&&<tr><td colSpan={6} style={{color:'#94a3b8',textAlign:'center',padding:'32px'}}>No students found</td></tr>}</tbody></table>
      </div>
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
      <h2 style={{fontSize:'20px',fontWeight:700,marginBottom:'24px'}}>Daily Attendance</h2>
      <div style={{display:'flex',gap:'12px',marginBottom:'32px',flexWrap:'wrap'}}>
        <select className="field" style={{maxWidth:'220px'}} value={selClass} onChange={e=>setSelClass(e.target.value)}>
          <option value="">Select Class</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" className="field" style={{maxWidth:'180px'}} value={date} onChange={e=>setDate(e.target.value)} />
      </div>
      {msg && <p style={{color:'#10b981',fontSize:'13px',fontWeight:600,marginBottom:'16px'}}>✓ {msg}</p>}
      {!selClass && <div className="card" style={{padding:'40px',textAlign:'center',color:'#94a3b8'}}>Select a class to mark attendance records.</div>}
      {selClass && records.length>0 && (
        <>
          <div style={{display:'flex',gap:'10px',marginBottom:'16px'}}>
            <button onClick={()=>markAll('present')} className="btn btn-outline btn-sm">Mark All Present</button>
            <button onClick={()=>markAll('absent')} className="btn btn-outline btn-sm">Mark All Absent</button>
          </div>
          <div className="card" style={{marginBottom:'24px'}}>
            <table className="tbl"><thead><tr><th>UID</th><th>Student Name</th><th>Status</th></tr></thead>
            <tbody>{records.map((r,i)=><tr key={i} className="clickable" onClick={()=>toggle(i)}>
              <td style={{fontFamily:'monospace',fontSize:'12px',color:'#2563eb',fontWeight:600}}>{r.system_uid}</td>
              <td style={{fontWeight:500}}>{r.student_name}</td>
              <td><span className={`badge ${r.status==='present'?'badge-present':'badge-absent'}`}>{r.status}</span></td>
            </tr>)}</tbody></table>
          </div>
          <button onClick={save} className="btn btn-primary" style={{padding:'12px 32px'}}>Confirm Attendance</button>
        </>
      )}
      {selClass && records.length===0 && <div className="card" style={{padding:'40px',textAlign:'center',color:'#94a3b8'}}>No students enrolled in this class.</div>}
    </div>
  );
};

/* ─── Results ─── */
const ResultsTab = () => {
  const [classes, setClasses] = useState([]); const [selClass, setSelClass] = useState('');
  const [students, setStudents] = useState([]); const [results, setResults] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({system_uid:'',exam_name:'',score:''}); const [msg, setMsg] = useState('');
  useEffect(() => { axios.get('/api/sis/classes').then(r=>setClasses(r.data)); axios.get('/api/results').then(r=>setResults(r.data)); }, []);
  useEffect(() => { if(selClass) axios.get(`/api/sis/students/class/${selClass}`).then(r=>setStudents(r.data)); else setStudents([]); }, [selClass]);

  const publish = async (e) => {
    e.preventDefault();
    try { await axios.post('/api/results', {...form, score:parseFloat(form.score), published:1}); setForm({system_uid:'',exam_name:'',score:''}); setShow(false); setMsg('Result published'); axios.get('/api/results').then(r=>setResults(r.data)); }
    catch(e) { setMsg(e.response?.data?.error||'Failed'); }
    setTimeout(()=>setMsg(''),3000);
  };

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
        <h2 style={{fontSize:'20px',fontWeight:700}}>Performance Records</h2>
        <button onClick={()=>setShow(!show)} className="btn btn-primary">{show?'Cancel':'+ Publish Result'}</button>
      </div>
      {msg && <p style={{color:'#10b981',fontSize:'13px',fontWeight:600,marginBottom:'16px'}}>✓ {msg}</p>}
      {show && (
        <div className="card" style={{padding:'24px',marginBottom:'32px',maxWidth:'440px'}}>
          <form onSubmit={publish} style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            <div><L>Select Class</L><select className="field" value={selClass} onChange={e=>setSelClass(e.target.value)}><option value="">Select class</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            {selClass && <div><L>Select Student</L><select className="field" required value={form.system_uid} onChange={e=>setForm({...form,system_uid:e.target.value})}><option value="">Select Student</option>{students.map(s=><option key={s.id} value={s.system_uid}>{s.system_uid} — {s.name}</option>)}</select></div>}
            <div><L>Assessment Title</L><input className="field" placeholder="e.g. Mid-term Examination" required value={form.exam_name} onChange={e=>setForm({...form,exam_name:e.target.value})} /></div>
            <div><L>Score (Percentage)</L><input className="field" type="number" step="0.1" required value={form.score} onChange={e=>setForm({...form,score:e.target.value})} /></div>
            <button type="submit" className="btn btn-primary">Submit Record</button>
          </form>
        </div>
      )}
      <div className="card">
        <table className="tbl"><thead><tr><th>UID</th><th>Student Name</th><th>Assessment</th><th>Score</th></tr></thead>
        <tbody>{results.map((r,i)=><tr key={i}><td style={{fontFamily:'monospace',fontSize:'12px',color:'#2563eb',fontWeight:600}}>{r.system_uid}</td><td style={{fontWeight:600}}>{r.name}</td><td>{r.exam_name}</td><td style={{fontFamily:'monospace',fontWeight:700,color:'#0f172a'}}>{r.score}%</td></tr>)}
        {results.length===0&&<tr><td colSpan={4} style={{color:'#94a3b8',textAlign:'center',padding:'32px'}}>No records found</td></tr>}</tbody></table>
      </div>
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
      <h2 style={{fontSize:'20px',fontWeight:700,marginBottom:'24px'}}>Notice Board</h2>
      <form onSubmit={post} style={{maxWidth:'600px',marginBottom:'32px'}}>
        <textarea className="field" rows={3} value={text} onChange={e=>setText(e.target.value)} placeholder="Announce something to all students..." required style={{marginBottom:'12px',resize:'none'}} />
        <button type="submit" className="btn btn-primary">Publish Notice</button>
      </form>
      <div style={{display:'flex',flexDirection:'column',gap:'16px',maxWidth:'600px'}}>
        {list.map(a=>(<div key={a.id} className="card" style={{padding:'20px'}}><p style={{lineHeight:1.7,color:'#334155',whiteSpace:'pre-line'}}>{a.message}</p><div style={{marginTop:'16px',display:'flex',alignItems:'center',gap:'8px',color:'#94a3b8',fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>By {a.author} · {new Date(a.created_at).toLocaleDateString()}</div></div>))}
        {list.length===0&&<div className="card" style={{padding:'40px',textAlign:'center',color:'#94a3b8'}}>No announcements yet.</div>}
      </div>
    </div>
  );
};

/* ─── Messages ─── */
const MessagesTab = () => {
  const [inbox, setInbox] = useState([]); const [sel, setSel] = useState(null); const [reply, setReply] = useState('');
  const [compose, setCompose] = useState(false); const [students, setStudents] = useState([]);
  const [msgForm, setMsgForm] = useState({receiver_id:'',subject:'',body:''});
  const loadInbox = () => axios.get('/api/messages/inbox').then(r=>setInbox(r.data));
  useEffect(()=>{loadInbox(); axios.get('/api/sis/students').then(r=>setStudents(r.data));},[]);

  const open = async (m) => { setSel(m); if(!m.is_read){await axios.put(`/api/messages/${m.id}/read`);loadInbox();} };
  const sendReply = async () => { if(!reply.trim())return; await axios.post('/api/messages',{receiver_id:sel.sender_id,subject:`Re: ${sel.subject}`,body:reply}); setReply(''); alert('Reply sent'); setSel(null); };
  const handleCompose = async (e) => { e.preventDefault(); await axios.post('/api/messages', msgForm); setMsgForm({receiver_id:'',subject:'',body:''}); setCompose(false); alert('Message sent'); };

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
        <h2 style={{fontSize:'20px',fontWeight:700}}>Messages</h2>
        <button onClick={()=>setCompose(true)} className="btn btn-primary">+ New Message</button>
      </div>

      {compose && (
        <div className="modal-overlay" onClick={()=>setCompose(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()} style={{padding:'32px',maxWidth:'500px'}}>
            <h3 style={{fontSize:'18px',fontWeight:700,marginBottom:'24px'}}>New Message to Student</h3>
            <form onSubmit={handleCompose} style={{display:'flex',flexDirection:'column',gap:'16px'}}>
              <div><L>Select Student</L><select className="field" required value={msgForm.receiver_id} onChange={e=>setMsgForm({...msgForm,receiver_id:e.target.value})}><option value="">Choose student...</option>{students.map(s=><option key={s.id} value={s.user_id}>{s.name} ({s.system_uid})</option>)}</select></div>
              <div><L>Subject</L><input className="field" placeholder="Topic" value={msgForm.subject} onChange={e=>setMsgForm({...msgForm,subject:e.target.value})} required/></div>
              <div><L>Message Content</L><textarea className="field" rows={5} placeholder="Type your message here..." value={msgForm.body} onChange={e=>setMsgForm({...msgForm,body:e.target.value})} required style={{resize:'none'}}/></div>
              <div style={{display:'flex',gap:'12px',marginTop:'8px'}}><button type="submit" className="btn btn-primary" style={{flex:1}}>Send Message</button><button onClick={()=>setCompose(false)} className="btn btn-outline" style={{flex:1}}>Cancel</button></div>
            </form>
          </div>
        </div>
      )}

      <div style={{display:'flex',gap:'20px',minHeight:'400px'}}>
        <div className="card" style={{width:'300px',flexShrink:0,overflowY:'auto',background:'#fff'}}>
          {inbox.map(m=>(<div key={m.id} onClick={()=>open(m)} style={{padding:'16px',borderBottom:'1px solid #f1f5f9',cursor:'pointer',background:sel?.id===m.id?'#f8fafc':'#fff',borderLeft:sel?.id===m.id?'3px solid #2563eb':'3px solid transparent'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}><span style={{fontWeight:m.is_read?600:700,fontSize:'13px',color:'#1e293b'}}>{m.sender_name}</span>{!m.is_read&&<span style={{width:'8px',height:'8px',background:'#2563eb',borderRadius:'50%'}}/>}</div>
            <div style={{color:'#64748b',fontSize:'12px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.subject||'(no subject)'}</div>
          </div>))}
          {inbox.length===0&&<div style={{padding:'40px',color:'#94a3b8',textAlign:'center',fontSize:'13px'}}>No messages found</div>}
        </div>
        <div className="card" style={{flex:1,padding:sel?'24px':'0',display:'flex',flexDirection:'column',background:'#fff'}}>
          {sel?(<><h3 style={{fontSize:'18px',fontWeight:700,marginBottom:'4px',color:'#0f172a'}}>{sel.subject||'(no subject)'}</h3><p style={{color:'#64748b',fontSize:'12px',marginBottom:'24px'}}>From {sel.sender_name} · {new Date(sel.created_at).toLocaleString()}</p><div style={{flex:1,color:'#334155',whiteSpace:'pre-line',lineHeight:1.8,fontSize:'14px',marginBottom:'32px'}}>{sel.body}</div><div style={{borderTop:'1px solid #f1f5f9',paddingTop:'24px'}}><textarea className="field" rows={2} value={reply} onChange={e=>setReply(e.target.value)} placeholder="Type a reply..." style={{marginBottom:'12px',resize:'none'}}/><button onClick={sendReply} className="btn btn-primary">Send Reply</button></div></>):(<div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'#cbd5e1',fontSize:'14px',fontWeight:500}}>Select a message to read</div>)}
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
    <div style={{maxWidth:'600px'}}>
      <button onClick={()=>setSel(null)} className="btn btn-outline btn-sm" style={{marginBottom:'24px'}}>← Back to List</button>
      <div className="card" style={{padding:'32px'}}>
        <div style={{marginBottom:'16px',display:'flex',alignItems:'center',gap:'12px'}}><span className={`badge ${sel.status==='open'?'badge-warn':'badge-present'}`}>{sel.status}</span><span style={{color:'#64748b',fontSize:'12px',fontWeight:600}}>{sel.student_name} · {new Date(sel.created_at).toLocaleDateString()}</span></div>
        <h3 style={{fontSize:'20px',fontWeight:700,marginBottom:'12px'}}>{sel.subject}</h3>
        <p style={{color:'#334155',whiteSpace:'pre-line',lineHeight:1.8,marginBottom:'24px',fontSize:'15px'}}>{sel.body}</p>
        {sel.admin_reply&&<div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'8px',padding:'20px',marginBottom:'24px'}}><p style={{color:'#64748b',fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'8px'}}>Administrative Response</p><p style={{lineHeight:1.7,color:'#1e293b'}}>{sel.admin_reply}</p></div>}
        {sel.status==='open'&&(<div><textarea className="field" rows={3} value={reply} onChange={e=>setReply(e.target.value)} placeholder="Write a response..." style={{marginBottom:'16px',resize:'none'}}/><button onClick={send} className="btn btn-primary" style={{width:'100%'}}>Resolve & Reply</button></div>)}
      </div>
    </div>
  );
  return (
    <div>
      <h2 style={{fontSize:'20px',fontWeight:700,marginBottom:'24px'}}>Student Grievances</h2>
      <div className="card">
        <table className="tbl"><thead><tr><th>Student</th><th>Subject</th><th>Status</th><th style={{textAlign:'right'}}>Date</th></tr></thead>
        <tbody>{list.map(c=><tr key={c.id} className="clickable" onClick={()=>setSel(c)}><td>{c.student_name}</td><td style={{fontWeight:500}}>{c.subject}</td><td><span className={`badge ${c.status==='open'?'badge-warn':'badge-present'}`}>{c.status}</span></td><td style={{textAlign:'right',color:'#94a3b8',fontSize:'12px'}}>{new Date(c.created_at).toLocaleDateString()}</td></tr>)}
        {list.length===0&&<tr><td colSpan={4} style={{color:'#94a3b8',textAlign:'center',padding:'40px'}}>No complaints registered.</td></tr>}</tbody></table>
      </div>
    </div>
  );
};

/* ─── Shell ─── */
const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const tenant = useContext(TenantContext);
  const [tab, setTab] = useState('dashboard');
  const displayName = tenant?.name || tenant?.subdomain || 'Institution';
  
  const tabs = [
    {key:'dashboard',label:'Dashboard',icon:'📊'},
    {key:'classes',label:'Classes',icon:'🏫'},
    {key:'students',label:'Students',icon:'👥'},
    {key:'attendance',label:'Attendance',icon:'✅'},
    {key:'results',label:'Results',icon:'🏆'},
    {key:'notices',label:'Notices',icon:'📢'},
    {key:'messages',label:'Messages',icon:'✉️'},
    {key:'complaints',label:'Complaints',icon:'📝'}
  ];

  const renderTab = () => { switch(tab){case 'dashboard':return <DashboardHome/>;case 'classes':return <ClassesTab/>;case 'students':return <StudentsTab/>;case 'attendance':return <AttendanceTab/>;case 'results':return <ResultsTab/>;case 'notices':return <NoticesTab/>;case 'messages':return <MessagesTab/>;case 'complaints':return <ComplaintsTab/>;default:return <DashboardHome/>;} };

  return (
    <div style={{minHeight:'100vh',background:'#f8fafc',display:'flex'}}>
      <div className="sidebar">
        <div className="sidebar-brand">
          <div style={{width:'28px',height:'28px',background:'#2563eb',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'#fff',fontSize:'14px'}}>E</div>
          <span style={{fontWeight:700,fontSize:'16px',color:'#0f172a',letterSpacing:'-0.02em'}}>EduCore</span>
        </div>
        <div className="sidebar-nav">
          {tabs.map(t=><button key={t.key} onClick={()=>setTab(t.key)} className={`sidebar-item ${tab===t.key?'active':''}`}><span>{t.icon}</span> {t.label}</button>)}
        </div>
        <div className="sidebar-footer">
          <button onClick={logout} className="sidebar-item" style={{color:'#dc2626'}}><span>🚪</span> Logout</button>
        </div>
      </div>
      
      <div className="main-content">
        <header className="topbar">
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <div style={{textAlign:'right'}}><div style={{fontSize:'13px',fontWeight:700,color:'#1e293b'}}>{user?.name}</div><div style={{fontSize:'11px',color:'#64748b',textTransform:'uppercase',fontWeight:700,letterSpacing:'0.05em'}}>{displayName} · {user?.role}</div></div>
            <div style={{width:'36px',height:'36px',background:'#e2e8f0',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px'}}>👤</div>
          </div>
        </header>
        <main style={{flex:1,padding:'40px',maxWidth:'1200px',margin:'0 auto',width:'100%',boxSizing:'border-box'}}>{renderTab()}</main>
        <footer style={{padding:'24px 40px',textAlign:'center',color:'#94a3b8',fontSize:'12px',fontWeight:500}}>Powered by EduCore</footer>
      </div>
    </div>
  );
};

export default AdminDashboard;
