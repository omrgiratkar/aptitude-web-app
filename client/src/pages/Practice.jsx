import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, RotateCcw } from "lucide-react";
import api from "../api";
import { Notice, PageTitle } from "../components/UI";

const cats = ["Quantitative Aptitude","Reasoning","Verbal/English"];
const levels = ["Easy","Medium","Hard"];

export default function Practice() {
  const location = useLocation();
  const navigate = useNavigate();
  const [category, setCategory] = useState(location.state?.category || cats[0]);
  const [difficulty, setDifficulty] = useState("Easy");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadQuestions() {
    setError(""); setLoading(true); setResult(null); setAnswers({}); setIndex(0);
    try {
      const { data } = await api.get("/practice/questions", { params: { category, difficulty } });
      setQuestions(data.questions);
      if (!data.questions.length) setError("No questions are available for this category and difficulty yet. Ask the Admin to add questions.");
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadQuestions(); }, [category, difficulty]);
  const current = questions[index];
  async function submit() {
    setError("");
    try {
      const payload = questions.map(q => ({ questionId: q._id, selectedOption: Number.isInteger(answers[q._id]) ? answers[q._id] : null }));
      const { data } = await api.post("/practice/submit", { category, difficulty, answers: payload });
      setResult(data);
    } catch (e) { setError(e.message); }
  }
  return <div className="mx-auto max-w-4xl">
    <Link to="/student" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft size={16}/> Student dashboard</Link>
    <PageTitle eyebrow="Practice mode" title="Build your accuracy" description="Choose a category and difficulty. After submission, review every answer and explanation." icon={CircleHelp}/>
    <div className="card mb-6 grid gap-5 p-5 sm:grid-cols-2">
      <div><label className="label">Category</label><select className="field" value={category} onChange={e=>setCategory(e.target.value)}>{cats.map(c=><option key={c}>{c}</option>)}</select></div>
      <div><label className="label">Difficulty</label><div className="grid grid-cols-3 gap-2">{levels.map(l=><button key={l} onClick={()=>setDifficulty(l)} className={`rounded-xl border px-2 py-3 text-sm font-bold ${difficulty===l ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>{l}</button>)}</div></div>
    </div>
    <Notice>{error}</Notice>
    {loading ? <div className="card p-10 text-center text-slate-500">Loading questions…</div> : result ? <div className="space-y-5">
      <div className="card bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white sm:p-8"><p className="text-sm font-semibold text-blue-100">Practice completed</p><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><div className="text-5xl font-black">{result.score}<span className="text-2xl text-blue-200">/{result.total}</span></div><p className="mt-2 text-blue-100">{result.correctCount} correct · {result.total-result.correctCount} incorrect or unanswered</p></div><div className="rounded-2xl bg-white/15 px-4 py-3 text-2xl font-extrabold">{result.total ? Math.round(result.score/result.total*100) : 0}%</div></div></div>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-extrabold">Answer review</h2><button className="btn-secondary flex items-center gap-2" onClick={loadQuestions}><RotateCcw size={16}/> Try again</button></div>
      {result.review.map((r,i)=><div key={r.questionId} className="card p-5"><div className="flex items-start gap-3"><div className={`mt-0.5 rounded-lg p-2 ${r.isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{r.isCorrect ? <CheckCircle2 size={18}/> : <CircleHelp size={18}/>}</div><div className="flex-1"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Question {i+1} · {r.isCorrect ? "Correct" : "Review this answer"}</p><h3 className="mt-1 font-bold leading-6">{r.questionText}</h3><div className="mt-3 space-y-2">{r.options.map((opt,j)=><div key={j} className={`rounded-xl border px-3 py-2.5 text-sm ${j===r.correctOption ? "border-emerald-300 bg-emerald-50 font-semibold text-emerald-800" : j===r.selectedOption ? "border-rose-300 bg-rose-50 text-rose-800" : "border-slate-100 text-slate-600"}`}>{String.fromCharCode(65+j)}. {opt} {j===r.correctOption ? "✓ Correct answer" : j===r.selectedOption ? "· Your answer" : ""}</div>)}</div><div className="mt-4 rounded-xl bg-blue-50 p-4"><p className="text-xs font-extrabold uppercase tracking-wider text-blue-700">Explanation</p><p className="mt-1 text-sm leading-6 text-slate-700">{r.explanation}</p></div></div></div></div>)}
    </div> : current ? <div className="card overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><span className="text-sm font-bold text-slate-500">{category} · {difficulty}</span><span className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700">Question {index+1} of {questions.length}</span></div><div className="h-1.5 bg-slate-100"><div className="h-full bg-blue-600 transition-all" style={{width:`${((index+1)/questions.length)*100}%`}}/></div><div className="p-5 sm:p-8"><h2 className="text-xl font-extrabold leading-8 sm:text-2xl">{current.questionText}</h2><div className="mt-6 space-y-3">{current.options.map((option,i)=><button key={i} onClick={()=>setAnswers({...answers,[current._id]:i})} className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${answers[current._id]===i ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-bold ${answers[current._id]===i ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>{String.fromCharCode(65+i)}</span><span className="font-medium">{option}</span></button>)}</div><div className="mt-8 flex flex-wrap items-center justify-between gap-3"><button className="btn-quiet" disabled={index===0} onClick={()=>setIndex(i=>i-1)}>Previous</button>{index < questions.length-1 ? <button className="btn-primary flex items-center gap-2" onClick={()=>setIndex(i=>i+1)}>Next question <ArrowRight size={16}/></button> : <button className="btn-primary" onClick={submit}>Submit practice quiz</button>}</div><p className="mt-4 text-xs text-slate-400">{Object.keys(answers).length} of {questions.length} answered. Unanswered questions score zero.</p></div></div> : <div className="card p-10 text-center"><p className="text-slate-500">No questions to display.</p><button className="btn-primary mt-4" onClick={loadQuestions}>Reload questions</button></div>}
  </div>;
}
