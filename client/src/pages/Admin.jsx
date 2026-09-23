import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
export default function Admin() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err) {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadUsers();
  }, []);
  const toggleRole = async (user) => {
    const newRole = user.role === "admin" ? "employee" : "admin";
    if (!confirm(`Change ${user.name}'s role to ${newRole}?`)) return;
    setError("");
    try {
      await api.patch(`/users/${user.id}/role`, { role: newRole });
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update role.");
    }
  };
  return (
    <div className="max-w-2xl mx-auto p-10">
      {" "}
      <h1 className="text-2xl font-bold text-ink mb-2">Manage users</h1>{" "}
      <p className="text-ink/50 text-sm mb-8">
        Promote employees to admin, or demote admins back to employee.
      </p>{" "}
      {error && (
        <p className="text-brick text-sm mb-4 bg-brick/10 border border-brick/30 rounded px-3 py-2">
          {" "}
          {error}{" "}
        </p>
      )}{" "}
      {loading ? (
        <p className="text-ink/40">Loading users...</p>
      ) : (
        <div className="space-y-2">
          {" "}
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between bg-white p-3 rounded border border-line"
            >
              {" "}
              <div>
                {" "}
                <p className="text-ink font-medium">{u.name}</p>{" "}
                <p className="text-ink/40 text-xs">{u.email}</p>{" "}
              </div>{" "}
              <div className="flex items-center gap-3">
                {" "}
                <span
                  className={`text-xs font-medium px-2 py-1 rounded capitalize ${u.role === "admin" ? "bg-ochre/20 text-ochre" : "bg-steel/10 text-steel"}`}
                >
                  {" "}
                  {u.role}{" "}
                </span>{" "}
                {u.id !== currentUser.id ? (
                  <button
                    onClick={() => toggleRole(u)}
                    className="text-xs text-steel hover:underline font-medium"
                  >
                    {" "}
                    {u.role === "admin"
                      ? "Demote to employee"
                      : "Promote to admin"}{" "}
                  </button>
                ) : (
                  <span className="text-xs text-ink/30 italic">You</span>
                )}{" "}
              </div>{" "}
            </div>
          ))}{" "}
        </div>
      )}{" "}
    </div>
  );
}
