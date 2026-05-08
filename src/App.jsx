import { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./context/authContext";
import Home from "./pages/Home";
import PostDetail from "./pages/PostDetail";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import "./App.css";

function ProtectedRoute({ children, role, redirectTo = "/login" }) {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to={redirectTo} replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function StartRoute() {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;

  return <Home />;
}

function PublicAuthRoute({ children }) {
  const { user } = useContext(AuthContext);
  if (!user) return children;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<StartRoute />} />
        <Route path="/post/:slug" element={<ProtectedRoute redirectTo="/login"><PostDetail /></ProtectedRoute>} />
        <Route path="/login"     element={<PublicAuthRoute><Login /></PublicAuthRoute>} />
        <Route path="/admin"     element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
