import { Link } from "react-router-dom";
import { BookOpen, Brain, Calculator, Clock3, GraduationCap, LogOut, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Brand({ small = false }) {
  return <Link to="/" className="flex items-center gap-3">
    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200"><Brain size={23}/></div>
    <div><div className={`font-extrabold tracking-tight text-slate-900 ${small ? "text-lg" : "text-xl"}`}>Aptitude<span className="text-blue-600">Lab</span></div><div className="text-xs text-slate-500">Practice. Progress. Perform.</div></div>
  </Link>;
}
export function Shell({ children }) {
  const { user, signOut } = useAuth();
  return <div className="min-h-screen page-bg">
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Brand small/>
        <nav className="flex items-center gap-2">
          {user && <span className="hidden text-sm text-slate-500 sm:inline">Hi, <b className="text-slate-800">{user.name}</b></span>}
          {user && <Link className="btn-quiet flex items-center gap-2 !px-3 !py-2 text-sm" to={user.role === "admin" ? "/admin" : "/student"}><GraduationCap size={16}/><span className="hidden sm:inline">Dashboard</span></Link>}
          {user && <button onClick={signOut} className="btn-quiet flex items-center gap-2 !px-3 !py-2 text-sm"><LogOut size={16}/><span className="hidden sm:inline">Sign out</span></button>}
          {!user && <Link to="/login" className="btn-primary !px-4 !py-2 text-sm">Sign in</Link>}
        </nav>
      </div>
    </header>
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    <footer className="mx-auto max-w-7xl px-4 pb-7 text-center text-xs text-slate-400">AptitudeLab · A responsive aptitude practice and assessment platform</footer>
  </div>;
}
export function PageTitle({ eyebrow, title, description, icon: Icon = Sparkles }) {
  return <div className="mb-7 flex items-start gap-4">
    <div className="hidden rounded-2xl bg-blue-100 p-3 text-blue-700 sm:block"><Icon size={25}/></div>
    <div><div className="mb-1 text-xs font-bold uppercase tracking-[.18em] text-blue-600">{eyebrow}</div><h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-slate-500">{description}</p>}</div>
  </div>;
}
export function StatCard({ label, value, hint, icon: Icon = BookOpen, tint = "blue" }) {
  const tints = { blue:"bg-blue-100 text-blue-700", violet:"bg-violet-100 text-violet-700", amber:"bg-amber-100 text-amber-700", green:"bg-emerald-100 text-emerald-700" };
  return <div className="card p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-extrabold text-slate-900">{value}</p></div><div className={`rounded-xl p-3 ${tints[tint] || tints.blue}`}><Icon size={21}/></div></div>{hint && <p className="mt-3 text-xs text-slate-400">{hint}</p>}</div>;
}
export function Notice({ type = "error", children }) {
  if (!children) return null;
  return <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-700"}`}>{children}</div>;
}
export function CategoryIcon({ category }) {
  if (category === "Quantitative Aptitude") return <Calculator size={21}/>;
  if (category === "Reasoning") return <Brain size={21}/>;
  if (category === "Verbal/English") return <BookOpen size={21}/>;
  return <Clock3 size={21}/>;
}
export function Loading() { return <div className="py-20 text-center text-slate-500">Loading your workspace…</div>; }
