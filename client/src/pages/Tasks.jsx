import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [assigneeIds, setAssigneeIds] = useState([]);
  const [subtaskInputs, setSubtaskInputs] = useState([
    { title: "", assignedTo: "" },
  ]);
  const isAdmin = user?.role === "admin";
  const loadTasks = async () => {
    const endpoint = isAdmin ? "/tasks" : "/tasks/mine";
    const res = await api.get(endpoint);
    setTasks(res.data);
  };
  useEffect(() => {
    loadTasks();
    if (isAdmin) {
      api.get("/users").then((res) => setUsers(res.data));
    }
  }, []);
  const handleCreateTask = async (e) => {
    e.preventDefault();
    await api.post("/tasks", {
      title,
      description,
      deadline: deadline || null,
      assigneeIds,
      subtasks: subtaskInputs
        .filter((s) => s.title.trim() !== "")
        .map((s) => ({ title: s.title, assignedTo: s.assignedTo || null })),
    });
    setTitle("");
    setDescription("");
    setDeadline("");
    setAssigneeIds([]);
    setSubtaskInputs([{ title: "", assignedTo: "" }]);
    setShowForm(false);
    loadTasks();
  };
  const toggleSubtask = async (taskId, subtaskId, currentStatus) => {
    const newStatus = currentStatus === "done" ? "pending" : "done";
    // Update the screen immediately, before waiting for the server
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map((sub) =>
                sub.id === subtaskId ? { ...sub, status: newStatus } : sub,
              ),
            }
          : task,
      ),
    );
    // Then sync with the server in the background
    try {
      await api.patch(`/tasks/subtask/${subtaskId}`, { status: newStatus });
    } catch (err) {
      // If it fails, reload for real to undo the optimistic change
      loadTasks();
    }
  };
  const handleDeleteTask = async (taskId) => {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    await api.delete(`/tasks/${taskId}`);
    loadTasks();
  };
  const toggleAssignee = (userId) => {
    setAssigneeIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };
  const updateSubtaskTitle = (index, value) => {
    const updated = [...subtaskInputs];
    updated[index] = { ...updated[index], title: value };
    setSubtaskInputs(updated);
  };
  const updateSubtaskAssignee = (index, value) => {
    const updated = [...subtaskInputs];
    updated[index] = {
      ...updated[index],
      assignedTo: value ? parseInt(value) : null,
    };
    setSubtaskInputs(updated);
  };
  const addSubtaskInput = () => {
    setSubtaskInputs([...subtaskInputs, { title: "", assignedTo: "" }]);
  };
  const removeSubtaskInput = (index) => {
    setSubtaskInputs(subtaskInputs.filter((_, i) => i !== index));
  };
  return (
    <div className="max-w-3xl mx-auto p-8">
      {" "}
      <div className="flex justify-between items-center mb-6">
        {" "}
        <h1 className="text-2xl font-bold">
          {isAdmin ? "All Tasks" : "My Tasks"}
        </h1>{" "}
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-steel text-white px-4 py-2 rounded hover:bg-steel-dark"
          >
            {" "}
            {showForm ? "Cancel" : "+ New Task"}{" "}
          </button>
        )}{" "}
      </div>{" "}
      {showForm && (
        <form
          onSubmit={handleCreateTask}
          className="bg-white p-6 rounded-lg shadow mb-6"
        >
          {" "}
          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3"
            required
          />{" "}
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3"
          />{" "}
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3"
          />{" "}
          <p className="text-sm font-semibold mb-2">Subtasks:</p>{" "}
          <div className="mb-4">
            {" "}
            {subtaskInputs.map((sub, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder={`Subtask ${i + 1}`}
                  value={sub.title}
                  onChange={(e) => updateSubtaskTitle(i, e.target.value)}
                  className="flex-1 border rounded px-3 py-1"
                />
                <select
                  value={sub.assignedTo || ""}
                  onChange={(e) => updateSubtaskAssignee(i, e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                {subtaskInputs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSubtaskInput(i)}
                    className="text-brick text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}{" "}
            <button
              type="button"
              onClick={addSubtaskInput}
              className="text-steel text-sm"
            >
              {" "}
              + Add another subtask{" "}
            </button>{" "}
          </div>
          <p className="text-sm font-semibold mb-2">Assign to:</p>{" "}
          <div className="mb-4">
            {" "}
            {users.map((u) => (
              <label key={u.id} className="flex items-center gap-2 mb-1">
                {" "}
                <input
                  type="checkbox"
                  checked={assigneeIds.includes(u.id)}
                  onChange={() => toggleAssignee(u.id)}
                />{" "}
                {u.name} ({u.role}){" "}
              </label>
            ))}{" "}
          </div>{" "}
          <button
            type="submit"
            className="bg-moss text-white px-4 py-2 rounded hover:bg-moss"
          >
            {" "}
            Create Task{" "}
          </button>{" "}
        </form>
      )}{" "}
      <div className="space-y-4">
        {" "}
        {tasks.length === 0 && (
          <p className="text-gray-400">No tasks yet.</p>
        )}{" "}
        {tasks.map((task) => (
          <div key={task.id} className="bg-white p-4 rounded-lg shadow">
            {" "}
            <div className="flex justify-between items-start">
              {" "}
              <div>
                {" "}
                <h3 className="font-semibold text-lg">{task.title}</h3>{" "}
                {task.description && (
                  <p className="text-gray-600 text-sm">{task.description}</p>
                )}{" "}
              </div>{" "}
              {task.deadline && (
                <span className="text-sm text-gray-500">
                  Due: {new Date(task.deadline).toLocaleDateString()}
                </span>
              )}
              {isAdmin && (
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-xs text-brick hover:underline ml-3"
                >
                  Delete
                </button>
              )}{" "}
            </div>{" "}
            {task.assignees && (
              <p className="text-xs text-gray-400 mt-1">
                {" "}
                Assigned to:{" "}
                {task.assignees.map((a) => a.user.name).join(", ")}{" "}
              </p>
            )}{" "}
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="mt-3 space-y-1">
                {" "}
                {task.subtasks.map((sub) => (
                  <label
                    key={sub.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    {" "}
                    <input
                      type="checkbox"
                      checked={sub.status === "done"}
                      onChange={() =>
                        toggleSubtask(task.id, sub.id, sub.status)
                      }
                      disabled={isAdmin && sub.assignedTo !== user.id}
                    />{" "}
                    <span
                      className={
                        sub.status === "done"
                          ? "line-through text-gray-400"
                          : ""
                      }
                    >
                      {" "}
                      {sub.title}{" "}
                    </span>{" "}
                  </label>
                ))}{" "}
              </div>
            )}{" "}
          </div>
        ))}{" "}
      </div>{" "}
    </div>
  );
}

