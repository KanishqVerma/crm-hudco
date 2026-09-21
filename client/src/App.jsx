import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Tasks from './pages/Tasks';
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
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
      <Route path="/tasks" element={ <ProtectedRoute> <Tasks /> </ProtectedRoute> } />
      <Route path="*" element={<Navigate to="/login" />} />{" "}
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
