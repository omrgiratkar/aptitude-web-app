import { createContext, useContext, useEffect, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("aptitude_user") || "null"); } catch { return null; }
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("aptitude_token")));
  useEffect(() => {
    if (!localStorage.getItem("aptitude_token")) { setLoading(false); return; }
    api.get("/auth/me").then(r => {
      setUser(r.data.user); localStorage.setItem("aptitude_user", JSON.stringify(r.data.user));
    }).catch(() => {
      localStorage.removeItem("aptitude_token"); localStorage.removeItem("aptitude_user"); setUser(null);
    }).finally(() => setLoading(false));
  }, []);
  const signIn = data => {
    localStorage.setItem("aptitude_token", data.token);
    localStorage.setItem("aptitude_user", JSON.stringify(data.user));
    setUser(data.user);
  };
  const signOut = () => {
    localStorage.removeItem("aptitude_token"); localStorage.removeItem("aptitude_user"); setUser(null);
  };
  return <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
