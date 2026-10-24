import { Link, Navigate } from "react-router-dom";
import { ArrowRight, BookOpenCheck, Brain, CheckCircle2, Clock3, GraduationCap, ShieldCheck, Sparkles, Target, Trophy } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { PageTitle } from "../components/UI";

export default function Home() {
  const { user } = useAuth();
  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/student"} replace/>;
  const features = [
    { icon: Brain, title: "Practice your way", text: "Pick Quantitative Aptitude, Reasoning, or Verbal/English and choose your difficulty." },
    { icon: Clock3, title: "Exam-style test", text: "A dedicated timed assessment with a countdown, question palette, and auto-submit." },
    { icon: ShieldCheck, title: "Private real-test scores", text: "Official test marks stay private until an Admin releases the scorecard." }
  ];
  return <div>
    <section className="grid items-center gap-10 py-8 lg:grid-cols-[1.08fr_.92fr] lg:py-14">
      <div>
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-sm font-semibold text-blue-700 shadow-sm"><Sparkles size={15}/> Your next breakthrough starts here</div>
        <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-6xl">Practice smarter.<br/><span className="text-blue-600">Perform stronger.</span></h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">Build confidence with focused aptitude practice, then challenge yourself in a realistic timed test experience.</p>
        <div className="mt-8 flex flex-wrap gap-3"><Link to="/signup" className="btn-primary flex items-center gap-2">Create student account <ArrowRight size={17}/></Link><Link to="/login" className="btn-quiet">Sign in</Link></div>
        <div className="mt-8 flex flex-wrap gap-5 text-sm text-slate-500"><span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-600"/> Three practice categories</span><span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-600"/> Easy to Hard</span></div>
      </div>
      <div className="relative">
        <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-blue-200/70 via-violet-100/70 to-cyan-100/70 blur-xl"/>
        <div className="card relative overflow-hidden p-6 sm:p-8">
          <div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-slate-500">Your learning dashboard</p><h2 className="mt-1 text-2xl font-extrabold">Ready when you are.</h2></div><div className="rounded-2xl bg-blue-600 p-3 text-white"><GraduationCap size={25}/></div></div>
          <div className="mt-7 space-y-3">
            {[["Quantitative Aptitude","Numbers, percentages, speed", "bg-blue-100 text-blue-700"],["Reasoning","Patterns and logical thinking","bg-violet-100 text-violet-700"],["Verbal / English","Grammar and vocabulary","bg-emerald-100 text-emerald-700"]].map(([name, desc, tint])=><div key={name} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4"><div className={`rounded-xl p-3 ${tint}`}><BookOpenCheck size={21}/></div><div className="flex-1"><div className="font-bold text-slate-800">{name}</div><div className="text-sm text-slate-500">{desc}</div></div><ArrowRight size={17} className="text-slate-400"/></div>)}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-slate-900 p-4 text-white"><Clock3 size={19} className="text-blue-300"/><p className="mt-3 text-sm text-slate-300">Timed assessment</p><p className="text-xl font-bold">Exam mode</p></div><div className="rounded-2xl bg-blue-50 p-4 text-blue-950"><Trophy size={19} className="text-blue-600"/><p className="mt-3 text-sm text-blue-700">Learn from mistakes</p><p className="text-xl font-bold">Review answers</p></div></div>
        </div>
      </div>
    </section>
    <section className="py-10"><div className="mb-6"><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">Made for progress</p><h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">Everything you need to prepare</h2></div><div className="grid gap-4 md:grid-cols-3">{features.map(({icon:Icon,title,text},i)=><div className="card p-6" key={title}><div className={`mb-5 inline-flex rounded-2xl p-3 ${["bg-blue-100 text-blue-700","bg-violet-100 text-violet-700","bg-emerald-100 text-emerald-700"][i]}`}><Icon size={22}/></div><h3 className="text-lg font-bold">{title}</h3><p className="mt-2 leading-6 text-slate-500">{text}</p></div>)}</div></section>
    <section className="mt-6 rounded-3xl bg-slate-900 p-7 text-white sm:p-10"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center"><div><p className="text-sm font-bold uppercase tracking-widest text-blue-300">Start today</p><h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">A little practice goes a long way.</h2><p className="mt-2 text-slate-300">Create your student account and take your first quiz.</p></div><Link to="/signup" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-slate-900">Get started <ArrowRight size={17}/></Link></div></section>
  </div>;
}
