import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Clock3, Flag, Send } from "lucide-react";
import api from "../api";
import { Notice, PageTitle } from "../components/UI";

function formatTime(seconds) {
  const s = Math.max(0, seconds || 0);
  return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
}

export default function TimedTest() {
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState([]);
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);

  async function startTest() {
    setBusy(true); setError("");
    try {
      const { data } = await api.post("/tests/start");
      setAttempt(data); setQuestions(data.questions);
      setAnswers(Object.fromEntries(data.answers.map(a=>[a.questionId,a.selectedOption])));
      setRemaining(Math.max(0, Math.ceil((new Date(data.deadlineAt)-Date.now())/1000)));
      setStarted(true);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function saveAnswers(showError = true) {
    if (!attempt?.attemptId || saving.current || done) return false;
    saving.current = true;
    try {
      const payload = questions.map(q=>({ questionId:q._id, selectedOption:Number.isInteger(answers[q._id]) ? answers[q._id] : null }));
      await api.put(`/tests/${attempt.attemptId}/answers`, { answers: payload });
      return true;
    } catch (e) { if (showError) setError(e.message); return false; }
    finally { saving.current = false; }
  }

  async function submitTest(auto = false) {
    if (!attempt?.attemptId || done || busy) return;
    setBusy(true); setError("");
    try {
      await saveAnswers(false);
      const { data } = await api.post(`/tests/${attempt.attemptId}/submit`);
      setDone(true); setStarted(false); setAttempt({...attempt, status:data.status});
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    if (!started || done) return;
    const timer = setInterval(() => {
      const secs = Math.max(0, Math.ceil((new Date(attempt.deadlineAt).getTime()-Date.now())/1000));
      setRemaining(secs);
      if (secs <= 0) submitTest(true);
    }, 1000);
    return () => clearInterval(timer);
  }, [started, done, attempt]);

  useEffect(() => {
    if (!started || done) return;
    const autosave = setInterval(() => { saveAnswers(false); }, 12000);
    return () => clearInterval(autosave);
  }, [started, done, attempt, answers, questions]);

  const current = questions[index];
  const answeredCount = Object.values(answers).filter(v=>Number.isInteger(v)).length;

  if (done) return <div className="mx-auto max-w-2xl"><div className="card p-8 text-center sm:p-12"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><CheckCircle2 size={31}/></div><h1 className="mt-5 text-3xl font-extrabold">Test submitted</h1><p className="mx-auto mt-3 max-w-md leading-7 text-slate-500">Your submission has been recorded. Your real-test score is private and will be shared by the Admin through your scorecard.</p><div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Status: <b>{attempt?.status === "timed_out" ? "Time expired — submitted automatically" : "Submitted successfully"}</b></div><button className="btn-primary mt-6" onClick={()=>navigate("/student")}>Return to dashboard</button></div></div>;

  if (!started) return <div className="mx-auto max-w-3xl"><PageTitle eyebrow="Exam mode" title="Take a complete aptitude test" description="A separate, timed assessment with mixed questions from all three categories." icon={Clock3}/><div className="card overflow-hidden"><div className="bg-slate-900 p-6 text-white sm:p-8"><p className="text-sm font-semibold text-blue-200">Before you begin</p><h2 className="mt-2 text-2xl font-extrabold">Treat it like the real thing.</h2><p className="mt-2 text-slate-300">The timer is enforced by the server. Your score and correct answers will not be shown after submission.</p></div><div className="grid gap-4 p-6 sm:grid-cols-3"><div className="rounded-2xl bg-blue-50 p-4"><Clock3 className="text-blue-700"/><p className="mt-3 text-sm text-slate-500">Duration</p><p className="text-xl font-extrabold text-slate-900">Configured by Admin</p></div><div className="rounded-2xl bg-violet-50 p-4"><Flag className="text-violet-700"/><p className="mt-3 text-sm text-slate-500">Question mix</p><p className="text-xl font-extrabold text-slate-900">3 categories</p></div><div className="rounded-2xl bg-emerald-50 p-4"><ShieldCheckIcon/><p className="mt-3 text-sm text-slate-500">Result privacy</p><p className="text-xl font-extrabold text-slate-900">Admin releases</p></div></div><div className="border-t border-slate-100 p-6"><Notice>{error}</Notice><ul className="mb-5 space-y-2 text-sm text-slate-600"><li>• The test begins as soon as you click Start test.</li><li>• Your answers are automatically saved periodically.</li><li>• You cannot change answers after the deadline or submission.</li><li>• Do not refresh unnecessarily; if you do, your active session is not currently resumed automatically in this starter.</li></ul><button disabled={busy} className="btn-primary flex w-full items-center justify-center gap-2 !py-3 sm:w-auto" onClick={startTest}>{busy ? "Preparing test…" : "Start test"} <ArrowRight size={17}/></button></div></div></div>;

  return <div className="mx-auto max-w-7xl">
    <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Live assessment</p><h1 className="mt-1 text-2xl font-extrabold">Mixed Aptitude Test</h1><p className="mt-1 text-sm text-slate-500">Question {index+1} of {questions.length} · {answeredCount} answered</p></div><div className={`flex items-center gap-3 rounded-2xl border px-5 py-3 ${remaining<300 ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-white text-slate-900"}`}><Clock3 size={21}/><div><p className="text-xs font-bold uppercase tracking-widest opacity-70">Time remaining</p><p className="font-mono text-2xl font-extrabold">{formatTime(remaining)}</p></div></div></div>
    <Notice>{error}</Notice>
    <div className="grid gap-5 lg:grid-cols-[1fr_290px]">
      <section className="card overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">{current?.category}</span><span className="text-sm font-semibold text-slate-400">{current?.difficulty}</span></div><div className="p-5 sm:p-8"><h2 className="text-xl font-extrabold leading-8">{current?.questionText}</h2><div className="mt-6 space-y-3">{current?.options.map((opt,i)=><button key={i} onClick={()=>setAnswers({...answers,[current._id]:i})} className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left ${answers[current._id]===i ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:bg-slate-50"}`}><span className={`grid h-8 w-8 place-items-center rounded-xl text-sm font-bold ${answers[current._id]===i ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>{String.fromCharCode(65+i)}</span><span>{opt}</span></button>)}</div><div className="mt-8 flex flex-wrap justify-between gap-3"><button className="btn-quiet" disabled={index===0} onClick={()=>setIndex(i=>i-1)}>Previous</button><div className="flex gap-2">{index<questions.length-1 && <button className="btn-primary flex items-center gap-2" onClick={()=>setIndex(i=>i+1)}>Save & Next <ArrowRight size={16}/></button>}</div></div></div></section>
      <aside className="card h-fit p-5"><h2 className="font-extrabold">Question palette</h2><div className="mt-1 text-xs text-slate-500">Select a question to navigate</div><div className="mt-4 grid grid-cols-5 gap-2">{questions.map((q,i)=><button key={q._id} onClick={()=>setIndex(i)} className={`relative grid aspect-square place-items-center rounded-xl border text-sm font-bold ${index===i ? "border-blue-600 bg-blue-600 text-white" : Number.isInteger(answers[q._id]) ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600"} ${marked.includes(q._id) ? "ring-2 ring-amber-300" : ""}`}>{i+1}</button>)}</div><div className="mt-4 space-y-2 text-xs text-slate-500"><div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-emerald-100 ring-1 ring-emerald-300"/> Answered</div><div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-white ring-1 ring-slate-300"/> Not answered</div><div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-amber-100 ring-1 ring-amber-300"/> Marked for review</div></div><button onClick={()=>setMarked(m=>m.includes(current?._id)?m.filter(id=>id!==current?._id):[...m,current?._id])} className="btn-quiet mt-5 flex w-full items-center justify-center gap-2"><Flag size={16}/> {marked.includes(current?._id) ? "Unmark for review" : "Mark for review"}</button><button onClick={()=>saveAnswers()} className="btn-secondary mt-2 w-full">Save answers now</button><button onClick={()=>{if(window.confirm(`Submit test now? ${questions.length-answeredCount} question(s) are unanswered.`)) submitTest(false)}} disabled={busy} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 font-bold text-white hover:bg-rose-700"><Send size={16}/>{busy ? "Submitting…" : "Submit test"}</button><p className="mt-3 text-center text-xs text-slate-400">Unanswered questions receive zero marks.</p></aside>
    </div>
  </div>;
}
function ShieldCheckIcon() { return <span className="inline-flex text-emerald-700"><AlertTriangle size={20}/></span>; }
