import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../App';
import axios from 'axios';
import { LogOut, BookOpen, FileCheck, Send, Upload, Plus, X, ClipboardList, Calendar, MessageSquare, Menu } from 'lucide-react';
import FileUpload from '../../components/FileUpload';

/* ─── Shared Glass Components ─── */
const GlassCard = ({ children, className = '' }) => (
  <div className={`glass-card rounded-xl p-card-padding relative overflow-hidden ${className}`}>
    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-white/20 to-transparent"></div>
    {children}
  </div>
);

/* ─── Dashboard Overview (Bento Grid from Design) ─── */
const DashboardOverview = () => {
  const { user } = useContext(AuthContext);
  return (
    <div>
      <div className="mb-8 relative">
        <div className="glow-primary -top-10 -left-10"></div>
        <h1 className="font-h1 text-h1 text-on-surface mb-2 tracking-tight">Good Morning, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{user?.name}</span></h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Here is the overview of your classes and tasks for today.</p>
      </div>

      <div className="grid grid-cols-12 gap-gutter auto-rows-min">
        {/* Quick Metrics */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-3 gap-6">
          <GlassCard className="group p-5">
            <div className="glow-primary -bottom-10 -right-10 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded bg-primary-container/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Pending Grading</span>
            </div>
            <div className="font-h2 text-h2 text-on-surface">12</div>
          </GlassCard>
          
          <GlassCard className="group p-5">
            <div className="glow-accent -bottom-10 -right-10 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded bg-secondary-container/20 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[18px]">forum</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Unread Messages</span>
            </div>
            <div className="font-h2 text-h2 text-on-surface">4</div>
          </GlassCard>
          
          <GlassCard className="group p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded bg-tertiary-container/20 flex items-center justify-center text-tertiary-fixed">
                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Upcoming Events</span>
            </div>
            <div className="font-h2 text-h2 text-on-surface">2</div>
          </GlassCard>
        </div>

        {/* Schedule */}
        <div className="col-span-12 lg:col-span-4 glass-card rounded-xl p-card-padding relative overflow-hidden flex flex-col min-h-[420px] row-span-2">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-white/20 to-transparent"></div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-h3 text-h3 text-on-surface">Today's Classes</h3>
            <span className="material-symbols-outlined text-outline hover:text-primary transition-colors cursor-pointer">more_horiz</span>
          </div>
          <div className="flex-1 relative">
            <div className="absolute left-[11px] top-2 bottom-4 w-[2px] bg-outline-variant/30"></div>
            <div className="space-y-6">
              <div className="relative pl-8 opacity-60">
                <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant/50">
                  <div className="w-2 h-2 rounded-full bg-outline"></div>
                </div>
                <div className="font-label-sm text-label-sm text-outline mb-1">08:30 AM - 09:45 AM</div>
                <div className="font-body-md text-body-md text-on-surface font-semibold">Biology 101</div>
              </div>
              <div className="relative pl-8">
                <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-secondary-container/30 flex items-center justify-center border border-secondary shadow-[0_0_10px_rgba(233,179,255,0.4)]">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                </div>
                <div className="font-label-sm text-label-sm text-secondary mb-1 flex items-center gap-2">
                  10:00 AM - 11:15 AM <span className="px-2 py-0.5 rounded-full bg-secondary-container/50 text-on-secondary-container text-[10px] uppercase tracking-wider font-bold">In Progress</span>
                </div>
                <div className="font-body-lg text-body-lg text-on-surface font-semibold">AP Physics</div>
                <div className="absolute -inset-2 bg-secondary/5 blur-xl -z-10 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Widget */}
        <div className="col-span-12 lg:col-span-8 glass-card rounded-xl p-card-padding relative overflow-hidden flex-1 border border-secondary/20 shadow-[inset_0_0_20px_rgba(125,1,177,0.05)] mt-6">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-secondary/50 to-transparent"></div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-h3 text-h3 text-on-surface flex items-center gap-2"><span className="material-symbols-outlined text-secondary">fact_check</span> Quick Links</h3>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Access your most used modules</p>
            </div>
          </div>
          <div className="flex gap-4">
             <button className="px-6 py-3 bg-surface-container hover:bg-surface-variant border border-outline-variant/30 rounded-lg font-label-sm text-label-sm transition-colors text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">edit_document</span> Grade Recent Submissions
             </button>
             <button className="px-6 py-3 bg-surface-container hover:bg-surface-variant border border-outline-variant/30 rounded-lg font-label-sm text-label-sm transition-colors text-secondary flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">campaign</span> Post Announcement
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Study Materials ─── */
const StudyMaterials = () => {
  const [materials, setMaterials] = useState([]); const [showForm, setShowForm] = useState(false); const [title, setTitle] = useState(''); const [desc, setDesc] = useState(''); const [file, setFile] = useState(null); const [msg, setMsg] = useState(''); const [progress, setProgress] = useState(null);
  const load = () => axios.get('/api/materials').then(r => setMaterials(r.data));
  useEffect(() => { load(); }, []);
  const upload = async (e) => { 
    e.preventDefault(); 
    const fd = new FormData(); fd.append('title', title); fd.append('description', desc); if (file) fd.append('material_file', file);
    try { 
      setProgress(0);
      await axios.post('/api/materials', fd, { 
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: p => setProgress(Math.round((p.loaded * 100) / p.total))
      }); 
      setMsg('Uploaded!'); setTitle(''); setDesc(''); setFile(null); setShowForm(false); load(); 
    } catch(e) { setMsg(e.response?.data?.error||'Failed'); } 
    finally { setProgress(null); }
    setTimeout(()=>setMsg(''),3000); 
  };
  return (<div><div className="flex justify-between items-center mb-6"><h2 className="text-3xl font-bold font-h1 text-primary">Study Materials</h2><button onClick={()=>setShowForm(!showForm)} className="flex items-center gap-2 bg-primary-container text-on-primary-container hover:bg-primary px-4 py-2 rounded-lg font-label-sm text-label-sm transition shadow-[0_0_15px_rgba(0,209,255,0.2)]"><Upload size={16}/>Upload</button></div>
    {msg&&<p className="mb-4 text-secondary font-medium">{msg}</p>}
    {showForm&&<GlassCard className="mb-8 max-w-2xl"><form onSubmit={upload} className="space-y-4"><input placeholder="Title" required className="w-full bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg focus:outline-none focus:border-primary text-on-surface transition-colors" value={title} onChange={e=>setTitle(e.target.value)}/><textarea placeholder="Description" rows={2} className="w-full bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg focus:outline-none focus:border-primary text-on-surface transition-colors" value={desc} onChange={e=>setDesc(e.target.value)}/>
    <FileUpload file={file} onFileSelect={setFile} onRemove={()=>setFile(null)} progress={progress} />
    <div className="flex gap-3"><button disabled={progress !== null} className="bg-primary hover:bg-primary-fixed-dim text-on-primary py-2 px-6 rounded-lg font-label-sm text-label-sm disabled:opacity-50 transition">Upload</button><button type="button" onClick={()=>setShowForm(false)} className="text-outline hover:text-on-surface transition"><X size={20}/></button></div></form></GlassCard>}
    <div className="space-y-4">{materials.map(m=>(<GlassCard key={m.id} className="p-5"><h3 className="text-lg font-semibold text-on-surface font-h3">{m.title}</h3>{m.description&&<p className="text-on-surface-variant mt-1">{m.description}</p>}{m.file_url&&<a href={`${axios.defaults.baseURL}${m.file_url}`} target="_blank" rel="noreferrer" className="text-primary text-sm hover:underline mt-2 inline-flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">attach_file</span> Download</a>}<p className="text-outline text-xs mt-3">By {m.teacher_name} · {new Date(m.created_at).toLocaleString()}</p></GlassCard>))}{materials.length===0&&<p className="text-outline">No materials.</p>}</div></div>);
};

/* ─── Results Publishing ─── */
const PublishResults = () => {
  const [results, setResults] = useState([]); const [students, setStudents] = useState([]); const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ system_uid: '', exam_name: '', score: '', grades: '' }); const [msg, setMsg] = useState('');
  const load = async () => { const [r, s] = await Promise.all([axios.get('/api/results'), axios.get('/api/sis/students')]); setResults(r.data); setStudents(s.data); };
  useEffect(() => { load(); }, []);
  const publish = async (e) => { e.preventDefault(); try { await axios.post('/api/results', { ...form, score: parseFloat(form.score), published: 1 }); setMsg('Published!'); setForm({ system_uid: '', exam_name: '', score: '', grades: '' }); setShowForm(false); load(); } catch(e) { setMsg(e.response?.data?.error||'Failed'); } setTimeout(()=>setMsg(''),3000); };
  return (<div><div className="flex justify-between items-center mb-6"><h2 className="text-3xl font-bold font-h1 text-primary">Results</h2><button onClick={()=>setShowForm(!showForm)} className="flex items-center gap-2 bg-primary-container text-on-primary-container hover:bg-primary px-4 py-2 rounded-lg font-label-sm text-label-sm transition shadow-[0_0_15px_rgba(0,209,255,0.2)]"><Plus size={16}/>Publish</button></div>
    {msg&&<p className="mb-4 text-secondary">{msg}</p>}
    {showForm&&<GlassCard className="mb-8 max-w-2xl"><form onSubmit={publish} className="space-y-4"><select required className="w-full bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg text-on-surface focus:outline-none focus:border-primary transition" value={form.system_uid} onChange={e=>setForm({...form,system_uid:e.target.value})}><option value="">Select Student</option>{students.map(s=><option key={s.id} value={s.system_uid}>{s.system_uid} — {s.name}</option>)}</select><input placeholder="Exam Name" required className="w-full bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg focus:outline-none focus:border-primary text-on-surface transition" value={form.exam_name} onChange={e=>setForm({...form,exam_name:e.target.value})}/><div className="grid grid-cols-2 gap-4"><input placeholder="Score" type="number" required className="bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg focus:outline-none focus:border-primary text-on-surface transition" value={form.score} onChange={e=>setForm({...form,score:e.target.value})}/><input placeholder="Grade" className="bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg focus:outline-none focus:border-primary text-on-surface transition" value={form.grades} onChange={e=>setForm({...form,grades:e.target.value})}/></div><div className="flex gap-3"><button className="bg-primary hover:bg-primary-fixed-dim text-on-primary py-2 px-6 rounded-lg font-label-sm text-label-sm transition">Publish</button><button type="button" onClick={()=>setShowForm(false)} className="text-outline hover:text-on-surface"><X size={20}/></button></div></form></GlassCard>}
    <GlassCard className="!p-0"><table className="w-full text-left border-collapse"><thead className="bg-surface-container-low"><tr><th className="font-label-sm text-label-sm text-outline p-4 border-b border-outline-variant/30 font-medium">UID</th><th className="font-label-sm text-label-sm text-outline p-4 border-b border-outline-variant/30 font-medium">Student</th><th className="font-label-sm text-label-sm text-outline p-4 border-b border-outline-variant/30 font-medium">Exam</th><th className="font-label-sm text-label-sm text-outline p-4 border-b border-outline-variant/30 font-medium">Score</th><th className="font-label-sm text-label-sm text-outline p-4 border-b border-outline-variant/30 font-medium">Grade</th></tr></thead><tbody className="font-body-md text-body-md text-on-surface">{results.map((r,i)=>(<tr key={i} className="hover:bg-white/[0.02] transition-colors border-b border-outline-variant/10"><td className="p-4 text-primary font-mono">{r.system_uid}</td><td className="p-4 text-on-surface">{r.name}</td><td className="p-4 text-on-surface-variant">{r.exam_name}</td><td className="p-4 text-on-surface-variant">{r.score}</td><td className="p-4 text-secondary font-semibold">{r.grades||'—'}</td></tr>))}{results.length===0&&<tr><td colSpan={5} className="p-4 text-center text-outline">No results.</td></tr>}</tbody></table></GlassCard></div>);
};

/* ─── Attendance Marking ─── */
const AttendanceMark = () => {
  const [classes, setClasses] = useState([]); const [selectedClass, setSelectedClass] = useState(''); const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState([]); const [msg, setMsg] = useState('');
  useEffect(() => { axios.get('/api/sis/classes').then(r => setClasses(r.data)); }, []);
  const loadStudents = async () => { if (!selectedClass) return; const r = await axios.get(`/api/attendance/class/${selectedClass}?date=${date}`); setRecords(r.data); };
  useEffect(() => { if (selectedClass) loadStudents(); }, [selectedClass, date]);
  const toggleStatus = (idx) => { const updated = [...records]; updated[idx].status = updated[idx].status === 'present' ? 'absent' : 'present'; setRecords(updated); };
  const save = async () => { try { await axios.post('/api/attendance/mark', { date, records: records.map(r => ({ student_id: r.student_id, status: r.status })) }); setMsg('Saved!'); } catch(e) { setMsg('Failed'); } setTimeout(()=>setMsg(''),3000); };
  return (<div><h2 className="text-3xl font-bold mb-6 font-h1 text-primary">Mark Attendance</h2>
    <div className="flex gap-4 mb-6"><select className="bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg text-on-surface focus:border-primary transition" value={selectedClass} onChange={e=>setSelectedClass(e.target.value)}><option value="">Select Class</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><input type="date" className="bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg text-on-surface focus:border-primary transition" value={date} onChange={e=>setDate(e.target.value)}/></div>
    {msg&&<p className="mb-4 text-secondary">{msg}</p>}
    {records.length > 0 && (<><GlassCard className="!p-0 mb-6"><table className="w-full text-left border-collapse"><thead className="bg-surface-container-low"><tr><th className="font-label-sm text-label-sm text-outline p-4 border-b border-outline-variant/30 font-medium">UID</th><th className="font-label-sm text-label-sm text-outline p-4 border-b border-outline-variant/30 font-medium">Student</th><th className="font-label-sm text-label-sm text-outline p-4 border-b border-outline-variant/30 font-medium">Status</th></tr></thead><tbody className="font-body-md text-body-md text-on-surface">{records.map((r,i)=><tr key={i} className="hover:bg-white/[0.02] transition-colors border-b border-outline-variant/10 cursor-pointer" onClick={()=>toggleStatus(i)}><td className="p-4 text-primary font-mono">{r.system_uid}</td><td className="p-4 text-on-surface">{r.student_name}</td><td className="p-4"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${r.status==='present'?'bg-primary-container/10 text-primary border-primary/20':'bg-error-container/20 text-error border-error/30'}`}>{r.status}</span></td></tr>)}</tbody></table></GlassCard><button onClick={save} className="bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-sm text-label-sm py-3 px-8 rounded-lg shadow-[0_0_15px_rgba(0,209,255,0.2)] transition">Save Attendance</button></>)}
    {selectedClass && records.length===0 && <p className="text-outline">No students in this class.</p>}
  </div>);
};

/* ─── Assignments ─── */
const AssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]); const [classes, setClasses] = useState([]); const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', due_date: '', class_id: '', allow_resubmission: false, max_score: 100 }); const [file, setFile] = useState(null); const [msg, setMsg] = useState('');
  const [subs, setSubs] = useState(null); const [selectedAssignment, setSelectedAssignment] = useState(null); const [progress, setProgress] = useState(null);
  const load = async () => { const [a, c] = await Promise.all([axios.get('/api/assignments'), axios.get('/api/sis/classes')]); setAssignments(a.data); setClasses(c.data); };
  useEffect(() => { load(); }, []);
  const create = async (e) => { 
    e.preventDefault(); const fd = new FormData(); 
    Object.keys(form).forEach(k => fd.append(k, form[k]));
    if (file) fd.append('attachment', file);
    try { 
      setProgress(0);
      await axios.post('/api/assignments', fd, { 
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: p => setProgress(Math.round((p.loaded * 100) / p.total))
      }); 
      setMsg('Created!'); setShowForm(false); setForm({ title: '', description: '', due_date: '', class_id: '', allow_resubmission: false, max_score: 100 }); setFile(null); load(); 
    } catch(e) { setMsg(e.response?.data?.error||'Failed'); } 
    finally { setProgress(null); }
    setTimeout(()=>setMsg(''),3000); 
  };
  const viewSubs = async (id) => { const r = await axios.get(`/api/assignments/${id}/submissions`); setSubs(r.data); setSelectedAssignment(id); };
  const gradeSubmission = async (subId) => { const grade = prompt('Enter grade (0-100):'); const feedback = prompt('Feedback (optional):');
    if (grade !== null) { try { await axios.put(`/api/assignments/submissions/${subId}/grade`, { grade: parseFloat(grade), feedback: feedback || '' }); viewSubs(selectedAssignment); setMsg('Graded!'); } catch(e) { setMsg('Failed'); } setTimeout(()=>setMsg(''),3000); }};
  return (<div><div className="flex justify-between items-center mb-6"><h2 className="text-3xl font-bold font-h1 text-primary">Assignments</h2><button onClick={()=>setShowForm(!showForm)} className="flex items-center gap-2 bg-primary-container text-on-primary-container hover:bg-primary px-4 py-2 rounded-lg font-label-sm text-label-sm transition shadow-[0_0_15px_rgba(0,209,255,0.2)]"><Plus size={16}/>Create</button></div>
    {msg&&<p className="mb-4 text-secondary">{msg}</p>}
    {showForm&&<GlassCard className="mb-8 max-w-2xl"><form onSubmit={create} className="space-y-4"><input placeholder="Title" required className="w-full bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg text-on-surface focus:border-primary transition" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/><textarea placeholder="Description" rows={3} className="w-full bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg text-on-surface focus:border-primary transition" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
    <div className="grid grid-cols-2 gap-4"><input type="date" className="bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg text-on-surface focus:border-primary transition" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})}/><select className="bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg text-on-surface focus:border-primary transition" value={form.class_id} onChange={e=>setForm({...form,class_id:e.target.value})}><option value="">All Classes</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
    <div className="grid grid-cols-2 gap-4"><div className="flex items-center gap-2"><input type="checkbox" id="resub" className="rounded border-outline-variant bg-surface-container text-primary focus:ring-primary" checked={form.allow_resubmission} onChange={e=>setForm({...form,allow_resubmission:e.target.checked})}/><label htmlFor="resub" className="text-on-surface-variant text-sm">Allow Resubmission</label></div><div className="flex items-center gap-2"><label className="text-on-surface-variant text-sm">Max Score:</label><input type="number" className="bg-surface-container-highest border border-outline-variant/50 p-2 rounded-lg text-on-surface w-24 focus:border-primary transition" value={form.max_score} onChange={e=>setForm({...form,max_score:e.target.value})}/></div></div>
    <FileUpload file={file} onFileSelect={setFile} onRemove={()=>setFile(null)} progress={progress} />
    <div className="flex gap-3"><button disabled={progress!==null} className="bg-primary hover:bg-primary-fixed-dim text-on-primary py-2 px-6 rounded-lg font-label-sm text-label-sm transition disabled:opacity-50">Create</button><button type="button" onClick={()=>setShowForm(false)} className="text-outline hover:text-on-surface"><X size={20}/></button></div></form></GlassCard>}
    
    {!subs && (
      <GlassCard className="!p-0">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low">
            <tr><th className="font-label-sm text-label-sm text-outline p-4 border-b border-outline-variant/30">Assignment</th><th className="font-label-sm text-label-sm text-outline p-4 border-b border-outline-variant/30">Class</th><th className="font-label-sm text-label-sm text-outline p-4 border-b border-outline-variant/30">Due Date</th><th className="font-label-sm text-label-sm text-outline p-4 border-b border-outline-variant/30 text-right">Status</th></tr>
          </thead>
          <tbody className="font-body-md text-body-md text-on-surface">
            {assignments.map(a=>(
              <tr key={a.id} className="hover:bg-white/[0.02] transition-colors border-b border-outline-variant/10 cursor-pointer group" onClick={()=>viewSubs(a.id)}>
                <td className="p-4"><div className="font-semibold text-on-surface">{a.title}</div><div className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 max-w-md truncate">{a.description||'No description'}</div></td>
                <td className="p-4 text-on-surface-variant">{a.class_name||'All Classes'}</td>
                <td className="p-4 text-on-surface-variant">{a.due_date||'—'}</td>
                <td className="p-4 text-right"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary-container/20 text-secondary border border-secondary/20 shadow-[0_0_8px_rgba(233,179,255,0.1)]">{a.submission_count} Subs ({a.graded_count} Graded)</span></td>
              </tr>
            ))}
            {assignments.length===0&&<tr><td colSpan={4} className="p-4 text-center text-outline">No assignments.</td></tr>}
          </tbody>
        </table>
      </GlassCard>
    )}

    {subs&&<GlassCard><h3 className="text-xl font-semibold mb-4 text-on-surface font-h3">Submissions</h3><div className="space-y-3">{subs.map(s=>(<div key={s.id} className="flex justify-between items-center p-4 bg-surface-container-low border border-outline-variant/20 rounded-lg"><div><span className="text-primary font-mono text-sm">{s.system_uid}</span> <span className="text-on-surface ml-2">{s.student_name}</span><span className={`ml-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.status==='graded'?'bg-primary-container/20 text-primary border border-primary/30':s.status==='late'?'bg-error-container/20 text-error border border-error/30':'bg-secondary-container/20 text-secondary border border-secondary/30'}`}>{s.status}</span>{s.grade!==null&&<span className="ml-3 text-secondary font-bold font-mono">{s.grade}%</span>}{s.resubmission_count > 0 && <span className="ml-2 text-xs text-outline">({s.resubmission_count} resubmissions)</span>}{s.file_url&&<a href={`${axios.defaults.baseURL}${s.file_url}`} target="_blank" rel="noreferrer" className="ml-3 text-primary text-sm hover:underline"><span className="material-symbols-outlined text-[16px] translate-y-1">attach_file</span></a>}</div><button onClick={()=>gradeSubmission(s.id)} className="bg-surface-container hover:bg-surface-variant border border-outline-variant/50 px-4 py-1.5 rounded-lg text-primary font-label-sm transition">Grade</button></div>))}{subs.length===0&&<p className="text-outline text-sm">No submissions yet.</p>}</div><button onClick={()=>{setSubs(null);setSelectedAssignment(null);}} className="mt-6 text-outline hover:text-on-surface font-label-sm transition flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to Assignments</button></GlassCard>}
  </div>);
};

/* ─── Announcements ─── */
const TeacherAnnouncements = () => {
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
  return (<div><h2 className="text-3xl font-bold mb-6 font-h1 text-primary">Announcements</h2>
    <GlassCard className="mb-8 max-w-2xl"><form onSubmit={post} className="space-y-4"><textarea rows={3} placeholder="Write a notice..." required className="w-full bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg text-on-surface focus:border-primary transition" value={text} onChange={e=>setText(e.target.value)}/>
    <FileUpload file={file} onFileSelect={setFile} onRemove={()=>setFile(null)} progress={progress} compact={true} />
    <button disabled={progress!==null} className="bg-primary hover:bg-primary-fixed-dim text-on-primary py-2 px-6 rounded-lg font-label-sm transition disabled:opacity-50">Post</button>
    {msg&&<p className="text-secondary">{msg}</p>}</form></GlassCard>
    <div className="space-y-4 max-w-2xl">{list.map(a=>(<GlassCard key={a.id} className="p-5"><p className="text-on-surface whitespace-pre-line leading-relaxed">{a.message}</p>{a.file_url&&<a href={`${axios.defaults.baseURL}${a.file_url}`} target="_blank" rel="noreferrer" className="text-primary text-sm hover:underline mt-3 inline-flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">attach_file</span> Attachment</a>}<p className="text-outline text-xs mt-4">By {a.author} · {new Date(a.created_at).toLocaleString()}</p></GlassCard>))}{list.length===0&&<p className="text-outline">No announcements.</p>}</div></div>);
};

/* ─── Chat ─── */
const ChatPage = () => {
  const [contacts, setContacts] = useState([]); const [selected, setSelected] = useState(null); const [messages, setMessages] = useState([]); const [text, setText] = useState('');
  useEffect(() => { axios.get('/api/chat/contacts').then(r => setContacts(r.data)); }, []);
  useEffect(() => { if (selected) { axios.get(`/api/chat?with_user=${selected.id}`).then(r => setMessages(r.data)); const iv = setInterval(() => { axios.get(`/api/chat?with_user=${selected.id}`).then(r => setMessages(r.data)); }, 3000); return () => clearInterval(iv); } }, [selected]);
  const send = async (e) => { e.preventDefault(); if (!text.trim()) return; await axios.post('/api/chat', { message: text, receiver_id: selected.id }); setText(''); axios.get(`/api/chat?with_user=${selected.id}`).then(r => setMessages(r.data)); };
  return (<div className="flex gap-6 h-[calc(100vh-10rem)]"><GlassCard className="w-72 !p-0 overflow-y-auto shrink-0 border-r border-white/5"><h3 className="p-4 font-semibold text-on-surface border-b border-outline-variant/30 bg-surface-container-low font-h3 sticky top-0">Contacts</h3>{contacts.map(c=><button key={c.id} onClick={()=>setSelected(c)} className={`w-full p-4 text-left border-b border-outline-variant/10 transition flex flex-col ${selected?.id===c.id?'bg-primary-container/10 border-l-2 border-l-primary':'hover:bg-white/[0.02]'}`}><span className="text-on-surface font-medium">{c.name}</span><span className="text-[11px] text-outline uppercase tracking-wider mt-1">{c.role}</span></button>)}</GlassCard>
    <GlassCard className="flex-1 flex flex-col !p-0">{selected?<><div className="p-5 border-b border-outline-variant/30 font-semibold text-on-surface bg-surface-container-low font-h3">{selected.name}</div><div className="flex-1 overflow-y-auto p-6 space-y-4">{messages.map(m=><div key={m.id} className={`max-w-md p-3.5 rounded-2xl text-sm ${m.sender_name===selected.name?'bg-surface-container-high text-on-surface rounded-tl-sm':'bg-primary text-on-primary ml-auto rounded-tr-sm'}`}><p className="leading-relaxed">{m.message}</p><p className={`text-[10px] mt-1.5 ${m.sender_name===selected.name?'text-outline':'text-on-primary/70'}`}>{new Date(m.created_at).toLocaleTimeString()}</p></div>)}</div><form onSubmit={send} className="p-4 border-t border-outline-variant/30 bg-surface-container-low flex gap-3"><input className="flex-1 bg-surface-container-highest border border-outline-variant/50 p-3 rounded-xl focus:outline-none focus:border-primary text-on-surface transition" placeholder="Type a message..." value={text} onChange={e=>setText(e.target.value)}/><button className="bg-primary hover:bg-primary-fixed-dim text-on-primary px-6 py-3 rounded-xl font-label-sm transition shadow-[0_0_10px_rgba(0,209,255,0.2)]">Send</button></form></>:<div className="flex-1 flex items-center justify-center text-outline font-body-lg">Select a contact to start messaging</div>}</GlassCard></div>);
};

/* ─── AI Assistant (Teacher) ─── */
const AIAssistant = () => {
  const [topic, setTopic] = useState(''); const [explanation, setExplanation] = useState('');
  const [content, setContent] = useState(''); const [quiz, setQuiz] = useState(null);
  const [file, setFile] = useState(null); const [visionPrompt, setVisionPrompt] = useState('Analyze this assignment submission and grade it based on standard criteria.'); const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  const getExplanation = async () => { if(!topic) return; setLoading(true); try { const r = await axios.post('/api/ai/explain', { topic }); setExplanation(r.data.explanation); } catch(e) { alert('Failed'); } setLoading(false); };
  const getQuiz = async () => { if(!content) return; setLoading(true); try { const r = await axios.post('/api/ai/quiz', { content, count: 5 }); setQuiz(r.data.questions); } catch(e) { alert('Failed'); } setLoading(false); };
  const analyzeVision = async () => {
    if(!file) return; setLoading(true); const fd = new FormData(); fd.append('image', file); fd.append('prompt', visionPrompt);
    try { const r = await axios.post('/api/ai/vision', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); setAnalysis(r.data.analysis); } catch(e) { alert('Failed'); } setLoading(false);
  };

  return (
    <div>
      <div className="mb-8 relative">
        <div className="glow-accent -top-10 -left-10"></div>
        <h2 className="text-3xl font-bold font-h1 text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary mb-2">Lumina AI Assistant</h2>
        <p className="font-body-lg text-on-surface-variant">Generate content, create quizzes, and analyze assignments with AI.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <GlassCard className="flex flex-col">
          <h3 className="text-xl font-semibold mb-4 text-on-surface font-h3 flex items-center gap-2"><span className="material-symbols-outlined text-primary">menu_book</span> Content Explainer</h3>
          <input placeholder="Topic (e.g., Photosynthesis)" className="w-full bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg text-on-surface focus:border-primary transition mb-4" value={topic} onChange={e=>setTopic(e.target.value)}/>
          <button onClick={getExplanation} disabled={loading} className="bg-primary hover:bg-primary-fixed-dim text-on-primary py-2 px-6 rounded-lg font-label-sm transition disabled:opacity-50">Generate Explanation</button>
          {explanation && <div className="mt-4 p-4 bg-surface-container-low rounded-lg border border-outline-variant/30 text-on-surface whitespace-pre-line text-sm max-h-64 overflow-y-auto">{explanation}</div>}
        </GlassCard>

        <GlassCard className="flex flex-col">
          <h3 className="text-xl font-semibold mb-4 text-on-surface font-h3 flex items-center gap-2"><span className="material-symbols-outlined text-secondary">quiz</span> Quiz Generator</h3>
          <textarea placeholder="Paste study material text here..." rows={3} className="w-full bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg text-on-surface focus:border-primary transition mb-4" value={content} onChange={e=>setContent(e.target.value)}/>
          <button onClick={getQuiz} disabled={loading} className="bg-secondary hover:bg-secondary-fixed-dim text-on-secondary py-2 px-6 rounded-lg font-label-sm transition disabled:opacity-50">Generate Quiz</button>
          {quiz && (
            <div className="mt-4 p-4 bg-surface-container-low rounded-lg border border-outline-variant/30 text-on-surface text-sm max-h-64 overflow-y-auto space-y-4">
              {quiz.map((q, i) => (
                <div key={i}>
                  <p className="font-semibold">{i+1}. {q.question}</p>
                  <ul className="pl-4 list-disc text-outline mt-1 space-y-1">
                    {q.options.map((opt, j) => <li key={j} className={j === q.answer ? 'text-secondary font-medium' : ''}>{opt}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      <GlassCard>
         <h3 className="text-xl font-semibold mb-4 text-on-surface font-h3 flex items-center gap-2"><span className="material-symbols-outlined text-tertiary-fixed">document_scanner</span> Vision & Grading Assistant</h3>
         <p className="text-sm text-on-surface-variant mb-4">Upload a student's handwritten assignment or diagram for AI analysis.</p>
         <div className="grid md:grid-cols-2 gap-6">
            <div>
              <FileUpload file={file} onFileSelect={setFile} onRemove={()=>setFile(null)} compact={true} />
              <textarea placeholder="Prompt / Grading criteria..." rows={2} className="w-full bg-surface-container-highest border border-outline-variant/50 p-3 rounded-lg text-on-surface focus:border-primary transition mt-4 mb-4" value={visionPrompt} onChange={e=>setVisionPrompt(e.target.value)}/>
              <button onClick={analyzeVision} disabled={loading||!file} className="bg-tertiary-fixed hover:bg-tertiary-fixed-dim text-on-tertiary-fixed py-2 px-6 rounded-lg font-label-sm transition disabled:opacity-50 w-full">Analyze Image</button>
            </div>
            <div>
              {analysis ? <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant/30 text-on-surface whitespace-pre-line text-sm h-full overflow-y-auto">{analysis}</div> : <div className="h-full flex items-center justify-center border border-dashed border-outline-variant/30 rounded-lg text-outline text-sm">Analysis results will appear here</div>}
            </div>
         </div>
      </GlassCard>
    </div>
  );
};

/* ─── Teacher Dashboard Shell ─── */
const TeacherDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [page, setPage] = useState('overview');
  
  const navItems = [
    { key: 'overview', label: 'Dashboard', icon: 'dashboard' },
    { key: 'assignments', label: 'Assignments', icon: 'assignment' },
    { key: 'materials', label: 'Materials', icon: 'menu_book' },
    { key: 'results', label: 'Results', icon: 'fact_check' },
    { key: 'attendance', label: 'Attendance', icon: 'how_to_reg' },
    { key: 'announcements', label: 'Notices', icon: 'campaign' },
    { key: 'chat', label: 'Messages', icon: 'chat' },
    { key: 'ai', label: 'AI Assistant', icon: 'smart_toy' },
  ];

  const renderPage = () => {
    switch(page) {
      case 'overview': return <DashboardOverview/>;
      case 'materials': return <StudyMaterials/>;
      case 'results': return <PublishResults/>;
      case 'attendance': return <AttendanceMark/>;
      case 'announcements': return <TeacherAnnouncements/>;
      case 'chat': return <ChatPage/>;
      case 'ai': return <AIAssistant/>;
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
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Teacher Console</span>
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
                 <div className="text-[10px] text-outline uppercase">Instructor</div>
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

export default TeacherDashboard;
