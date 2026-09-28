import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Admin() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('employee');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const toggleRole = async (u) => {
    const newRoleValue = u.role === 'admin' ? 'employee' : 'admin';
    if (!confirm(`Change ${u.name}'s role to ${newRoleValue}?`)) return;

    setError('');
    try {
      await api.patch(`/users/${u.id}/role`, { role: newRoleValue });
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update role.');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/register', {
        name: newName.trim(),
        email: newEmail.trim(),
        password: newPassword,
        role: newRole,
      });
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('employee');
      setShowCreateForm(false);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-10">
      <h1 className="text-xl md:text-2xl font-bold text-ink mb-2">Manage users</h1>
      <p className="text-ink/50 text-sm mb-6 md:mb-8">
        Create accounts, promote employees to admin, or demote admins back to employee.
      </p>

      <button
        onClick={() => setShowCreateForm(!showCreateForm)}
        className="bg-steel text-white px-4 py-2 rounded font-medium hover:bg-steel-dark mb-6"
      >
        {showCreateForm ? 'Cancel' : '+ Create new user'}
      </button>

      {error && (
        <p className="text-brick text-sm mb-4 bg-brick/10 border border-brick/30 rounded px-3 py-2">
          {error}
        </p>
      )}

      {showCreateForm && (
        <form
          onSubmit={handleCreateUser}
          className="bg-white p-4 md:p-6 rounded-lg shadow mb-8 space-y-3"
        >
          <input
            type="text"
            placeholder="Full name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full border border-line rounded px-3 py-2"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full border border-line rounded px-3 py-2"
            required
          />
          <input
            type="password"
            placeholder="Temporary password (min 6 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border border-line rounded px-3 py-2"
            required
            minLength={6}
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="w-full border border-line rounded px-3 py-2"
          >
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
          <p className="text-xs text-ink/40">
            Share this password with the new user directly. They can use it to log in.
          </p>
          <button
            type="submit"
            className="bg-moss text-white px-4 py-2 rounded font-medium hover:opacity-90"
          >
            Create account
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-ink/40">Loading users...</p>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white p-3 rounded border border-line"
            >
              <div className="min-w-0">
                <p className="text-ink font-medium break-words">{u.name}</p>
                <p className="text-ink/40 text-xs break-all">{u.email}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded capitalize ${
                    u.role === 'admin' ? 'bg-ochre/20 text-ochre' : 'bg-steel/10 text-steel'
                  }`}
                >
                  {u.role}
                </span>
                {u.id !== currentUser.id ? (
                  <button
                    onClick={() => toggleRole(u)}
                    className="text-xs text-steel hover:underline font-medium"
                  >
                    {u.role === 'admin' ? 'Demote to employee' : 'Promote to admin'}
                  </button>
                ) : (
                  <span className="text-xs text-ink/30 italic">You</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}