import React, { useContext, useState, useEffect } from 'react';
import { AuthContext, TenantContext } from '../../App';
import axios from 'axios';
import { LogOut, Settings, Users, Store, Send, ShieldCheck, CreditCard, Plus, X } from 'lucide-react';
import FileUpload from '../../components/FileUpload';

/* ─── Shared Glass Components ─── */
const GlassCard = ({ children, className = '' }) => (
  <div className={`glass-card rounded-xl p-card-padding relative overflow-hidden ${className}`}>
    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-white/20 to-transparent"></div>
    {children}
  </div>
);

/* ─── Dashboard Overview (Admin) ─── */
const AdminOverview = () => {
  const { user } = useContext(AuthContext);
  const t = useContext(TenantContext);
  return (
    <div>
      <div className="mb-8 relative">
        <div className="glow-primary -top-10 -left-10"></div>
        <h1 className="font-h1 text-h1 text-on-surface mb-2 tracking-tight">Admin Console, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{user?.name}</span></h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Managing operations for {t.name}</p>
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 lg:col-span-4 glass-card rounded-xl p-card-padding">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded bg-primary-container/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">group</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Active Students</span>
            </div>
            <div className="font-h2 text-h2 text-on-surface">System Status</div>
            <p className="text-outline mt-2">All systems operational.</p>
        </div>
        <div className="col-span-12 lg:col-span-8 glass-card rounded-xl p-card-padding">
          <h3 className="font-h3 text-h3 text-on-surface mb-4">Quick Actions</h3>
          <div className="flex gap-4">
             <button className="px-6 py-3 bg-surface-container hover:bg-surface-variant border border-outline-variant/30 rounded-lg font-label-sm text-label-sm transition-colors text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">person_add</span> Enroll Student
             </button>
             <button className="px-6 py-3 bg-surface-container hover:bg-surface-variant border border-outline-variant/30 rounded-lg font-label-sm text-label-sm transition-colors text-secondary flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">campaign</span> Broadcast Message
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Settings ─── */
const SettingsPage = () => {
  const t = useContext(TenantContext);
  const [form, setForm] = useState({ name: t.name, about_us: t.about_us||'', fees_structure: t.fees_structure||'', id_prefix: t.id_prefix||'EDU' });
  const [file, setFile] = useState(null); const [msg, setMsg] = useState(''); const [progress, setProgress] = useState(null);
  const save = async (e) => {
    e.preventDefault(); const fd = new FormData();
    Object.keys(form).forEach(k => fd.append(k, form[k]));
    if (file) fd.append('logo', file);
    try {
      setProgress(0);
      await axios.put('/api/settings', fd, { 
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: p => setProgress(Math.round((p.loaded * 100) / p.total))
      });
      setMsg('Settings saved! Refresh to see changes.'); setFile(null);
    } catch(err) { setMsg('Failed to save'); }
    finally { setProgress(null); }
    setTimeout(()=>setMsg(''),4000);
  };
  return (<div><h2 className="text-3xl font-bold mb-6 font-h1 text-primary">Institution Settings</h2>
  <GlassCard className="max-w-2xl"><form onSubmit={save} className="space-y-6"><div><label className="block text-sm text-on-surface-variant mb-2">Institution Name</label><input required className="w-full bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg focus:border-primary text-on-surface transition" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div><div><label className="block text-sm text-on-surface-variant mb-2">Student ID Prefix (e.g., EDU)</label><input required className="w-full bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg focus:border-primary text-on-surface transition" value={form.id_prefix} onChange={e=>setForm({...form,id_prefix:e.target.value})}/></div><div><label className="block text-sm text-on-surface-variant mb-2">About Us</label><textarea rows={4} className="w-full bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg focus:border-primary text-on-surface transition" value={form.about_us} onChange={e=>setForm({...form,about_us:e.target.value})}/></div><div><label className="block text-sm text-on-surface-variant mb-2">Fees Structure Details</label><textarea rows={4} className="w-full bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg focus:border-primary text-on-surface transition" value={form.fees_structure} onChange={e=>setForm({...form,fees_structure:e.target.value})}/></div><div><label className="block text-sm text-on-surface-variant mb-3">Institution Logo</label>
  <FileUpload file={file} onFileSelect={setFile} onRemove={()=>setFile(null)} progress={progress} compact={true} accept=".jpg,.jpeg,.png,.svg,.webp" />
  </div><button disabled={progress!==null} className="bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-sm py-3 px-8 rounded-lg shadow-[0_0_15px_rgba(0,209,255,0.2)] disabled:opacity-50 transition">Save Settings</button>{msg&&<p className="mt-4 text-secondary">{msg}</p>}</form></GlassCard></div>);
};

/* ─── SIS ─── */
const SisPage = () => {
  const [students, setStudents] = useState([]); const [teachers, setTeachers] = useState([]); const [classes, setClasses] = useState([]);
  const load = async () => { const [s,t,c] = await Promise.all([axios.get('/api/sis/students'), axios.get('/api/sis/teachers'), axios.get('/api/sis/classes')]); setStudents(s.data); setTeachers(t.data); setClasses(c.data); };
  useEffect(() => { load(); }, []);
  const [sForm, setSForm] = useState({ name:'', username:'', password:'', class_id:'' }); const [msg, setMsg] = useState('');
  const addStudent = async (e) => { e.preventDefault(); try { await axios.post('/api/sis/students', sForm); setMsg('Added!'); setSForm({name:'',username:'',password:'',class_id:''}); load(); } catch(err) { setMsg(err.response?.data?.error||'Failed'); } setTimeout(()=>setMsg(''),3000); };
  const addClass = async () => { const n = prompt('Class Name:'); if(n) { await axios.post('/api/sis/classes', {name:n}); load(); } };
  return (<div><h2 className="text-3xl font-bold mb-6 font-h1 text-primary">Student Info System</h2><div className="grid md:grid-cols-2 gap-8"><GlassCard><h3 className="text-xl font-semibold mb-6 font-h3 text-on-surface">Add Student</h3><form onSubmit={addStudent} className="space-y-4"><input required placeholder="Full Name" className="w-full bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg text-on-surface focus:border-primary transition" value={sForm.name} onChange={e=>setSForm({...sForm,name:e.target.value})}/><input required placeholder="Username" className="w-full bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg text-on-surface focus:border-primary transition" value={sForm.username} onChange={e=>setSForm({...sForm,username:e.target.value})}/><input required type="password" placeholder="Password" className="w-full bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg text-on-surface focus:border-primary transition" value={sForm.password} onChange={e=>setSForm({...sForm,password:e.target.value})}/><select className="w-full bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg text-on-surface focus:border-primary transition" value={sForm.class_id} onChange={e=>setSForm({...sForm,class_id:e.target.value})}><option value="">Select Class (Optional)</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><button className="bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-sm py-3 px-8 rounded-lg transition">Add Student</button>{msg&&<p className="text-secondary mt-2">{msg}</p>}</form></GlassCard><div><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold text-on-surface font-h3">Classes</h3><button onClick={addClass} className="text-sm bg-surface-container hover:bg-surface-variant border border-outline-variant/50 px-4 py-1.5 rounded-lg text-primary transition font-label-sm">Add Class</button></div><div className="flex flex-wrap gap-2 mb-8">{classes.map(c=><span key={c.id} className="bg-surface-container-low border border-outline-variant/30 px-3 py-1 rounded-full text-on-surface-variant text-sm font-label-sm">{c.name}</span>)}</div><h3 className="text-xl font-semibold mb-4 text-on-surface font-h3">Directory ({students.length} Students)</h3><GlassCard className="!p-0"><table className="w-full text-left border-collapse"><thead className="bg-surface-container-low"><tr><th className="font-label-sm text-label-sm text-outline p-4 border-b border-outline-variant/30">UID</th><th className="font-label-sm text-label-sm text-outline p-4 border-b border-outline-variant/30">Name</th><th className="font-label-sm text-label-sm text-outline p-4 border-b border-outline-variant/30">Class</th></tr></thead><tbody className="font-body-md text-body-md text-on-surface">{students.slice(0, 10).map((s,i)=><tr key={i} className="hover:bg-white/[0.02] transition-colors border-b border-outline-variant/10"><td className="p-4 text-primary font-mono">{s.system_uid}</td><td className="p-4 text-on-surface">{s.name}</td><td className="p-4 text-outline">{s.class_name||'—'}</td></tr>)}{students.length>10&&<tr><td colSpan={3} className="p-4 text-center text-outline italic">Showing 10 of {students.length}</td></tr>}</tbody></table></GlassCard></div></div></div>);
};

/* ─── Marketplace ─── */
const MarketplacePage = () => {
  const [modules, setModules] = useState([]);
  const load = () => axios.get('/api/marketplace').then(r => setModules(r.data));
  useEffect(() => { load(); }, []);
  const toggle = async (mod) => { try { await axios.put(`/api/marketplace/${mod.name}`, { enabled: !mod.enabled }); load(); } catch(e) { alert(e.response?.data?.error||'Failed'); } };
  return (<div><h2 className="text-3xl font-bold mb-6 font-h1 text-primary">App Marketplace</h2><div className="grid md:grid-cols-3 gap-6">{modules.map(m=>(<GlassCard key={m.name} className="flex flex-col"><div className="flex justify-between items-start mb-4"><h3 className="text-xl font-semibold text-on-surface font-h3">{m.label}</h3><div className={`w-3 h-3 rounded-full ${m.enabled?'bg-primary shadow-[0_0_10px_rgba(0,209,255,0.5)]':'bg-surface-container-highest border border-outline-variant/50'}`}></div></div><p className="text-on-surface-variant text-sm h-12 flex-1">{m.description}</p><button onClick={()=>toggle(m)} disabled={m.core} className={`mt-6 w-full py-2.5 rounded-lg font-label-sm text-label-sm transition ${m.core?'bg-surface-container text-outline cursor-not-allowed':m.enabled?'bg-error-container/20 text-error hover:bg-error-container/30':'bg-primary text-on-primary hover:bg-primary-fixed-dim'}`}>{m.core?'Core Module':m.enabled?'Disable':'Enable'}</button></GlassCard>))}</div></div>);
};

/* ─── Announcements ─── */
const AdminAnnouncements = () => {
  const [list, setList] = useState([]); const [text, setText] = useState(''); const [file, setFile] = useState(null); const [msg, setMsg] = useState(''); const [progress, setProgress] = useState(null);
  useEffect(()=>{axios.get('/api/communication').then(r=>setList(r.data));},[]);
  const post = async (e) => { 
    e.preventDefault(); const fd = new FormData(); fd.append('message', text); if (file) fd.append('attachment', file);
    try { 
      setProgress(0);
      await axios.post('/api/communication', fd, { 
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: p => setProgress(Math.round((p.loaded * 100) / p.total))
      }); 
      setText(''); setFile(null); setMsg('Posted!'); axios.get('/api/communication').then(r=>setList(r.data)); 
    } catch(e) { setMsg('Failed'); } 
    finally { setProgress(null); }
    setTimeout(()=>setMsg(''),3000); 
  };
  return (<div><h2 className="text-3xl font-bold mb-6 font-h1 text-primary">Broadcast Announcement</h2>
    <GlassCard className="mb-8 max-w-2xl"><form onSubmit={post} className="space-y-4"><textarea rows={3} placeholder="Write a notice for all users..." required className="w-full bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg text-on-surface focus:border-primary transition" value={text} onChange={e=>setText(e.target.value)}/>
    <FileUpload file={file} onFileSelect={setFile} onRemove={()=>setFile(null)} progress={progress} compact={true} />
    <button disabled={progress!==null} className="bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-sm py-2 px-6 rounded-lg shadow-[0_0_15px_rgba(0,209,255,0.2)] disabled:opacity-50 transition">Broadcast</button>
    {msg&&<p className="text-secondary">{msg}</p>}</form></GlassCard>
    <div className="space-y-4 max-w-2xl">{list.map(a=>(<GlassCard key={a.id} className="p-5"><p className="text-on-surface whitespace-pre-line leading-relaxed">{a.message}</p>{a.file_url&&<a href={`${axios.defaults.baseURL}${a.file_url}`} target="_blank" rel="noreferrer" className="text-primary text-sm hover:underline mt-3 inline-flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">attach_file</span> Attachment</a>}<p className="text-outline text-xs mt-4">By {a.author} · {new Date(a.created_at).toLocaleString()}</p></GlassCard>))}{list.length===0&&<p className="text-outline">No announcements.</p>}</div></div>);
};

/* ─── Fees Management ─── */
const FeesManagement = () => {
  const [fees, setFees] = useState([]); const [summary, setSummary] = useState(null); const [classes, setClasses] = useState([]);
  const [showForm, setShowForm] = useState(false); const [form, setForm] = useState({ name: '', amount: '', due_date: '', class_id: '', description: '' });
  const [msg, setMsg] = useState(''); const [payments, setPayments] = useState(null); const [selectedFee, setSelectedFee] = useState(null);

  const load = async () => { 
    const [f, s, c] = await Promise.all([axios.get('/api/fees'), axios.get('/api/fees/summary/overview'), axios.get('/api/sis/classes')]); 
    setFees(f.data); setSummary(s.data); setClasses(c.data);
  };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try { await axios.post('/api/fees', form); setMsg('Fee structured created & assigned!'); setShowForm(false); setForm({ name: '', amount: '', due_date: '', class_id: '', description: '' }); load(); } catch(err) { setMsg('Failed to create'); } setTimeout(()=>setMsg(''),3000);
  };

  const viewPayments = async (feeId) => { const r = await axios.get(`/api/fees/${feeId}/payments`); setPayments(r.data); setSelectedFee(feeId); };
  
  const recordPayment = async (pid) => {
    const method = prompt('Payment Method (Cash/Card/Transfer):', 'Cash');
    const txn = prompt('Transaction ID (Optional):', '');
    const amount = prompt('Amount Paid:', '0');
    if(method && amount) {
      try { await axios.put(`/api/fees/payments/${pid}`, { status: 'paid', amount_paid: parseFloat(amount), payment_method: method, transaction_id: txn }); setMsg('Payment recorded!'); viewPayments(selectedFee); load(); } catch(e) { setMsg('Failed'); } setTimeout(()=>setMsg(''),3000);
    }
  };

  const sendReminders = async () => {
    if(window.confirm('Send reminders to all pending/overdue accounts?')) {
      try { const r = await axios.post('/api/fees/reminders'); setMsg(`Sent ${r.data.reminders_sent} reminders.`); } catch(e) { setMsg('Failed to send reminders.'); } setTimeout(()=>setMsg(''),3000);
    }
  };

  return (<div><div className="flex justify-between items-center mb-6"><h2 className="text-3xl font-bold font-h1 text-primary">Fees Management</h2><div className="flex gap-3"><button onClick={sendReminders} className="bg-surface-container hover:bg-surface-variant border border-outline-variant/50 px-4 py-2 rounded-lg text-primary font-label-sm transition">Send Reminders</button><button onClick={()=>setShowForm(!showForm)} className="flex items-center gap-2 bg-primary-container text-on-primary-container hover:bg-primary px-4 py-2 rounded-lg font-label-sm transition shadow-[0_0_15px_rgba(0,209,255,0.2)]"><Plus size={16}/>Create Fee</button></div></div>
    
    {summary && (
      <div className="grid grid-cols-4 gap-4 mb-8">
        <GlassCard className="p-5"><div className="text-outline text-sm font-label-sm mb-2">Total Expected</div><div className="text-3xl font-bold text-on-surface font-mono">${summary.total_expected?.toFixed(2) || '0.00'}</div></GlassCard>
        <GlassCard className="p-5"><div className="text-outline text-sm font-label-sm mb-2">Collected</div><div className="text-3xl font-bold text-primary font-mono">${summary.total_collected?.toFixed(2) || '0.00'}</div></GlassCard>
        <GlassCard className="p-5"><div className="text-outline text-sm font-label-sm mb-2">Pending Invoices</div><div className="text-3xl font-bold text-secondary font-mono">{summary.pending || 0}</div></GlassCard>
        <GlassCard className="p-5 !border-error/30"><div className="text-error text-sm font-label-sm mb-2">Overdue Invoices</div><div className="text-3xl font-bold text-error font-mono">{summary.overdue || 0}</div></GlassCard>
      </div>
    )}

    {msg&&<p className="mb-4 text-secondary font-semibold">{msg}</p>}

    {showForm&&<GlassCard className="mb-8 max-w-2xl"><form onSubmit={create} className="space-y-4"><input placeholder="Fee Name (e.g., Term 1 Tuition)" required className="w-full bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg text-on-surface focus:border-primary transition" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><div className="grid grid-cols-2 gap-4"><input type="number" placeholder="Amount ($)" required className="bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg text-on-surface focus:border-primary transition" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/><input type="date" className="bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg text-on-surface focus:border-primary transition" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})}/></div><select className="w-full bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg text-on-surface focus:border-primary transition" value={form.class_id} onChange={e=>setForm({...form,class_id:e.target.value})}><option value="">Assign to All Classes</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><textarea placeholder="Description (Optional)" rows={2} className="w-full bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg text-on-surface focus:border-primary transition" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/><div className="flex gap-3"><button className="bg-primary hover:bg-primary-fixed-dim text-on-primary py-2 px-6 rounded-lg font-label-sm transition">Create & Assign</button><button type="button" onClick={()=>setShowForm(false)} className="text-outline hover:text-on-surface"><X size={20}/></button></div></form></GlassCard>}

    <div className="space-y-4 max-w-4xl">{fees.map(f=>(<GlassCard key={f.id} className="flex justify-between items-center"><div className="flex-1"><h3 className="text-xl font-semibold text-on-surface font-h3">{f.name} <span className="ml-3 text-primary font-mono">${f.amount}</span></h3><p className="text-on-surface-variant text-sm mt-1">Due: {f.due_date||'N/A'} · Assigned to: {f.class_name||'All Classes'}</p></div><button onClick={()=>viewPayments(f.id)} className="bg-surface-container hover:bg-surface-variant border border-outline-variant/50 px-5 py-2.5 rounded-lg text-sm text-primary font-label-sm transition">View Payments</button></GlassCard>))}{fees.length===0&&<p className="text-outline">No fee structures created.</p>}</div>

    {payments&&<div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4"><div className="glass-modal rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"><div className="p-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low"><h3 className="text-xl font-bold text-on-surface font-h3">Payment Status Tracker</h3><button onClick={()=>{setPayments(null);setSelectedFee(null);}} className="text-outline hover:text-on-surface transition"><X size={20}/></button></div><div className="flex-1 overflow-auto bg-surface"><table className="w-full text-left border-collapse"><thead className="bg-surface-container-low sticky top-0"><tr><th className="font-label-sm text-outline p-4 border-b border-outline-variant/30">UID</th><th className="font-label-sm text-outline p-4 border-b border-outline-variant/30">Student</th><th className="font-label-sm text-outline p-4 border-b border-outline-variant/30">Status</th><th className="font-label-sm text-outline p-4 border-b border-outline-variant/30">Paid</th><th className="font-label-sm text-outline p-4 border-b border-outline-variant/30">Date</th><th className="font-label-sm text-outline p-4 border-b border-outline-variant/30">Action</th></tr></thead><tbody className="font-body-md text-on-surface">{payments.map(p=>(<tr key={p.id} className="hover:bg-white/[0.02] border-b border-outline-variant/10"><td className="p-4 text-primary font-mono">{p.system_uid}</td><td className="p-4">{p.student_name}</td><td className="p-4"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${p.status==='paid'?'bg-primary-container/20 text-primary border border-primary/30':p.status==='overdue'?'bg-error-container/20 text-error border border-error/30':'bg-secondary-container/20 text-secondary border border-secondary/30'}`}>{p.status}</span></td><td className="p-4 font-mono">${p.amount_paid}</td><td className="p-4 text-outline">{p.paid_at?new Date(p.paid_at).toLocaleDateString():'—'}</td><td className="p-4">{p.status!=='paid'&&<button onClick={()=>recordPayment(p.id)} className="text-primary hover:text-primary-fixed-dim font-label-sm underline decoration-primary/30 underline-offset-2">Record Payment</button>}</td></tr>))}</tbody></table></div></div></div>}
  </div>);
};


