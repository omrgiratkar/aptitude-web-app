import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Brain, Eye, EyeOff, ShieldCheck, UserRound } from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { Notice } from "../components/UI";

const departments = ["Computer Engineering","Information Technology","Electronics & Telecommunication","Electrical Engineering","Mechanical Engineering","Civil Engineering","Other"];
const genders = ["Female","Male","Non-binary","Prefer not to say"];

export default function AuthPage({ mode }) {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:"", email:"", password:"", gender:"", department:"", inviteCode:"" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isSignup = mode === "signup";
  const isAdmin = mode === "admin";
  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/student"} replace/>;
  const update = e => setForm({ ...form, [e.target.name]: e.target.value });
  async function submit(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : isAdmin ? "/auth/admin-register" : "/auth/register";
      const payload = mode === "login" ? { email: form.email, password: form.password } : isAdmin ? form : { ...form };
      const { data } = await api.post(endpoint, payload);
      signIn(data); navigate(data.user.role === "admin" ? "/admin" : "/student");
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/70 lg:grid-cols-[.85fr_1.15fr]">
    <aside className="hidden flex-col justify-between bg-slate-900 p-9 text-white lg:flex">
      <Link to="/" className="flex items-center gap-3"><div className="rounded-xl bg-blue-600 p-2"><Brain size={23}/></div><span className="text-xl font-extrabold">Aptitude<span className="text-blue-300">Lab</span></span></Link>
      <div><div className="mb-5 inline-flex rounded-2xl bg-white/10 p-4"><ShieldCheck size={30} className="text-blue-300"/></div><h2 className="text-3xl font-extrabold leading-tight">{isAdmin ? "Manage assessments with confidence." : isSignup ? "Your next chapter starts with practice." : "Welcome back to your learning space."}</h2><p className="mt-4 leading-7 text-slate-300">Focused practice, realistic timed tests, and a clear path to better performance.</p></div>
      <p className="text-xs text-slate-400">AptitudeLab · Learn by doing</p>
    </aside>
    <section className="p-6 sm:p-10">
      <Link to="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft size={16}/> Back to home</Link>
      <div className="mb-6"><div className="mb-2 inline-flex rounded-xl bg-blue-50 p-2 text-blue-700">{isAdmin ? <ShieldCheck size={20}/> : <UserRound size={20}/>}</div><h1 className="text-3xl font-extrabold">{mode === "login" ? "Welcome back" : isAdmin ? "Admin registration" : "Create your account"}</h1><p className="mt-2 text-slate-500">{mode === "login" ? "Sign in to continue to your dashboard." : isAdmin ? "Admin signup requires the invitation code configured by the system owner." : "Join AptitudeLab and start practising at your own pace."}</p></div>
      <Notice>{error}</Notice>
      <form className="space-y-4" onSubmit={submit}>
        {(isSignup || isAdmin) && <div><label className="label">Full name</label><input className="field" name="name" value={form.name} onChange={update} placeholder="Enter your name" required autoComplete="name"/></div>}
        <div><label className="label">Email address</label><input className="field" name="email" type="email" value={form.email} onChange={update} placeholder="you@example.com" required autoComplete="email"/></div>
        <div><label className="label">Password</label><div className="relative"><input className="field pr-12" name="password" type={showPassword ? "text" : "password"} minLength={8} value={form.password} onChange={update} placeholder={isSignup || isAdmin ? "At least 8 characters" : "Enter your password"} required autoComplete={mode === "login" ? "current-password" : "new-password"}/><button type="button" className="absolute right-3 top-3 text-slate-400" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">{showPassword ? <EyeOff size={19}/> : <Eye size={19}/>}</button></div></div>
        {isSignup && <><div><label className="label">Gender</label><select className="field" name="gender" value={form.gender} onChange={update} required><option value="">Select gender</option>{genders.map(g=><option key={g}>{g}</option>)}</select></div><div><label className="label">Department / Engineering branch</label><select className="field" name="department" value={form.department} onChange={update} required><option value="">Select department</option>{departments.map(d=><option key={d}>{d}</option>)}</select></div></>}
        {isAdmin && <div><label className="label">Admin invitation code</label><input className="field" name="inviteCode" value={form.inviteCode} onChange={update} required placeholder="Enter invitation code" autoComplete="off"/></div>}
        <button disabled={busy} className="btn-primary w-full !py-3">{busy ? "Please wait…" : mode === "login" ? "Sign in" : isAdmin ? "Create Admin account" : "Create student account"}</button>
      </form>
      <div className="mt-6 space-y-2 text-center text-sm text-slate-500">{mode === "login" ? <p>New to AptitudeLab? <Link className="font-bold text-blue-600" to="/signup">Create student account</Link></p> : !isAdmin ? <p>Already have an account? <Link className="font-bold text-blue-600" to="/login">Sign in</Link></p> : null}{mode !== "login" && !isAdmin && <p><Link className="text-slate-500 underline" to="/admin-signup">Admin registration</Link></p>}{mode === "login" && <p><Link className="text-slate-500 underline" to="/admin-signup">Register as Admin</Link></p>}</div>
    </section>
  </div>;
}
