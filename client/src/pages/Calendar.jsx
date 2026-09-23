import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
// Build a key from raw y/m/d numbers — no timezone conversion involved
function makeKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// Deadlines are stored as UTC midnight, matching the date the user actually picked —
// so we read the UTC components to get the "intended" calendar date, not the local one
function keyFromUTCDate(dateStr) {
  const d = new Date(dateStr);
  return makeKey(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}
function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = startWeekday - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    cells.push({
      day,
      current: false,
      y: year,
      m: month - 1,
      key: makeKey(year, month - 1, day),
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      current: true,
      y: year,
      m: month,
      key: makeKey(year, month, d),
    });
  }
  while (cells.length % 7 !== 0) {
    const day = cells.length - (startWeekday + daysInMonth) + 1;
    cells.push({
      day,
      current: false,
      y: year,
      m: month + 1,
      key: makeKey(year, month + 1, day),
    });
  }
  return cells;
}
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export default function CalendarPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const today = new Date();
  const todayKey = makeKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [tasksByDate, setTasksByDate] = useState({});
  const [loading, setLoading] = useState(true);
  const [todosByDate, setTodosByDate] = useState({});
  useEffect(() => {
    setLoading(true);
    const endpoint = isAdmin ? "/calendar/team" : "/calendar/mine";
    Promise.all([api.get(endpoint), api.get("/todos")]).then(
      ([tasksRes, todosRes]) => {
        const taskMap = {};
        tasksRes.data.forEach((task) => {
          const key = keyFromUTCDate(task.deadline);
          if (!taskMap[key]) taskMap[key] = [];
          taskMap[key].push(task);
        });
        setTasksByDate(taskMap);
        const todoMap = {};
        todosRes.data.forEach((todo) => {
          if (!todo.dueDate) return;
          const key = keyFromUTCDate(todo.dueDate);
          if (!todoMap[key]) todoMap[key] = [];
          todoMap[key].push(todo);
        });
        setTodosByDate(todoMap);
        setLoading(false);
      },
    );
  }, []);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const cells = getMonthGrid(year, month);
  const goToPrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToToday = () =>
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
  const taskColor = (task) => {
    if (task.status === "done") return "bg-moss";
    if (new Date(task.deadline) < today) return "bg-brick";
    return "bg-steel";
  };
  return (
    <div className="max-w-4xl mx-auto p-10">
      {" "}
      <div className="flex justify-between items-center mb-6">
        {" "}
        <h1 className="text-2xl font-bold text-ink">
          {" "}
          {isAdmin ? "Team calendar" : "My calendar"}{" "}
        </h1>{" "}
        <div className="flex items-center gap-2">
          {" "}
          <button
            onClick={goToPrevMonth}
            className="px-2 py-1 rounded border border-line hover:bg-white"
          >
            &larr;
          </button>{" "}
          <button
            onClick={goToToday}
            className="px-3 py-1 rounded border border-line hover:bg-white text-sm"
          >
            Today
          </button>{" "}
          <button
            onClick={goToNextMonth}
            className="px-2 py-1 rounded border border-line hover:bg-white"
          >
            &rarr;
          </button>{" "}
        </div>{" "}
      </div>{" "}
      <h2 className="text-lg font-semibold text-ink mb-4">
        {MONTH_NAMES[month]} {year}
      </h2>{" "}
      {loading && <p className="text-ink/40 mb-4">Loading calendar...</p>}
      <div className="grid grid-cols-7 gap-px bg-line border border-line rounded overflow-hidden">
        {" "}
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="bg-ink text-canvas text-xs font-semibold text-center py-2"
          >
            {day}
          </div>
        ))}{" "}
        {cells.map((cell, i) => {
          const dayTasks = tasksByDate[cell.key] || [];
          const dayTodos = todosByDate[cell.key] || [];
          const items = [
            ...dayTasks.map((t) => ({ ...t, _type: "task" })),
            ...dayTodos.map((t) => ({ ...t, _type: "todo" })),
          ];
          return (
            <div
              key={i}
              className={`bg-white min-h-24 p-1.5 ${!cell.current ? "opacity-40" : ""}`}
            >
              {" "}
              <p
                className={`text-xs font-medium mb-1 ${cell.key === todayKey ? "inline-block bg-ochre text-ink rounded-full w-5 h-5 text-center leading-5" : "text-ink/60"}`}
              >
                {" "}
                {cell.day}{" "}
              </p>{" "}
              <div className="space-y-0.5">
                {" "}
                {items.slice(0, 3).map((item) => (
                  <button
                    key={`${item._type}-${item.id}`}
                    onClick={() =>
                      navigate(item._type === "task" ? "/tasks" : "/todos")
                    }
                    className={`block w-full text-left text-[10px] leading-tight text-white rounded px-1 py-0.5 truncate hover:opacity-80 ${item._type === "todo" ? "bg-ochre" : taskColor(item)}`}
                    title={item.title}
                  >
                    {" "}
                    {item.title}{" "}
                  </button>
                ))}{" "}
                {items.length > 3 && (
                  <p className="text-[10px] text-ink/40">
                    +{items.length - 3} more
                  </p>
                )}{" "}
              </div>{" "}
            </div>
          );
        })}{" "}
      </div>{" "}
      <div className="flex gap-4 mt-4 text-xs text-ink/60">
        {" "}
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-steel inline-block" /> Task —
          upcoming
        </span>{" "}
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-brick inline-block" /> Task —
          overdue
        </span>{" "}
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-moss inline-block" /> Task —
          done
        </span>{" "}
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-ochre inline-block" />{" "}
          Personal to-do
        </span>{" "}
      </div>{" "}
    </div>
  );
}
