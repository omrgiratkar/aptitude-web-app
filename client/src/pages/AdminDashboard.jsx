import { useCallback, useEffect, useState } from "react";
import { Download, Mail, Plus, RefreshCw, Search, Trash2, Users, FileQuestion, ClipboardCheck, ShieldCheck, X } from "lucide-react";
import api from "../api";
import { Notice, PageTitle, StatCard } from "../components/UI";

const categories = ["Quantitative Aptitude","Reasoning","Verbal/English"];
const levels = ["Easy","Medium","Hard"];
const emptyQuestion = { category: categories[0], difficulty: "Easy", questionText: "", options: ["","","",""], correctOption: 0, explanation: "", active: true };

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [dashboard, setDashboard] = useState({ students:0, questions:0, attempts:0, pendingScorecards:0 });
  const [students, setStudents] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyQuestion);

  const loadDashboard = useCallback(async () => {
    try { const {data} = await api.get("/admin/dashboard"); setDashboard(data); }
    catch(e) { setError(e.message); }
  }, []);
  const loadStudents = useCallback(async () => {
    try { const {data} = await api.get("/admin/students", {params:{q:query}}); setStudents(data.students); }
    catch(e) { setError(e.message); }
  }, [query]);
  const loadAttempts = useCallback(async () => {
    try { const {data} = await api.get("/admin/attempts"); setAttempts(data.attempts); }
    catch(e) { setError(e.message); }
  }, []);
  const loadQuestions = useCallback(async () => {
    try { const {data} = await api.get("/admin/questions"); setQuestions(data.questions); }
    catch(e) { setError(e.message); }
  }, []);
  useEffect(() => { loadDashboard(); loadStudents(); loadAttempts(); loadQuestions(); }, [loadDashboard, loadStudents, loadAttempts, loadQuestions]);

  async function downloadScorecard(id) {
    setError(""); setBusyId(id);
    try {
      const response = await api.get(`/admin/attempts/${id}/scorecard`, { responseType:"blob" });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement("a"); a.href = url; a.download = `scorecard-${id}.pdf`; a.click(); URL.revokeObjectURL(url);
    } catch(e) { setError(e.message); }
    finally { setBusyId(""); }
  }
  async function sendScorecard(id) {
    if (!window.confirm("Email the scorecard to the student's registered email? This will release their result.")) return;
    setError(""); setNotice(""); setBusyId(id);
    try { const {data} = await api.post(`/admin/attempts/${id}/send-scorecard`); setNotice(data.message); await Promise.all([loadDashboard(),loadAttempts(),loadStudents()]); }
    catch(e) { setError(e.message); }
    finally { setBusyId(""); }
  }
  function startEdit(q) {
    setEditing(q?._id || "new");
    setForm(q ? {...q, options:[...q.options]} : {...emptyQuestion, options:["","","",""]});
    setError(""); setNotice("");
  }
  async function saveQuestion(e) {
    e.preventDefault(); setError(""); setNotice("");
    const cleaned = {...form, options:form.options.map(o=>o.trim()).filter(Boolean), correctOption:Number(form.correctOption)};
    try {
      if (editing === "new") await api.post("/admin/questions", cleaned);
      else await api.put(`/admin/questions/${editing}`, cleaned);
      setNotice(editing==="new" ? "Question added successfully." : "Question updated successfully.");
      setEditing(null); setForm(emptyQuestion); await Promise.all([loadQuestions(),loadDashboard()]);
    } catch(e) { setError(e.message); }
  }
  async function deleteQuestion(id) {
    if (!window.confirm("Delete this question? Existing attempts keep their stored question snapshots.")) return;
    try { await api.delete(`/admin/questions/${id}`); setNotice("Question deleted."); await Promise.all([loadQuestions(),loadDashboard()]); }
    catch(e) { setError(e.message); }
  }
  const tabs = [{id:"overview",label:"Overview"},{id:"students",label:"Students"},{id:"questions",label:"Question bank"},{id:"results",label:"Real-test results"}];

  return <div>
    <PageTitle eyebrow="Admin console" title="Assessment control center" description="Manage students, maintain the question bank, and release official test scorecards." icon={ShieldCheck}/>
    <Notice>{error}</Notice><Notice type="success">{notice}</Notice>
    <div className="mb-6 flex flex-wrap gap-2">{tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${tab===t.id?"bg-slate-900 text-white":"border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{t.label}</button>)}</div>
    {tab==="overview" && <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Students" value={dashboard.students} icon={Users} tint="blue"/><StatCard label="Active questions" value={dashboard.questions} icon={FileQuestion} tint="violet"/><StatCard label="Completed tests" value={dashboard.attempts} icon={ClipboardCheck} tint="green"/><StatCard label="Pending scorecards" value={dashboard.pendingScorecards} icon={Mail} tint="amber"/></div><div className="mt-7 grid gap-5 lg:grid-cols-2"><div className="card p-6"><h2 className="text-lg font-extrabold">Quick actions</h2><p className="mt-1 text-sm text-slate-500">Keep the question bank and results up to date.</p><div className="mt-5 flex flex-wrap gap-3"><button className="btn-primary flex items-center gap-2" onClick={()=>{setTab("questions");startEdit(null)}}><Plus size={16}/> Add question</button><button className="btn-quiet flex items-center gap-2" onClick={()=>setTab("results")}><ClipboardCheck size={16}/> Review results</button></div></div><div className="card p-6"><h2 className="text-lg font-extrabold">Score release policy</h2><p className="mt-2 text-sm leading-6 text-slate-500">Real-test marks remain private until an Admin sends the scorecard successfully through the configured email provider. Downloading a PDF alone does not release the result.</p></div></div></>}
    {tab==="students" && <section className="card overflow-hidden"><div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center"><div><h2 className="text-lg font-extrabold">Student directory</h2><p className="text-sm text-slate-500">Profile details and real-test attempt status.</p></div><div className="relative w-full sm:max-w-xs"><Search size={17} className="absolute left-3 top-3 text-slate-400"/><input className="field pl-9" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name, email, branch"/></div></div><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr>{["Student","Email","Gender","Department","Real tests","Latest status"].map(h=><th key={h} className="px-5 py-3 font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{students.map(s=>{const latest=s.realTestAttempts?.[0];return <tr key={s._id} className="hover:bg-slate-50/70"><td className="px-5 py-4 font-bold">{s.name}</td><td className="px-5 py-4 text-slate-600">{s.email}</td><td className="px-5 py-4 text-slate-600">{s.gender||"—"}</td><td className="px-5 py-4 text-slate-600">{s.department||"—"}</td><td className="px-5 py-4">{s.realTestAttempts?.length||0}</td><td className="px-5 py-4">{latest ? latest.releasedAt ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Released · {latest.score}/{latest.total}</span> : <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">Pending</span> : <span className="text-slate-400">No test</span>}</td></tr>})}</tbody></table>{!students.length&&<p className="p-8 text-center text-slate-500">No students found.</p>}</div></section>}
    {tab==="questions" && <section className="card overflow-hidden"><div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5"><div><h2 className="text-lg font-extrabold">Question bank</h2><p className="text-sm text-slate-500">{questions.length} question(s) loaded</p></div><button className="btn-primary flex items-center gap-2" onClick={()=>startEdit(null)}><Plus size={16}/> Add question</button></div><div className="divide-y divide-slate-100">{questions.map(q=><div key={q._id} className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center"><div className="min-w-0"><div className="mb-1 flex flex-wrap gap-2"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{q.category}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{q.difficulty}</span></div><p className="font-semibold">{q.questionText}</p><p className="mt-1 text-xs text-slate-400">{q.options?.length} options · Correct: {q.options?.[q.correctOption]}</p></div><div className="flex shrink-0 gap-2"><button className="btn-quiet" onClick={()=>startEdit(q)}>Edit</button><button className="btn-quiet !px-3 text-rose-600" onClick={()=>deleteQuestion(q._id)} aria-label="Delete question"><Trash2 size={16}/></button></div></div>)}</div>{!questions.length&&<p className="p-8 text-center text-slate-500">No questions. Add questions or run the seed script.</p>}</section>}
    {tab==="results" && <section className="card overflow-hidden"><div className="border-b border-slate-100 p-5"><h2 className="text-lg font-extrabold">Real-test results</h2><p className="text-sm text-slate-500">Only Admin can see marks before release.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr>{["Student","Department","Submitted","Score","Release status","Actions"].map(h=><th key={h} className="px-5 py-3 font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{attempts.map(a=><tr key={a._id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><p className="font-bold">{a.studentId?.name||"Student"}</p><p className="text-xs text-slate-500">{a.studentId?.email}</p></td><td className="px-5 py-4 text-slate-600">{a.studentId?.department||"—"}</td><td className="px-5 py-4 text-slate-600">{a.submittedAt?new Date(a.submittedAt).toLocaleString():"—"}</td><td className="px-5 py-4"><span className="font-extrabold">{a.score}/{a.total}</span><span className="ml-2 text-xs text-slate-500">{a.total?Math.round(a.score/a.total*100):0}%</span></td><td className="px-5 py-4">{a.releasedAt?<span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Released</span>:<span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">Private</span>}<p className="mt-1 text-xs text-slate-400">Email: {a.scorecardEmailStatus||"not_sent"}</p></td><td className="px-5 py-4"><div className="flex gap-2"><button disabled={busyId===a._id} onClick={()=>downloadScorecard(a._id)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100" title="Download PDF"><Download size={16}/></button><button disabled={busyId===a._id} onClick={()=>sendScorecard(a._id)} className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700" title="Email and release scorecard"><Mail size={16}/></button></div></td></tr>)}</tbody></table>{!attempts.length&&<p className="p-8 text-center text-slate-500">No completed real tests yet.</p>}</div></section>}
    {editing && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"><div className="my-8 w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-extrabold">{editing==="new"?"Add question":"Edit question"}</h2><p className="text-sm text-slate-500">Questions are used by practice and mixed tests.</p></div><button className="rounded-xl p-2 hover:bg-slate-100" onClick={()=>setEditing(null)}><X size={20}/></button></div><form className="space-y-4" onSubmit={saveQuestion}><div className="grid gap-4 sm:grid-cols-2"><div><label className="label">Category</label><select className="field" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></div><div><label className="label">Difficulty</label><select className="field" value={form.difficulty} onChange={e=>setForm({...form,difficulty:e.target.value})}>{levels.map(l=><option key={l}>{l}</option>)}</select></div></div><div><label className="label">Question text</label><textarea className="field min-h-20" value={form.questionText} onChange={e=>setForm({...form,questionText:e.target.value})} required/></div><div className="grid gap-3 sm:grid-cols-2">{[0,1,2,3].map(i=><div key={i}><label className="label">Option {String.fromCharCode(65+i)}</label><input className="field" value={form.options[i]||""} onChange={e=>setForm({...form,options:form.options.map((o,j)=>j===i?e.target.value:o)})} required={i<2}/></div>)}</div><div><label className="label">Correct answer</label><select className="field" value={form.correctOption} onChange={e=>setForm({...form,correctOption:Number(e.target.value)})}>{form.options.map((o,i)=>o.trim()&&<option key={i} value={i}>{String.fromCharCode(65+i)} — {o}</option>)}</select></div><div><label className="label">Explanation</label><textarea className="field min-h-20" value={form.explanation} onChange={e=>setForm({...form,explanation:e.target.value})} required/></div><div className="flex flex-wrap justify-end gap-2 pt-2"><button type="button" className="btn-quiet" onClick={()=>setEditing(null)}>Cancel</button><button className="btn-primary">{editing==="new"?"Add question":"Save changes"}</button></div></form></div></div>}
  </div>;
}
