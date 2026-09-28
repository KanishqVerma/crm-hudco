import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const formatDate = (d) =>
  new Date(d).toLocaleDateString(undefined, { timeZone: 'UTC' });

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [assigneeIds, setAssigneeIds] = useState([]);
  const [subtaskInputs, setSubtaskInputs] = useState([{ title: '', assignedTo: '' }]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get(isAdmin ? '/tasks' : '/tasks/mine');
      setTasks(res.data);
    } catch (err) {
      setError('Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    if (isAdmin) {
      api.get('/users').then((res) => setUsers(res.data));
    }
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/tasks', {
        title,
        description,
        deadline: deadline || null,
        assigneeIds,
        subtasks: subtaskInputs
          .filter((s) => s.title.trim() !== '')
          .map((s) => ({ title: s.title, assignedTo: s.assignedTo || null })),
      });
      setTitle('');
      setDescription('');
      setDeadline('');
      setAssigneeIds([]);
      setSubtaskInputs([{ title: '', assignedTo: '' }]);
      setShowForm(false);
      loadTasks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task. Please try again.');
    }
  };

  const toggleSubtask = async (taskId, subtaskId, currentStatus) => {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done';

    // Update the screen immediately, then sync with the server
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map((sub) =>
                sub.id === subtaskId ? { ...sub, status: newStatus } : sub
              ),
            }
          : task
      )
    );

    try {
      await api.patch(`/tasks/subtask/${subtaskId}`, { status: newStatus });
    } catch (err) {
      loadTasks();
    }
  };

  const toggleTaskStatus = async (task) => {
    const newStatus = task.status === 'done' ? 'pending' : 'done';

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );

    try {
      await api.patch(`/tasks/${task.id}/status`, { status: newStatus });
    } catch (err) {
      loadTasks();
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    setError('');
    try {
      await api.delete(`/tasks/${taskId}`);
      loadTasks();
    } catch (err) {
      setError('Failed to delete task. Please try again.');
    }
  };

  const toggleAssignee = (userId) => {
    setAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const updateSubtaskTitle = (index, value) => {
    const updated = [...subtaskInputs];
    updated[index] = { ...updated[index], title: value };
    setSubtaskInputs(updated);
  };

  const updateSubtaskAssignee = (index, value) => {
    const updated = [...subtaskInputs];
    updated[index] = { ...updated[index], assignedTo: value ? parseInt(value) : null };
    setSubtaskInputs(updated);
  };

  const addSubtaskInput = () => {
    setSubtaskInputs([...subtaskInputs, { title: '', assignedTo: '' }]);
  };

  const removeSubtaskInput = (index) => {
    setSubtaskInputs(subtaskInputs.filter((_, i) => i !== index));
  };

  const employees = users.filter((u) => u.role !== 'admin');
  const visibleTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-ink">
          {isAdmin ? 'All Tasks' : 'My Tasks'}
        </h1>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-steel text-white px-4 py-2 rounded hover:bg-steel-dark"
          >
            {showForm ? 'Cancel' : '+ New Task'}
          </button>
        )}
      </div>

      {error && (
        <p className="text-brick text-sm mb-4 bg-brick/10 border border-brick/30 rounded px-3 py-2">
          {error}
        </p>
      )}

      {showForm && (
        <form onSubmit={handleCreateTask} className="bg-white p-4 md:p-6 rounded-lg shadow mb-6">
          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-line rounded px-3 py-2 mb-3"
            required
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-line rounded px-3 py-2 mb-3"
          />
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full border border-line rounded px-3 py-2 mb-3"
          />

          <p className="text-sm font-semibold mb-2">Subtasks:</p>
          <div className="mb-4">
            {subtaskInputs.map((sub, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-2 mb-3 sm:mb-2">
                <input
                  type="text"
                  placeholder={`Subtask ${i + 1}`}
                  value={sub.title}
                  onChange={(e) => updateSubtaskTitle(i, e.target.value)}
                  className="w-full sm:flex-1 border border-line rounded px-3 py-2 sm:py-1"
                />
                <div className="flex gap-2 items-center">
                  <select
                    value={sub.assignedTo || ''}
                    onChange={(e) => updateSubtaskAssignee(i, e.target.value)}
                    className="flex-1 sm:flex-none border border-line rounded px-2 py-2 sm:py-1"
                  >
                    <option value="">Unassigned</option>
                    {employees.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  {subtaskInputs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSubtaskInput(i)}
                      className="text-brick text-sm px-1"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button type="button" onClick={addSubtaskInput} className="text-steel text-sm">
              + Add another subtask
            </button>
          </div>

          <p className="text-sm font-semibold mb-2">Assign to:</p>
          <div className="mb-4">
            {employees.map((u) => (
              <label key={u.id} className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={assigneeIds.includes(u.id)}
                  onChange={() => toggleAssignee(u.id)}
                  className="h-4 w-4"
                />
                {u.name} ({u.role})
              </label>
            ))}
          </div>

          <button
            type="submit"
            className="bg-moss text-white px-4 py-2 rounded hover:opacity-90"
          >
            Create Task
          </button>
        </form>
      )}

      <input
        type="text"
        placeholder="Search tasks..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full border border-line rounded px-3 py-2 mb-4 bg-white focus:outline-none focus:ring-2 focus:ring-steel"
      />

      <div className="space-y-4">
        {loading && tasks.length === 0 && <p className="text-ink/40">Loading tasks...</p>}
        {!loading && tasks.length === 0 && <p className="text-ink/40">No tasks yet.</p>}
        {!loading && tasks.length > 0 && visibleTasks.length === 0 && (
          <p className="text-ink/40">No tasks match your search.</p>
        )}

        {visibleTasks.map((task) => (
          <div key={task.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-3">
              <div className="flex items-start gap-2 min-w-0">
                {(isAdmin || task.assignees?.some((a) => a.user.id === user.id)) && (
                  <input
                    type="checkbox"
                    checked={task.status === 'done'}
                    onChange={() => toggleTaskStatus(task)}
                    className="mt-1.5 h-4 w-4 accent-moss shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <h3
                    className={`font-semibold text-lg break-words ${
                      task.status === 'done' ? 'line-through text-gray-400' : ''
                    }`}
                  >
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-gray-600 text-sm break-words">{task.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 pl-6 sm:pl-0">
                {task.deadline && (
                  <span className="text-sm text-gray-500">Due: {formatDate(task.deadline)}</span>
                )}
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-xs text-brick hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            {task.assignees && (
              <p className="text-xs text-gray-400 mt-1">
                Assigned to: {task.assignees.map((a) => a.user.name).join(', ')}
              </p>
            )}

            {task.subtasks && task.subtasks.length > 0 && (
              <div className="mt-3 space-y-2">
                {task.subtasks.map((sub) => (
                  <label key={sub.id} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={sub.status === 'done'}
                      onChange={() => toggleSubtask(task.id, sub.id, sub.status)}
                      disabled={isAdmin && sub.assignedTo !== user.id}
                      className="mt-0.5 h-4 w-4 shrink-0"
                    />
                    <span
                      className={`break-words ${
                        sub.status === 'done' ? 'line-through text-gray-400' : ''
                      }`}
                    >
                      {sub.title}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}