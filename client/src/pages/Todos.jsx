import { useState, useEffect } from "react";
import api from "../api/axios";
export default function Todos() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const loadTodos = async () => {
    const res = await api.get("/todos");
    setTodos(res.data);
  };
  useEffect(() => {
    loadTodos();
  }, []);
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await api.post("/todos", { title, dueDate: dueDate || null });
    setTitle("");
    setDueDate("");
    loadTodos();
  };
  const toggleStatus = async (todo) => {
    const newStatus = todo.status === "done" ? "pending" : "done";
    // Optimistic update, same pattern as subtasks
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, status: newStatus } : t)),
    );
    try {
      await api.patch(`/todos/${todo.id}`, { status: newStatus });
    } catch (err) {
      loadTodos();
    }
  };
  const handleDelete = async (id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    try {
      await api.delete(`/todos/${id}`);
    } catch (err) {
      loadTodos();
    }
  };
  const pending = todos.filter((t) => t.status !== "done");
  const done = todos.filter((t) => t.status === "done");
  return (
    <div className="max-w-2xl mx-auto p-10">
      {" "}
      <h1 className="text-2xl font-bold text-ink mb-8">My to-dos</h1>{" "}
      <form onSubmit={handleAdd} className="flex gap-2 mb-8">
        {" "}
        <input
          type="text"
          placeholder="Add a to-do..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 border border-line rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-steel"
        />{" "}
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="border border-line rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-steel"
        />{" "}
        <button
          type="submit"
          className="bg-steel text-white px-4 py-2 rounded font-medium hover:bg-steel-dark transition-colors"
        >
          {" "}
          Add{" "}
        </button>{" "}
      </form>{" "}
      {todos.length === 0 && (
        <p className="text-ink/40">Nothing here yet.</p>
      )}{" "}
      {pending.length > 0 && (
        <div className="space-y-2 mb-8">
          {" "}
          {pending.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-3 bg-white p-3 rounded border border-line"
            >
              {" "}
              <input
                type="checkbox"
                checked={false}
                onChange={() => toggleStatus(todo)}
                className="accent-steel"
              />{" "}
              <div className="flex-1">
                {" "}
                <p className="text-ink">{todo.title}</p>{" "}
                {todo.dueDate && (
                  <p className="text-xs text-ink/40">
                    {" "}
                    Due {new Date(todo.dueDate).toLocaleDateString()}{" "}
                  </p>
                )}{" "}
              </div>{" "}
              <button
                onClick={() => handleDelete(todo.id)}
                className="text-xs text-brick hover:underline"
              >
                {" "}
                Delete{" "}
              </button>{" "}
            </div>
          ))}{" "}
        </div>
      )}{" "}
      {done.length > 0 && (
        <div>
          {" "}
          <p className="text-sm font-semibold text-ink/40 mb-2">Done</p>{" "}
          <div className="space-y-2">
            {" "}
            {done.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-3 bg-white p-3 rounded border border-line opacity-60"
              >
                {" "}
                <input
                  type="checkbox"
                  checked={true}
                  onChange={() => toggleStatus(todo)}
                  className="accent-moss"
                />{" "}
                <p className="flex-1 text-ink line-through">{todo.title}</p>{" "}
                <button
                  onClick={() => handleDelete(todo.id)}
                  className="text-xs text-brick hover:underline"
                >
                  {" "}
                  Delete{" "}
                </button>{" "}
              </div>
            ))}{" "}
          </div>{" "}
        </div>
      )}{" "}
    </div>
  );
}
