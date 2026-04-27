import React, { useContext, useState, useEffect } from 'react';
import { AuthContext, TenantContext } from '../../App';
import axios from 'axios';

/* ─── Classes & Batches Tab ─── */
const ClassesTab = () => {
  const [classes, setClasses] = useState([]);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const load = () => axios.get('/api/sis/classes').then(r => setClasses(r.data));
  useEffect(() => { load(); }, []);
  const add = async (e) => { e.preventDefault(); if(!name) return; try { await axios.post('/api/sis/classes', { name }); setName(''); setMsg('Class added'); load(); } catch(e) { setMsg(e.response?.data?.error||'Failed'); } setTimeout(()=>setMsg(''),3000); };
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Classes & Batches</h2>
      <form onSubmit={add} style={{ display: 'flex', gap: '12px', marginBottom: '24px', maxWidth: '500px' }}>
        <input className="field" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Class 10-A, Batch 2026" required style={{ flex: 1 }} />
        <button type="submit" className="btn btn-primary">Add</button>
      </form>
      {msg && <p style={{ color: '#00d1ff', marginBottom: '16px', fontSize: '13px' }}>{msg}</p>}
      <div className="table-container">
        <table><thead><tr><th>#</th><th>Class / Batch Name</th></tr></thead>
        <tbody>{classes.map((c,i)=><tr key={c.id}><td style={{color:'#71717a'}}>{i+1}</td><td>{c.name}</td></tr>)}
        {classes.length===0&&<tr><td colSpan={2} style={{color:'#71717a',textAlign:'center'}}>No classes added yet</td></tr>}
        </tbody></table>
      </div>
    </div>
  );
};

/* ─── Students Tab ─── */
const StudentsTab = () => {
  const tenant = useContext(TenantContext);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', password: '', class_id: '' });
  const [msg, setMsg] = useState('');
  const load = async () => { const [s,c] = await Promise.all([axios.get('/api/sis/students'), axios.get('/api/sis/classes')]); setStudents(s.data); setClasses(c.data); };
  useEffect(() => { load(); }, []);
  const add = async (e) => { e.preventDefault(); try { await axios.post('/api/sis/students', form); setForm({ name: '', username: '', password: '', class_id: '' }); setShow(false); setMsg('Student added'); load(); } catch(e) { setMsg(e.response?.data?.error||'Failed'); } setTimeout(()=>setMsg(''),3000); };
  const studentUrl = `http://${tenant?.subdomain}.localhost:${window.location.port || 5173}/student-login`;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Students</h2>
        <button onClick={()=>setShow(!show)} className="btn btn-primary">{show ? 'Cancel' : '+ Add Student'}</button>
      </div>
      
      <div style={{ background: '#111114', border: '1px solid #2a2a2e', padding: '12px 16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ color: '#71717a', fontSize: '12px', flexShrink: 0 }}>STUDENT LOGIN LINK:</span>
        <code style={{ color: '#00d1ff', fontSize: '12px', wordBreak: 'break-all', fontFamily: 'monospace' }}>{studentUrl}</code>
      </div>

      {msg && <p style={{ color: '#00d1ff', marginBottom: '16px', fontSize: '13px' }}>{msg}</p>}

      {show && (
        <div className="card" style={{ padding: '24px', marginBottom: '24px', maxWidth: '500px' }}>
          <form onSubmit={add} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input className="field" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Full Name" required />
            <input className="field" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} placeholder="Username (for login)" required />
            <input className="field" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Password" required />
            <select className="field" value={form.class_id} onChange={e=>setForm({...form,class_id:e.target.value})}>
              <option value="">No class</option>
              {classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button type="submit" className="btn btn-primary">Create Student Account</button>
          </form>
        </div>
      )}

      <div className="table-container">
        <table><thead><tr><th>UID</th><th>Name</th><th>Username</th><th>Class</th></tr></thead>
        <tbody>{students.map(s=><tr key={s.id}><td style={{color:'#00d1ff',fontFamily:'monospace',fontSize:'12px'}}>{s.system_uid}</td><td>{s.name}</td><td style={{color:'#71717a'}}>{s.username}</td><td>{s.class_name||'—'}</td></tr>)}
        {students.length===0&&<tr><td colSpan={4} style={{color:'#71717a',textAlign:'center'}}>No students yet</td></tr>}
        </tbody></table>
      </div>
    </div>
  );
};

/* ─── Attendance Tab ─── */
const AttendanceTab = () => {
  const [classes, setClasses] = useState([]); const [selectedClass, setSelectedClass] = useState(''); const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState([]); const [msg, setMsg] = useState('');
  useEffect(() => { axios.get('/api/sis/classes').then(r => setClasses(r.data)); }, []);
  const loadStudents = async () => { if (!selectedClass) return; const r = await axios.get(`/api/attendance/class/${selectedClass}?date=${date}`); setRecords(r.data); };
  useEffect(() => { if (selectedClass) loadStudents(); }, [selectedClass, date]);
  const toggle = (idx) => { const u = [...records]; u[idx].status = u[idx].status === 'present' ? 'absent' : 'present'; setRecords(u); };
  const save = async () => { try { await axios.post('/api/attendance/mark', { date, records: records.map(r => ({ student_id: r.student_id, status: r.status })) }); setMsg('Attendance saved!'); } catch(e) { setMsg('Failed'); } setTimeout(()=>setMsg(''),3000); };

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Mark Attendance</h2>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <select className="field" style={{maxWidth:'220px'}} value={selectedClass} onChange={e=>setSelectedClass(e.target.value)}>
          <option value="">Select Class</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" className="field" style={{maxWidth:'180px'}} value={date} onChange={e=>setDate(e.target.value)} />
      </div>
      {msg && <p style={{ color: '#22c55e', marginBottom: '16px', fontSize: '13px' }}>{msg}</p>}
      {records.length > 0 && (
        <>
          <div className="table-container" style={{ marginBottom: '16px' }}>
            <table><thead><tr><th>UID</th><th>Name</th><th>Status</th></tr></thead>
            <tbody>{records.map((r,i)=><tr key={i} onClick={()=>toggle(i)} style={{cursor:'pointer'}}>
              <td style={{color:'#00d1ff',fontFamily:'monospace',fontSize:'12px'}}>{r.system_uid}</td>
              <td>{r.student_name}</td>
              <td><span className={`badge ${r.status==='present'?'badge-present':'badge-absent'}`}>{r.status}</span></td>
            </tr>)}</tbody></table>
          </div>
          <button onClick={save} className="btn btn-primary">Save Attendance</button>
        </>
      )}
      {selectedClass && records.length===0 && <p style={{color:'#71717a'}}>No students in this class.</p>}
    </div>
  );
};

