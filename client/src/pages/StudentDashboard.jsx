import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Brain, Calculator, Clock3, History, Sparkles, Target, Trophy } from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { Notice, PageTitle, StatCard } from "../components/UI";

const categories = [
  { name:"Quantitative Aptitude", description:"Numbers, percentages, ratios and speed.", icon:Calculator, tint:"bg-blue-100 text-blue-700" },
  { name:"Reasoning", description:"Sequences, logic, patterns and deductions.", icon:Brain, tint:"bg-violet-100 text-violet-700" },
  { name:"Verbal/English", description:"Grammar, vocabulary and comprehension.", icon:BookOpen, tint:"bg-emerald-100 text-emerald-700" }
];
export default function StudentDashboard() {
  const { user } = useAuth();
  const [practice, setPractice] = useState([]);
  const [tests, setTests] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([api.get("/practice/attempts"), api.get("/tests/history/list")]).then(([p,t]) => { setPractice(p.data.attempts); setTests(t.data.attempts); }).catch(e => setError(e.message));
  }, []);
  return <div>
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><PageTitle eyebrow="Student workspace" title={`Hello, ${user?.name?.split(" ")[0] || "there"} 👋`} description="Choose a practice topic or take a complete timed aptitude test." icon={Sparkles}/><Link to="/test" className="btn-primary inline-flex items-center justify-center gap-2"><Clock3 size={17}/> Take a test</Link></div>
    <Notice>{error}</Notice>
    <div className="grid gap-4 sm:grid-cols-3"><StatCard label="Practice attempts" value={practice.length} hint="Submitted practice quizzes" icon={BookOpen} tint="blue"/><StatCard label="Timed tests" value={tests.length} hint="Submitted test sessions" icon={Target} tint="violet"/><StatCard label="Practice accuracy" value={practice.length ? `${Math.round(practice.reduce((s,a)=>s+(a.total ? a.score/a.total : 0),0)/practice.length*100)}%` : "—"} hint="Average across practice attempts" icon={Trophy} tint="green"/></div>
    <div className="mb-5 mt-10 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Practice zone</p><h2 className="mt-1 text-2xl font-extrabold">Choose your subject</h2></div><span className="text-sm text-slate-500">3 categories</span></div>
    <div className="grid gap-4 md:grid-cols-3">{categories.map(({name,description,icon:Icon,tint})=><div key={name} className="card p-5"><div className={`mb-4 inline-flex rounded-2xl p-3 ${tint}`}><Icon size={22}/></div><h3 className="text-lg font-bold">{name}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{description}</p><Link to="/practice" state={{category:name}} className="mt-5 inline-flex items-center gap-2 font-bold text-blue-600">Choose difficulty <ArrowRight size={16}/></Link></div>)}</div>
    <div className="mt-10 grid gap-6 lg:grid-cols-2">
      <section className="card p-5 sm:p-6"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-extrabold">Recent practice</h2><History size={20} className="text-slate-400"/></div>{practice.length ? <div className="space-y-3">{practice.slice(0,5).map(a=><div key={a._id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div><p className="font-semibold">{a.category}</p><p className="text-xs text-slate-500">{a.difficulty} · {new Date(a.submittedAt).toLocaleDateString()}</p></div><span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">{a.score}/{a.total}</span></div>)}</div> : <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No practice attempts yet. Start with any category above.</p>}</section>
      <section className="card p-5 sm:p-6"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-extrabold">Timed test history</h2><Clock3 size={20} className="text-slate-400"/></div>{tests.length ? <div className="space-y-3">{tests.slice(0,5).map(a=><div key={a._id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div><p className="font-semibold">Mixed aptitude test</p><p className="text-xs text-slate-500">{a.status} · {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : "—"}</p></div><span className="rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-800">Score pending</span></div>)}</div> : <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">Your real-test marks remain private until the Admin releases your scorecard.</p>}</section>
    </div>
  </div>;
}
