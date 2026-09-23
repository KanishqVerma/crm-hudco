import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(name, email, password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      {" "}
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        {" "}
        <p className="text-sm text-ink/50 mb-1">Internal workspace</p>{" "}
        <h1 className="text-2xl font-bold text-ink mb-8">Create an account</h1>{" "}
        {error && <p className="text-brick text-sm mb-4">{error}</p>}{" "}
        {success && (
          <p className="text-moss text-sm mb-4">
            Account created. Redirecting to login.
          </p>
        )}{" "}
        <label className="block text-sm font-medium text-ink/70 mb-1">
          Full name
        </label>{" "}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-line rounded px-3 py-2 mb-4 bg-white focus:outline-none focus:ring-2 focus:ring-steel"
          required
        />{" "}
        <label className="block text-sm font-medium text-ink/70 mb-1">
          Email
        </label>{" "}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-line rounded px-3 py-2 mb-4 bg-white focus:outline-none focus:ring-2 focus:ring-steel"
          required
        />{" "}
        <label className="block text-sm font-medium text-ink/70 mb-1">
          Password
        </label>{" "}
        <div className="relative mb-6">
          {" "}
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-line rounded px-3 py-2 pr-16 bg-white focus:outline-none focus:ring-2 focus:ring-steel"
            required
          />{" "}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-steel font-medium"
          >
            {" "}
            {showPassword ? "Hide" : "Show"}{" "}
          </button>{" "}
        </div>{" "}
        <button
          type="submit"
          className="w-full bg-steel text-white rounded py-2.5 font-semibold hover:bg-steel-dark transition-colors"
        >
          {" "}
          Register{" "}
        </button>{" "}
        <p className="text-sm text-ink/60 text-center mt-6">
          {" "}
          Already have an account?{" "}
          <Link to="/login" className="text-steel font-medium">
            Log in
          </Link>{" "}
        </p>{" "}
      </form>{" "}
    </div>
  );
}
