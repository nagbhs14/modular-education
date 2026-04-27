import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../App';
import axios from 'axios';

/* ─── Notices Tab ─── */
const NoticesTab = () => {
  const [list, setList] = useState([]);
  useEffect(() => { axios.get('/api/communication').then(r => setList(r.data)).catch(() => {}); }, []);
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Notices & Announcements</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px' }}>
        {list.map(a => (
          <div key={a.id} className="card" style={{ padding: '16px' }}>
            <p style={{ color: '#e4e4e7', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{a.message}</p>
            <p style={{ color: '#3a3a3e', fontSize: '11px', marginTop: '12px' }}>By {a.author} · {new Date(a.created_at).toLocaleString()}</p>
          </div>
        ))}
        {list.length === 0 && <p style={{ color: '#71717a' }}>No notices yet.</p>}
      </div>
    </div>
  );
};

/* ─── Attendance Tab ─── */
const AttendanceTab = () => {
  const [data, setData] = useState({ records: [], percentage: 0, alert: false });
  useEffect(() => { axios.get('/api/attendance/my').then(r => setData(r.data)).catch(() => {}); }, []);
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>My Attendance</h2>
      <div className="card" style={{ padding: '20px', marginBottom: '24px', maxWidth: '300px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#71717a', fontSize: '13px' }}>Overall</span>
        <span style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'monospace', color: data.alert ? '#ef4444' : '#00d1ff' }}>{data.percentage}%</span>
      </div>
      {data.alert && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid #ef4444', padding: '12px 16px', color: '#ef4444', fontSize: '13px', marginBottom: '24px', maxWidth: '400px' }}>⚠ Your attendance is below 75%</div>}
      <div className="table-container" style={{ maxWidth: '500px' }}>
        <table><thead><tr><th>Date</th><th>Status</th></tr></thead>
        <tbody>{data.records.map((r, i) => (
          <tr key={i}><td style={{ color: '#a1a1aa' }}>{r.date}</td><td><span className={`badge ${r.status === 'present' ? 'badge-present' : 'badge-absent'}`}>{r.status}</span></td></tr>
        ))}{data.records.length === 0 && <tr><td colSpan={2} style={{ color: '#71717a', textAlign: 'center' }}>No records</td></tr>}</tbody></table>
      </div>
    </div>
  );
};

/* ─── Results Tab ─── */
const ResultsTab = () => {
  const [results, setResults] = useState([]);
  useEffect(() => { axios.get('/api/results').then(r => setResults(r.data)).catch(() => {}); }, []);
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>My Results</h2>
      <div className="table-container" style={{ maxWidth: '600px' }}>
        <table><thead><tr><th>Exam</th><th>Score</th><th>Grade</th></tr></thead>
        <tbody>{results.map((r, i) => (
          <tr key={i}><td>{r.exam_name}</td><td style={{ fontFamily: 'monospace', color: '#00d1ff' }}>{r.score}</td><td style={{ color: '#c084fc', fontWeight: 600 }}>{r.grades || '—'}</td></tr>
        ))}{results.length === 0 && <tr><td colSpan={3} style={{ color: '#71717a', textAlign: 'center' }}>No results published</td></tr>}</tbody></table>
      </div>
    </div>
  );
};

