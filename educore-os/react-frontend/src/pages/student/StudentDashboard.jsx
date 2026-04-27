import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../App';
import axios from 'axios';
import { LogOut, BookOpen, FileCheck, ClipboardList, Calendar, CheckCircle, MessageSquare, Plus, X } from 'lucide-react';
import FileUpload from '../../components/FileUpload';

/* ─── Shared Glass Components ─── */
const GlassCard = ({ children, className = '' }) => (
  <div className={`glass-card rounded-xl p-card-padding relative overflow-hidden ${className}`}>
    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-white/20 to-transparent"></div>
    {children}
  </div>
);

/* ─── Dashboard Overview (Student) ─── */
const StudentOverview = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState({ attendance: 0, assignments: 0 });
  
  useEffect(() => { 
      // Quick fetch for overview stats
      Promise.all([
          axios.get('/api/attendance/my'),
          axios.get('/api/assignments')
      ]).then(([att, asg]) => {
          setData({ attendance: att.data.percentage || 0, assignments: asg.data.length || 0 });
      }).catch(() => {});
  }, []);

  return (
    <div>
      <div className="mb-8 relative">
        <div className="glow-primary -top-10 -left-10"></div>
        <h1 className="font-h1 text-h1 text-on-surface mb-2 tracking-tight">Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{user?.name}</span></h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Here is your academic overview for today.</p>
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 lg:col-span-8 grid grid-cols-2 gap-6">
          <GlassCard className="group p-5">
            <div className="glow-primary -bottom-10 -right-10 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded bg-primary-container/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">assignment</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Active Assignments</span>
            </div>
            <div className="font-h2 text-h2 text-on-surface">{data.assignments}</div>
          </GlassCard>
          
          <GlassCard className="group p-5">
            <div className="glow-accent -bottom-10 -right-10 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded bg-secondary-container/20 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Attendance Rate</span>
            </div>
            <div className={`font-h2 text-h2 ${data.attendance < 75 ? 'text-error' : 'text-on-surface'}`}>{data.attendance}%</div>
          </GlassCard>
        </div>

        <div className="col-span-12 lg:col-span-4 glass-card rounded-xl p-card-padding relative overflow-hidden flex flex-col">
          <h3 className="font-h3 text-h3 text-on-surface mb-4">Quick Links</h3>
          <div className="flex flex-col gap-3">
             <button className="px-6 py-3 bg-surface-container hover:bg-surface-variant border border-outline-variant/30 rounded-lg font-label-sm text-label-sm transition-colors text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">menu_book</span> View Study Materials
             </button>
             <button className="px-6 py-3 bg-surface-container hover:bg-surface-variant border border-outline-variant/30 rounded-lg font-label-sm text-label-sm transition-colors text-secondary flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">chat</span> Message Teacher
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Study Materials ─── */
const StudyMaterials = () => {
  const [materials, setMaterials] = useState([]);
  useEffect(() => { axios.get('/api/materials').then(r => setMaterials(r.data)); }, []);
  return (<div><h2 className="text-3xl font-bold mb-6 font-h1 text-primary">Study Materials</h2><div className="space-y-4">{materials.map(m=>(<GlassCard key={m.id} className="p-5"><h3 className="text-lg font-semibold text-on-surface font-h3">{m.title}</h3>{m.description&&<p className="text-on-surface-variant mt-1 leading-relaxed">{m.description}</p>}{m.file_url&&<a href={`${axios.defaults.baseURL}${m.file_url}`} target="_blank" rel="noreferrer" className="text-primary text-sm hover:underline mt-3 inline-flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">attach_file</span> Download</a>}<p className="text-outline text-xs mt-4">By {m.teacher_name} · {new Date(m.created_at).toLocaleString()}</p></GlassCard>))}{materials.length===0&&<p className="text-outline">No materials available.</p>}</div></div>);
};

/* ─── Results ─── */
const Results = () => {
  const [results, setResults] = useState([]);
  useEffect(() => { axios.get('/api/results').then(r => setResults(r.data)); }, []);
  return (<div><h2 className="text-3xl font-bold mb-6 font-h1 text-primary">My Results</h2><GlassCard className="!p-0"><table className="w-full text-left border-collapse"><thead className="bg-surface-container-low"><tr><th className="font-label-sm text-label-sm text-outline p-4 border-b border-outline-variant/30">Exam</th><th className="font-label-sm text-label-sm text-outline p-4 border-b border-outline-variant/30">Score</th><th className="font-label-sm text-label-sm text-outline p-4 border-b border-outline-variant/30">Grade</th></tr></thead><tbody className="font-body-md text-on-surface">{results.map((r,i)=>(<tr key={i} className="border-b border-outline-variant/10 hover:bg-white/[0.02] transition-colors"><td className="p-4 text-on-surface">{r.exam_name}</td><td className="p-4 text-primary font-mono">{r.score}</td><td className="p-4 text-secondary font-semibold font-mono">{r.grades||'—'}</td></tr>))}{results.length===0&&<tr><td colSpan={3} className="p-4 text-center text-outline">No results published yet.</td></tr>}</tbody></table></GlassCard></div>);
};

/* ─── Attendance ─── */
const AttendancePage = () => {
  const [data, setData] = useState({ records: [], percentage: 0, alert: false });
  useEffect(() => { axios.get('/api/attendance/my').then(r => setData(r.data)); }, []);
  return (<div><h2 className="text-3xl font-bold mb-6 font-h1 text-primary">My Attendance</h2>
    <GlassCard className="p-6 mb-6 max-w-md flex items-center justify-between"><div className="text-on-surface-variant font-label-sm">Overall Attendance</div><div className={`text-4xl font-bold font-mono ${data.alert ? 'text-error' : 'text-primary'}`}>{data.percentage}%</div></GlassCard>
    {data.alert && <div className="bg-error-container/20 border border-error/30 p-4 rounded-lg mb-6 max-w-md text-error text-sm font-label-sm flex items-center gap-2"><span className="material-symbols-outlined">warning</span> Your attendance is below the 75% threshold.</div>}
    <GlassCard className="!p-0 max-w-2xl"><table className="w-full text-left border-collapse"><thead className="bg-surface-container-low"><tr><th className="font-label-sm text-label-sm text-outline p-4 border-b border-outline-variant/30">Date</th><th className="font-label-sm text-label-sm text-outline p-4 border-b border-outline-variant/30">Status</th></tr></thead><tbody className="font-body-md text-on-surface">{data.records.map((r,i)=>(<tr key={i} className="border-b border-outline-variant/10 hover:bg-white/[0.02] transition-colors"><td className="p-4 text-on-surface-variant">{r.date}</td><td className="p-4"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${r.status==='present'?'bg-primary-container/10 text-primary border-primary/20':'bg-error-container/20 text-error border-error/30'}`}>{r.status}</span></td></tr>))}{data.records.length===0&&<tr><td colSpan={2} className="p-4 text-center text-outline">No attendance records.</td></tr>}</tbody></table></GlassCard></div>);
};

/* ─── Chat ─── */
const ChatPage = () => {
  const [contacts, setContacts] = useState([]); const [selected, setSelected] = useState(null); const [messages, setMessages] = useState([]); const [text, setText] = useState('');
  useEffect(() => { axios.get('/api/chat/contacts').then(r => setContacts(r.data)); }, []);
  useEffect(() => { if (selected) { axios.get(`/api/chat?with_user=${selected.id}`).then(r => setMessages(r.data)); const iv = setInterval(() => { axios.get(`/api/chat?with_user=${selected.id}`).then(r => setMessages(r.data)); }, 3000); return () => clearInterval(iv); } }, [selected]);
  const send = async (e) => { e.preventDefault(); if (!text.trim()) return; await axios.post('/api/chat', { message: text, receiver_id: selected.id }); setText(''); axios.get(`/api/chat?with_user=${selected.id}`).then(r => setMessages(r.data)); };
  return (<div className="flex gap-6 h-[calc(100vh-10rem)]"><GlassCard className="w-72 !p-0 overflow-y-auto shrink-0 border-r border-white/5"><h3 className="p-4 font-semibold text-on-surface border-b border-outline-variant/30 bg-surface-container-low font-h3 sticky top-0">Teachers</h3>{contacts.map(c=><button key={c.id} onClick={()=>setSelected(c)} className={`w-full p-4 text-left border-b border-outline-variant/10 transition flex flex-col ${selected?.id===c.id?'bg-primary-container/10 border-l-2 border-l-primary':'hover:bg-white/[0.02]'}`}><span className="text-on-surface font-medium">{c.name}</span></button>)}</GlassCard>
    <GlassCard className="flex-1 flex flex-col !p-0">{selected?<><div className="p-5 border-b border-outline-variant/30 font-semibold text-on-surface bg-surface-container-low font-h3">{selected.name}</div><div className="flex-1 overflow-y-auto p-6 space-y-4">{messages.map(m=><div key={m.id} className={`max-w-md p-3.5 rounded-2xl text-sm ${m.sender_name===selected.name?'bg-surface-container-high text-on-surface rounded-tl-sm':'bg-primary text-on-primary ml-auto rounded-tr-sm'}`}><p className="leading-relaxed">{m.message}</p><p className={`text-[10px] mt-1.5 ${m.sender_name===selected.name?'text-outline':'text-on-primary/70'}`}>{new Date(m.created_at).toLocaleTimeString()}</p></div>)}</div><form onSubmit={send} className="p-4 border-t border-outline-variant/30 bg-surface-container-low flex gap-3"><input className="flex-1 bg-surface-container-highest border border-outline-variant/50 p-3 rounded-xl focus:outline-none focus:border-primary text-on-surface transition" placeholder="Type a message..." value={text} onChange={e=>setText(e.target.value)}/><button className="bg-primary hover:bg-primary-fixed-dim text-on-primary px-6 py-3 rounded-xl font-label-sm transition shadow-[0_0_10px_rgba(0,209,255,0.2)]">Send</button></form></>:<div className="flex-1 flex items-center justify-center text-outline font-body-lg">Select a teacher to ask questions</div>}</GlassCard></div>);
};

/* ─── Assignments ─── */
const AssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [mySubs, setMySubs] = useState([]);
  const [submissionModal, setSubmissionModal] = useState(null); // stores assignment object
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [msg, setMsg] = useState('');

  const load = async () => { 
    const [a, s] = await Promise.all([axios.get('/api/assignments'), axios.get('/api/assignments/my-submissions')]); 
    setAssignments(a.data); setMySubs(s.data); 
  };
  useEffect(() => { load(); }, []);

  const getSub = (assignmentId) => mySubs.find(s => s.assignment_id === assignmentId);

  const submit = async (e) => {
    e.preventDefault();
    if (!content && !file) { setMsg('Please provide text content or a file'); return; }
    const fd = new FormData();
    fd.append('content', content);
    if (file) fd.append('submission_file', file);

    try {
      setProgress(0);
      await axios.post(`/api/assignments/${submissionModal.id}/submit`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: p => setProgress(Math.round((p.loaded * 100) / p.total))
      });
      setMsg('Submitted successfully!');
      setTimeout(() => { setSubmissionModal(null); setContent(''); setFile(null); setMsg(''); load(); }, 2000);
    } catch(err) {
      setMsg(err.response?.data?.error || 'Submission failed');
      setProgress(null);
    }
  };

  return (<div><h2 className="text-3xl font-bold mb-6 font-h1 text-primary">Assignments</h2>
    <div className="space-y-4 max-w-3xl">{assignments.map(a=>{
      const sub = getSub(a.id);
      const isGraded = sub && sub.status === 'graded';
      const canResubmit = sub && a.allow_resubmission && !isGraded;
      
      return (
      <GlassCard key={a.id} className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-6">
            <h3 className="text-lg font-semibold text-on-surface font-h3">{a.title}</h3>
            {a.description&&<p className="text-on-surface-variant text-sm mt-1 whitespace-pre-line leading-relaxed">{a.description}</p>}
            {a.file_url&&<a href={`${axios.defaults.baseURL}${a.file_url}`} target="_blank" rel="noreferrer" className="text-primary text-sm hover:underline mt-3 inline-flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">attach_file</span> View Attachment</a>}
            <p className="text-outline text-xs mt-4">Teacher: {a.teacher_name} · Due: {a.due_date||'No deadline'} · Max Score: <span className="font-mono">{a.max_score||100}</span></p>
          </div>
          <div className="text-right">
            {sub ? (
              <div className="flex flex-col items-end gap-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${isGraded?'bg-primary-container/10 text-primary border-primary/20':sub.status==='late'?'bg-error-container/20 text-error border-error/30':'bg-secondary-container/20 text-secondary border-secondary/30'}`}>
                  {sub.status === 'graded' ? `Graded: ${sub.grade}/${a.max_score||100}` : sub.status}
                </span>
                {sub.feedback && <p className="text-xs text-on-surface-variant italic max-w-xs text-right mt-1 bg-surface-container-low p-2 rounded-lg border border-outline-variant/30">"{sub.feedback}"</p>}
                {canResubmit && <button onClick={() => { setSubmissionModal(a); setContent(sub.content || ''); }} className="text-primary text-xs hover:text-primary-fixed-dim underline mt-2 font-label-sm">Resubmit</button>}
              </div>
            ) : (
              <button onClick={() => setSubmissionModal(a)} className="bg-primary hover:bg-primary-fixed-dim px-6 py-2 rounded-lg text-sm text-on-primary font-label-sm transition shadow-[0_0_15px_rgba(0,209,255,0.2)]">Submit</button>
            )}
          </div>
        </div>
      </GlassCard>)
    })}{assignments.length===0&&<p className="text-outline">No pending assignments.</p>}</div>

    {/* Submission Modal */}
    {submissionModal && (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="glass-modal rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
          <div className="p-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low">
            <h3 className="text-xl font-bold text-on-surface font-h3">Submit: {submissionModal.title}</h3>
            <button onClick={() => { setSubmissionModal(null); setContent(''); setFile(null); setMsg(''); }} className="text-outline hover:text-on-surface transition"><X size={20}/></button>
          </div>
          <form onSubmit={submit} className="p-6 space-y-5 bg-surface">
            <div>
              <label className="block text-sm text-on-surface-variant mb-2 font-label-sm">Text Response (Optional if attaching file)</label>
              <textarea rows={4} className="w-full bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg focus:outline-none focus:border-primary text-on-surface transition" value={content} onChange={e=>setContent(e.target.value)} placeholder="Type your answer here..."></textarea>
            </div>
            <div>
              <label className="block text-sm text-on-surface-variant mb-2 font-label-sm">File Attachment</label>
              <FileUpload file={file} onFileSelect={setFile} onRemove={()=>setFile(null)} progress={progress} compact={true} />
            </div>
            {msg && <p className={`text-sm font-label-sm ${msg.includes('failed') ? 'text-error' : 'text-primary'}`}>{msg}</p>}
            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/10">
              <button type="button" onClick={() => { setSubmissionModal(null); setContent(''); setFile(null); setMsg(''); }} className="px-5 py-2 text-outline hover:text-on-surface hover:bg-surface-variant rounded-lg transition font-label-sm">Cancel</button>
              <button disabled={progress !== null} className="bg-primary hover:bg-primary-fixed-dim px-6 py-2 rounded-lg text-on-primary font-label-sm disabled:opacity-50 transition shadow-[0_0_10px_rgba(0,209,255,0.2)]">{progress !== null ? 'Uploading...' : 'Submit Assignment'}</button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>);
};

/* ─── Student Dashboard Shell ─── */
const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [page, setPage] = useState('overview');
  
  const navItems = [
    { key: 'overview', label: 'Dashboard', icon: 'dashboard' },
    { key: 'assignments', label: 'Assignments', icon: 'assignment' },
    { key: 'materials', label: 'Materials', icon: 'menu_book' },
    { key: 'results', label: 'Results', icon: 'fact_check' },
    { key: 'attendance', label: 'Attendance', icon: 'how_to_reg' },
    { key: 'chat', label: 'Chat w/ Teacher', icon: 'chat' },
  ];

  const renderPage = () => {
    switch(page) {
      case 'overview': return <StudentOverview/>;
      case 'materials': return <StudyMaterials/>;
      case 'results': return <Results/>;
      case 'attendance': return <AttendancePage/>;
      case 'chat': return <ChatPage/>;
      default: return <AssignmentsPage/>;
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
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Student Portal</span>
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
                 <div className="text-[10px] text-outline uppercase">Student</div>
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

export default StudentDashboard;
