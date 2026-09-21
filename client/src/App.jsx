import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Tasks from "./pages/Tasks";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Layout from "./components/Layout";
import CalendarPage from "./pages/Calendar";
import Todos from "./pages/Todos";
import Chat from "./pages/Chat";
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return;
  <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
}
function AppRoutes() {
  return (
    <Routes>
      {" "}
      <Route path="/login" element={<Login />} />{" "}
      <Route path="/register" element={<Register />} />{" "}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {" "}
            <Dashboard />{" "}
          </ProtectedRoute>
        }
      />{" "}
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            {" "}
            <Tasks />{" "}
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" />} />{" "}
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />{" "}
      <Route
        path="/todos"
        element={
          <ProtectedRoute>
            <Todos />
          </ProtectedRoute>
        }
      />{" "}
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      {" "}
      <AuthProvider>
        {" "}
        <AppRoutes />{" "}
      </AuthProvider>{" "}
    </BrowserRouter>
  );
}