/* ─── Admin Dashboard Shell ─── */
const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [page, setPage] = useState('overview');
  
  const navItems = [
    { key: 'overview', label: 'Dashboard', icon: 'dashboard' },
    { key: 'settings', label: 'Settings', icon: 'settings' },
    { key: 'sis', label: 'Students & Staff', icon: 'group' },
    { key: 'fees', label: 'Fees Mgmt', icon: 'payments' },
    { key: 'marketplace', label: 'App Store', icon: 'storefront' },
    { key: 'announcements', label: 'Announcements', icon: 'campaign' },
  ];

  const renderPage = () => {
    switch(page) {
      case 'overview': return <AdminOverview/>;
      case 'sis': return <SisPage/>;
      case 'marketplace': return <MarketplacePage/>;
      case 'announcements': return <AdminAnnouncements/>;
      case 'fees': return <FeesManagement/>;
      default: return <SettingsPage/>;
    }
  };

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen flex selection:bg-secondary/30">
      {/* SideNavBar */}
      <nav className="fixed left-0 top-0 h-screen w-sidebar-width-expanded border-r border-white/10 bg-neutral-950/40 backdrop-blur-[20px] shadow-2xl shadow-cyan-500/5 z-50">
        <div className="flex flex-col h-full p-6 space-y-2 border-r border-white/5">
          {/* Brand */}
          <div className="flex items-center gap-4 mb-8 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-on-primary font-bold text-xl shadow-[0_0_15px_rgba(76,214,255,0.3)]">
                E
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-primary font-h2 leading-none">EduCore OS</h2>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Admin Console</span>
            </div>
          </div>
          {/* Links */}
          <div className="flex-1 space-y-1">
            {navItems.map(item => (
              <button key={item.key} onClick={() => setPage(item.key)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out font-body-md ${page === item.key ? 'text-primary bg-white/5 border-l-4 border-primary' : 'text-outline hover:text-on-surface hover:bg-white/5 hover:backdrop-blur-sm'}`}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: page === item.key ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          {/* User / Logout */}
          <div className="pt-4 border-t border-white/5 mt-auto">
             <div className="px-4 py-3 mb-2 bg-surface-container-low rounded-lg border border-outline-variant/30 flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-secondary-container/50 flex items-center justify-center text-secondary font-bold text-xs">{user?.name?.charAt(0)}</div>
               <div className="text-left">
                 <div className="text-sm font-semibold text-on-surface">{user?.name}</div>
                 <div className="text-[10px] text-outline uppercase">Platform Admin</div>
               </div>
             </div>
             <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-error hover:bg-error-container/10 rounded-lg transition-all font-body-md text-left">
               <span className="material-symbols-outlined">logout</span>
               <span>Sign Out</span>
             </button>
          </div>
        </div>
      </nav>

      {/* Main Content Wrapper */}
      <div className="flex-1 ml-sidebar-width-expanded flex flex-col min-h-screen relative">
        {/* TopNavBar */}
        <header className="sticky top-0 w-full z-40 border-b border-white/5 bg-neutral-950/30 backdrop-blur-md backdrop-saturate-150 shadow-sm">
          <div className="flex items-center justify-between px-8 h-16 w-full">
            <div className="hidden md:block text-lg font-black bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent font-h2">
                EduCore OS
            </div>
            <div className="flex items-center gap-6">
              <div className="relative group hidden md:block">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-sm">search</span>
                </div>
                <input className="bg-surface-container-highest border-none text-on-surface text-sm rounded-full pl-10 pr-12 py-1.5 focus:ring-2 focus:ring-primary/50 transition-all w-64 placeholder:text-outline-variant font-body-md" placeholder="Search..." type="text"/>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="font-label-sm text-outline-variant bg-surface-variant px-1.5 py-0.5 rounded text-[10px]">⌘K</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-outline hover:text-on-surface hover:bg-white/10 rounded-full transition-colors relative">
                  <span className="material-symbols-outlined">notifications</span>
                  <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full border border-surface-dim"></span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Canvas */}
        <main className="flex-1 p-container-padding overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
