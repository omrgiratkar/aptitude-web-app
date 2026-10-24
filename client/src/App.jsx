import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Loading, Shell } from "./components/UI";
import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import StudentDashboard from "./pages/StudentDashboard";
import Practice from "./pages/Practice";
import TimedTest from "./pages/TimedTest";
import AdminDashboard from "./pages/AdminDashboard";

function Protected({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <Shell><Loading/></Shell>;
  if (!user) return <Navigate to="/login" replace/>;
  if (role && user.role !== role) return <Navigate to={user.role === "admin" ? "/admin" : "/student"} replace/>;
  return children;
}
export default function App() {
  return <Routes>
    <Route path="/" element={<Shell><Home/></Shell>}/>
    <Route path="/login" element={<Shell><AuthPage mode="login"/></Shell>}/>
    <Route path="/signup" element={<Shell><AuthPage mode="signup"/></Shell>}/>
    <Route path="/admin-signup" element={<Shell><AuthPage mode="admin"/></Shell>}/>
    <Route path="/student" element={<Protected role="student"><Shell><StudentDashboard/></Shell></Protected>}/>
    <Route path="/practice" element={<Protected role="student"><Shell><Practice/></Shell></Protected>}/>
    <Route path="/test" element={<Protected role="student"><Shell><TimedTest/></Shell></Protected>}/>
    <Route path="/admin" element={<Protected role="admin"><Shell><AdminDashboard/></Shell></Protected>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>;
}
