import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
export default function CalendarPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const isAdmin = user?.role === "admin";
  useEffect(() => {
    const endpoint = isAdmin ? "/calendar/team" : "/calendar/mine";
    api.get(endpoint).then((res) => setTasks(res.data));
  }, []);
  const grouped = tasks.reduce((acc, task) => {
    const date = new Date(task.deadline).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(task);
    return acc;
  }, {});
  const isOverdue = (deadline) => new Date(deadline) < new Date();
  return (
    <div className="max-w-3xl mx-auto p-10">
      {" "}
      <h1 className="text-2xl font-bold text-ink mb-8">
        {" "}
        {isAdmin ? "Team calendar" : "My calendar"}{" "}
      </h1>{" "}
      {Object.keys(grouped).length === 0 && (
        <p className="text-ink/40">No upcoming deadlines.</p>
      )}{" "}
      <div className="space-y-6">
        {" "}
        {Object.entries(grouped).map(([date, dateTasks]) => (
          <div key={date}>
            {" "}
            <h2 className="text-sm font-semibold text-ink/50 mb-2">
              {date}
            </h2>{" "}
            <div className="space-y-2">
              {" "}
              {dateTasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-white p-4 rounded border-l-4 border border-line ${task.status === "done" ? "border-l-moss" : isOverdue(task.deadline) ? "border-l-brick" : "border-l-steel"}`}
                >
                  {" "}
                  <p className="font-medium text-ink">{task.title}</p>{" "}
                  {task.assignees && (
                    <p className="text-xs text-ink/40 mt-1">
                      {" "}
                      {task.assignees.map((a) => a.user.name).join(", ")}{" "}
                    </p>
                  )}{" "}
                  {isOverdue(task.deadline) && task.status !== "done" && (
                    <span className="text-xs text-brick font-semibold">
                      Overdue
                    </span>
                  )}{" "}
                </div>
              ))}{" "}
            </div>{" "}
          </div>
        ))}{" "}
      </div>{" "}
    </div>
  );
}
