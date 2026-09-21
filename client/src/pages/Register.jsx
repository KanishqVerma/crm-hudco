import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(name, email, password, role);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {" "}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm"
      >
        {" "}
        <h1 className="text-2xl font-bold mb-6 text-center">Register</h1>{" "}
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}{" "}
        {success && (
          <p className="text-green-600 text-sm mb-4">
            Account created! Redirecting to login...
          </p>
        )}{" "}
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-3"
          required
        />{" "}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-3"
          required
        />{" "}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-3"
          required
        />{" "}
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4"
        >
          {" "}
          <option value="employee">Employee</option>{" "}
          <option value="admin">Admin</option>{" "}
        </select>{" "}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white rounded py-2 font-semibold hover:bg-blue-700"
        >
          {" "}
          Register{" "}
        </button>{" "}
        <p className="text-sm text-center mt-4">
          {" "}
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600">
            Log In
          </Link>{" "}
        </p>{" "}
      </form>{" "}
    </div>
  );
}