/* ─── Notices Tab ─── */
const NoticesTab = () => {
  const [list, setList] = useState([]); const [text, setText] = useState(''); const [msg, setMsg] = useState('');
  useEffect(()=>{axios.get('/api/communication').then(r=>setList(r.data));},[]);
  const post = async (e) => { e.preventDefault(); try { await axios.post('/api/communication', { message: text }); setText(''); setMsg('Notice posted'); axios.get('/api/communication').then(r=>setList(r.data)); } catch(e) { setMsg('Failed'); } setTimeout(()=>setMsg(''),3000); };

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Notices & Announcements</h2>
      <form onSubmit={post} style={{ maxWidth: '600px', marginBottom: '32px' }}>
        <textarea className="field" rows={3} value={text} onChange={e=>setText(e.target.value)} placeholder="Write a notice for all students..." required style={{ marginBottom: '12px' }} />
        <button type="submit" className="btn btn-primary">Post Notice</button>
      </form>
      {msg && <p style={{ color: '#00d1ff', marginBottom: '16px', fontSize: '13px' }}>{msg}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px' }}>
        {list.map(a=>(
          <div key={a.id} className="card" style={{ padding: '16px' }}>
            <p style={{ color: '#e4e4e7', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{a.message}</p>
            <p style={{ color: '#3a3a3e', fontSize: '11px', marginTop: '12px' }}>By {a.author} · {new Date(a.created_at).toLocaleString()}</p>
          </div>
        ))}
        {list.length===0 && <p style={{color:'#71717a'}}>No notices posted yet.</p>}
      </div>
    </div>
  );
};

/* ─── Results Tab ─── */
const ResultsTab = () => {
  const [results, setResults] = useState([]); const [students, setStudents] = useState([]); const [show, setShow] = useState(false);
  const [form, setForm] = useState({ system_uid: '', exam_name: '', score: '', grades: '' }); const [msg, setMsg] = useState('');
  const load = async () => { const [r, s] = await Promise.all([axios.get('/api/results'), axios.get('/api/sis/students')]); setResults(r.data); setStudents(s.data); };
  useEffect(() => { load(); }, []);
  const publish = async (e) => { e.preventDefault(); try { await axios.post('/api/results', { ...form, score: parseFloat(form.score), published: 1 }); setForm({ system_uid: '', exam_name: '', score: '', grades: '' }); setShow(false); setMsg('Published!'); load(); } catch(e) { setMsg(e.response?.data?.error||'Failed'); } setTimeout(()=>setMsg(''),3000); };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Results</h2>
        <button onClick={()=>setShow(!show)} className="btn btn-primary">{show ? 'Cancel' : '+ Publish Result'}</button>
      </div>
      {msg && <p style={{ color: '#00d1ff', marginBottom: '16px', fontSize: '13px' }}>{msg}</p>}
      {show && (
        <div className="card" style={{ padding: '24px', marginBottom: '24px', maxWidth: '500px' }}>
          <form onSubmit={publish} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <select className="field" required value={form.system_uid} onChange={e=>setForm({...form,system_uid:e.target.value})}>
              <option value="">Select Student</option>{students.map(s=><option key={s.id} value={s.system_uid}>{s.system_uid} — {s.name}</option>)}
            </select>
            <input className="field" placeholder="Exam Name" required value={form.exam_name} onChange={e=>setForm({...form,exam_name:e.target.value})} />
            <div style={{ display: 'flex', gap: '12px' }}>
              <input className="field" placeholder="Score" type="number" required value={form.score} onChange={e=>setForm({...form,score:e.target.value})} />
              <input className="field" placeholder="Grade (optional)" value={form.grades} onChange={e=>setForm({...form,grades:e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary">Publish</button>
          </form>
        </div>
      )}
      <div className="table-container">
        <table><thead><tr><th>UID</th><th>Student</th><th>Exam</th><th>Score</th><th>Grade</th></tr></thead>
        <tbody>{results.map((r,i)=><tr key={i}><td style={{color:'#00d1ff',fontFamily:'monospace',fontSize:'12px'}}>{r.system_uid}</td><td>{r.name}</td><td>{r.exam_name}</td><td>{r.score}</td><td style={{color:'#c084fc',fontWeight:600}}>{r.grades||'—'}</td></tr>)}
        {results.length===0&&<tr><td colSpan={5} style={{color:'#71717a',textAlign:'center'}}>No results published</td></tr>}
        </tbody></table>
      </div>
    </div>
  );
};

/* ─── Messages Tab (Admin Inbox) ─── */
const MessagesTab = () => {
  const [inbox, setInbox] = useState([]); const [selected, setSelected] = useState(null);
  useEffect(() => { axios.get('/api/messages/inbox').then(r => setInbox(r.data)); }, []);
  const openMsg = async (m) => { setSelected(m); if (!m.is_read) { await axios.put(`/api/messages/${m.id}/read`); setInbox(prev => prev.map(x => x.id === m.id ? {...x, is_read: 1} : x)); } };

  // Reply
  const [reply, setReply] = useState('');
  const sendReply = async () => {
    if (!reply.trim()) return;
    await axios.post('/api/messages', { receiver_id: selected.sender_id, subject: `Re: ${selected.subject}`, body: reply });
    setReply(''); alert('Reply sent');
  };

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Messages (Inbox)</h2>
      <div style={{ display: 'flex', gap: '16px', minHeight: '400px' }}>
        {/* Message list */}
        <div style={{ width: '300px', flexShrink: 0, border: '1px solid #2a2a2e', background: '#111114', overflowY: 'auto' }}>
          {inbox.map(m=>(
            <div key={m.id} onClick={()=>openMsg(m)} style={{ padding: '14px 16px', borderBottom: '1px solid #2a2a2e', cursor: 'pointer', background: selected?.id===m.id ? '#1f1f23' : 'transparent' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: m.is_read ? 400 : 700, fontSize: '13px', color: '#e4e4e7' }}>{m.sender_name}</span>
                {!m.is_read && <span style={{ width: '8px', height: '8px', background: '#00d1ff', display: 'inline-block' }} />}
              </div>
              <div style={{ color: '#71717a', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.subject || '(no subject)'}</div>
              <div style={{ color: '#3a3a3e', fontSize: '11px', marginTop: '4px' }}>{new Date(m.created_at).toLocaleDateString()}</div>
            </div>
          ))}
          {inbox.length===0 && <div style={{ padding: '24px', color: '#71717a', textAlign: 'center', fontSize: '13px' }}>No messages</div>}
        </div>

        {/* Message detail */}
        <div style={{ flex: 1, border: '1px solid #2a2a2e', background: '#111114', padding: selected ? '24px' : '0', display: 'flex', flexDirection: 'column' }}>
          {selected ? (
            <>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>{selected.subject || '(no subject)'}</h3>
                <p style={{ color: '#71717a', fontSize: '12px' }}>From: {selected.sender_name} ({selected.sender_role}) · {new Date(selected.created_at).toLocaleString()}</p>
              </div>
              <div style={{ flex: 1, color: '#a1a1aa', whiteSpace: 'pre-line', lineHeight: 1.7, fontSize: '14px', marginBottom: '24px' }}>{selected.body}</div>
              <div style={{ borderTop: '1px solid #2a2a2e', paddingTop: '16px' }}>
                <textarea className="field" rows={3} value={reply} onChange={e=>setReply(e.target.value)} placeholder="Write a reply..." style={{ marginBottom: '12px' }} />
                <button onClick={sendReply} className="btn btn-primary">Send Reply</button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a3a3e', fontSize: '13px' }}>Select a message to read</div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Complaints Tab ─── */
const ComplaintsTab = () => {
  const [list, setList] = useState([]); const [selected, setSelected] = useState(null); const [reply, setReply] = useState('');
  useEffect(() => { axios.get('/api/messages/complaints').then(r => setList(r.data)); }, []);
  const sendReply = async () => {
    if (!reply.trim()) return;
    await axios.put(`/api/messages/complaints/${selected.id}/reply`, { reply, status: 'resolved' });
    setReply(''); setSelected(null); axios.get('/api/messages/complaints').then(r => setList(r.data));
  };

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Student Complaints</h2>
      {selected ? (
        <div className="card" style={{ padding: '24px', maxWidth: '600px' }}>
          <div style={{ marginBottom: '16px' }}>
            <span className={`badge ${selected.status==='open'?'badge-info':'badge-present'}`}>{selected.status}</span>
            <span style={{ color: '#71717a', fontSize: '12px', marginLeft: '12px' }}>{selected.student_name} ({selected.system_uid})</span>
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>{selected.subject}</h3>
          <p style={{ color: '#a1a1aa', whiteSpace: 'pre-line', lineHeight: 1.7, marginBottom: '16px' }}>{selected.body}</p>
          {selected.admin_reply && <div style={{ background: '#18181b', border: '1px solid #2a2a2e', padding: '12px', marginBottom: '16px' }}><p style={{ color: '#71717a', fontSize: '11px', marginBottom: '4px' }}>YOUR REPLY:</p><p style={{ color: '#e4e4e7' }}>{selected.admin_reply}</p></div>}
          {selected.status==='open' && (
            <div style={{ borderTop: '1px solid #2a2a2e', paddingTop: '16px' }}>
              <textarea className="field" rows={3} value={reply} onChange={e=>setReply(e.target.value)} placeholder="Write a reply..." style={{ marginBottom: '12px' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={sendReply} className="btn btn-primary">Reply & Resolve</button>
                <button onClick={()=>setSelected(null)} className="btn btn-secondary">Back</button>
              </div>
            </div>
          )}
          {selected.status!=='open' && <button onClick={()=>setSelected(null)} className="btn btn-secondary">Back</button>}
        </div>
      ) : (
        <div className="table-container">
          <table><thead><tr><th>Student</th><th>Subject</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>{list.map(c=><tr key={c.id} onClick={()=>setSelected(c)} style={{cursor:'pointer'}}>
            <td>{c.student_name}</td><td>{c.subject}</td>
            <td><span className={`badge ${c.status==='open'?'badge-info':'badge-present'}`}>{c.status}</span></td>
            <td style={{color:'#71717a',fontSize:'12px'}}>{new Date(c.created_at).toLocaleDateString()}</td>
          </tr>)}
          {list.length===0&&<tr><td colSpan={4} style={{color:'#71717a',textAlign:'center'}}>No complaints</td></tr>}
          </tbody></table>
        </div>
      )}
    </div>
  );
};

/* ─── Dashboard Shell ─── */
const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const tenant = useContext(TenantContext);
  const [tab, setTab] = useState('classes');

  const tabs = [
    { key: 'classes', label: 'Classes' },
    { key: 'students', label: 'Students' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'results', label: 'Results' },
    { key: 'notices', label: 'Notices' },
    { key: 'messages', label: 'Messages' },
    { key: 'complaints', label: 'Complaints' },
  ];

  const renderTab = () => {
    switch(tab) {
      case 'classes': return <ClassesTab />;
      case 'students': return <StudentsTab />;
      case 'attendance': return <AttendanceTab />;
      case 'results': return <ResultsTab />;
      case 'notices': return <NoticesTab />;
      case 'messages': return <MessagesTab />;
      case 'complaints': return <ComplaintsTab />;
      default: return <ClassesTab />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Top Bar */}
      <header style={{ borderBottom: '1px solid #2a2a2e', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '28px', height: '28px', background: '#00d1ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#000', fontSize: '12px' }}>E</div>
          <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '1px', color: '#e4e4e7' }}>EDUCORE OS</span>
          <span style={{ color: '#2a2a2e' }}>|</span>
          <span style={{ color: '#71717a', fontSize: '12px' }}>{tenant?.subdomain}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#a1a1aa', fontSize: '13px' }}>{user?.name}</span>
          <button onClick={logout} style={{ background: 'none', border: '1px solid #2a2a2e', color: '#ef4444', padding: '6px 14px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Logout</button>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="tab-bar" style={{ paddingLeft: '24px', flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`tab-btn ${tab === t.key ? 'active' : ''}`}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <main style={{ flex: 1, padding: '32px 24px', overflowY: 'auto' }}>
        {renderTab()}
      </main>
    </div>
  );
};

export default AdminDashboard;