/* ─── Messages Tab (Student sends, views inbox) ─── */
const MessagesTab = () => {
  const [view, setView] = useState('inbox'); // inbox | compose | sent
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ receiver_id: '', subject: '', body: '' });
  const [msg, setMsg] = useState('');

  const loadInbox = () => axios.get('/api/messages/inbox').then(r => setInbox(r.data));
  const loadSent = () => axios.get('/api/messages/sent').then(r => setSent(r.data));
  const loadContacts = () => axios.get('/api/messages/contacts').then(r => setContacts(r.data));

  useEffect(() => { loadInbox(); loadSent(); loadContacts(); }, []);

  const openMsg = async (m) => {
    setSelected(m);
    if (!m.is_read && view === 'inbox') {
      await axios.put(`/api/messages/${m.id}/read`);
      setInbox(prev => prev.map(x => x.id === m.id ? { ...x, is_read: 1 } : x));
    }
  };

  const send = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/messages', form);
      setForm({ receiver_id: '', subject: '', body: '' });
      setMsg('Message sent!');
      loadSent();
      setView('sent');
    } catch (e) { setMsg('Failed to send'); }
    setTimeout(() => setMsg(''), 3000);
  };

  const currentList = view === 'inbox' ? inbox : sent;

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Messages</h2>

      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '1px solid #2a2a2e' }}>
        {['inbox', 'sent', 'compose'].map(v => (
          <button key={v} onClick={() => { setView(v); setSelected(null); }} style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: view === v ? '2px solid #c084fc' : '2px solid transparent', color: view === v ? '#c084fc' : '#71717a', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer' }}>{v}</button>
        ))}
      </div>
      {msg && <p style={{ color: '#22c55e', marginBottom: '16px', fontSize: '13px' }}>{msg}</p>}

      {view === 'compose' ? (
        <form onSubmit={send} style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <select className="field" required value={form.receiver_id} onChange={e => setForm({ ...form, receiver_id: e.target.value })}>
            <option value="">Select Teacher</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.role})</option>)}
          </select>
          <input className="field" placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
          <textarea className="field" rows={6} placeholder="Write your message here..." required value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} />
          <button type="submit" className="btn btn-primary" style={{ background: '#c084fc', borderColor: '#c084fc' }}>Send Message</button>
        </form>
      ) : (
        <div style={{ display: 'flex', gap: '16px', minHeight: '350px' }}>
          {/* List */}
          <div style={{ width: '280px', flexShrink: 0, border: '1px solid #2a2a2e', background: '#111114', overflowY: 'auto' }}>
            {currentList.map(m => (
              <div key={m.id} onClick={() => openMsg(m)} style={{ padding: '14px 16px', borderBottom: '1px solid #2a2a2e', cursor: 'pointer', background: selected?.id === m.id ? '#1f1f23' : 'transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: (view === 'inbox' && !m.is_read) ? 700 : 400, fontSize: '13px', color: '#e4e4e7' }}>{view === 'inbox' ? m.sender_name : m.receiver_name}</span>
                  {view === 'inbox' && !m.is_read && <span style={{ width: '8px', height: '8px', background: '#c084fc', display: 'inline-block' }} />}
                </div>
                <div style={{ color: '#71717a', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.subject || '(no subject)'}</div>
                <div style={{ color: '#3a3a3e', fontSize: '11px', marginTop: '4px' }}>{new Date(m.created_at).toLocaleDateString()}</div>
              </div>
            ))}
            {currentList.length === 0 && <div style={{ padding: '24px', color: '#71717a', textAlign: 'center', fontSize: '13px' }}>No messages</div>}
          </div>

          {/* Detail */}
          <div style={{ flex: 1, border: '1px solid #2a2a2e', background: '#111114', padding: selected ? '24px' : '0', display: 'flex', flexDirection: 'column' }}>
            {selected ? (
              <>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>{selected.subject || '(no subject)'}</h3>
                <p style={{ color: '#71717a', fontSize: '12px', marginBottom: '16px' }}>
                  {view === 'inbox' ? `From: ${selected.sender_name}` : `To: ${selected.receiver_name}`} · {new Date(selected.created_at).toLocaleString()}
                </p>
                <div style={{ color: '#a1a1aa', whiteSpace: 'pre-line', lineHeight: 1.7, fontSize: '14px' }}>{selected.body}</div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a3a3e', fontSize: '13px' }}>Select a message</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Complaints Tab ─── */
const ComplaintsTab = () => {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ subject: '', body: '' });
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => { axios.get('/api/messages/complaints').then(r => setList(r.data)).catch(() => {}); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/messages/complaints', form);
      setForm({ subject: '', body: '' }); setShow(false); setMsg('Complaint submitted');
      axios.get('/api/messages/complaints').then(r => setList(r.data));
    } catch (e) { setMsg(e.response?.data?.error || 'Failed'); }
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700 }}>My Complaints</h2>
        <button onClick={() => setShow(!show)} className="btn btn-primary" style={{ background: '#c084fc', borderColor: '#c084fc' }}>{show ? 'Cancel' : '+ New Complaint'}</button>
      </div>
      {msg && <p style={{ color: '#22c55e', marginBottom: '16px', fontSize: '13px' }}>{msg}</p>}

      {show && (
        <div className="card" style={{ padding: '24px', marginBottom: '24px', maxWidth: '500px' }}>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input className="field" placeholder="Subject" required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            <textarea className="field" rows={4} placeholder="Describe your complaint..." required value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} />
            <button type="submit" className="btn btn-primary" style={{ background: '#c084fc', borderColor: '#c084fc' }}>Submit</button>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px' }}>
        {list.map(c => (
          <div key={c.id} className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h4 style={{ fontWeight: 600 }}>{c.subject}</h4>
              <span className={`badge ${c.status === 'open' ? 'badge-info' : 'badge-present'}`}>{c.status}</span>
            </div>
            <p style={{ color: '#a1a1aa', whiteSpace: 'pre-line', lineHeight: 1.6, fontSize: '13px' }}>{c.body}</p>
            {c.admin_reply && (
              <div style={{ background: '#18181b', border: '1px solid #2a2a2e', padding: '12px', marginTop: '12px' }}>
                <p style={{ color: '#71717a', fontSize: '11px', marginBottom: '4px' }}>ADMIN REPLY:</p>
                <p style={{ color: '#e4e4e7', fontSize: '13px' }}>{c.admin_reply}</p>
              </div>
            )}
            <p style={{ color: '#3a3a3e', fontSize: '11px', marginTop: '8px' }}>{new Date(c.created_at).toLocaleString()}</p>
          </div>
        ))}
        {list.length === 0 && <p style={{ color: '#71717a' }}>No complaints submitted.</p>}
      </div>
    </div>
  );
};

/* ─── Student Dashboard Shell ─── */
const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [tab, setTab] = useState('notices');

  const tabs = [
    { key: 'notices', label: 'Notices' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'results', label: 'Results' },
    { key: 'messages', label: 'Messages' },
    { key: 'complaints', label: 'Complaints' },
  ];

  const renderTab = () => {
    switch (tab) {
      case 'notices': return <NoticesTab />;
      case 'attendance': return <AttendanceTab />;
      case 'results': return <ResultsTab />;
      case 'messages': return <MessagesTab />;
      case 'complaints': return <ComplaintsTab />;
      default: return <NoticesTab />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Top Bar */}
      <header style={{ borderBottom: '1px solid #2a2a2e', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '28px', height: '28px', background: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#000', fontSize: '12px' }}>E</div>
          <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '1px', color: '#e4e4e7' }}>EDUCORE OS</span>
          <span style={{ color: '#2a2a2e' }}>|</span>
          <span style={{ color: '#71717a', fontSize: '12px' }}>Student</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#a1a1aa', fontSize: '13px' }}>{user?.name}</span>
          {user?.systemUid && <span style={{ color: '#c084fc', fontFamily: 'monospace', fontSize: '12px' }}>{user.systemUid}</span>}
          <button onClick={logout} style={{ background: 'none', border: '1px solid #2a2a2e', color: '#ef4444', padding: '6px 14px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Logout</button>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="tab-bar" style={{ paddingLeft: '24px', flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`tab-btn ${tab === t.key ? 'active' : ''}`} style={tab === t.key ? { color: '#c084fc', borderBottomColor: '#c084fc' } : {}}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <main style={{ flex: 1, padding: '32px 24px', overflowY: 'auto' }}>
        {renderTab()}
      </main>
    </div>
  );
};

export default StudentDashboard;
