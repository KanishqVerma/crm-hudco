import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

// Keys are plain y/m/d numbers, so timezones can never shift a date
function makeKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// Deadlines are stored as UTC midnight, matching the date the user picked
function keyFromUTCDate(dateStr) {
  const d = new Date(dateStr);
  return makeKey(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

// Normalises overflow (day 0, month 12, etc.) so year boundaries work
function makeCell(year, month, day, current) {
  const d = new Date(year, month, day);
  return {
    day: d.getDate(),
    current,
    key: makeKey(d.getFullYear(), d.getMonth(), d.getDate()),
  };
}

function getMonthGrid(year, month) {
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = startWeekday; i > 0; i--) cells.push(makeCell(year, month, 1 - i, false));
  for (let d = 1; d <= daysInMonth; d++) cells.push(makeCell(year, month, d, true));
  let next = 1;
  while (cells.length % 7 !== 0) cells.push(makeCell(year, month + 1, next++, false));

  return cells;
}

function labelForKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CalendarPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const today = new Date();
  const todayKey = makeKey(today.getFullYear(), today.getMonth(), today.getDate());

  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [tasksByDate, setTasksByDate] = useState({});
  const [todosByDate, setTodosByDate] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const endpoint = isAdmin ? '/calendar/team' : '/calendar/mine';

    Promise.all([api.get(endpoint), api.get('/todos')])
      .then(([tasksRes, todosRes]) => {
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
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const cells = getMonthGrid(year, month);

  const goToPrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
    setSelectedKey(null);
  };
  const goToNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
    setSelectedKey(null);
  };
  const goToToday = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedKey(todayKey);
  };

  const getItems = (key) => [
    ...(tasksByDate[key] || []).map((t) => ({ ...t, _type: 'task' })),
    ...(todosByDate[key] || []).map((t) => ({ ...t, _type: 'todo' })),
  ];

  const itemColor = (item) => {
    if (item._type === 'todo') return 'bg-ochre';
    if (item.status === 'done') return 'bg-moss';
    if (keyFromUTCDate(item.deadline) < todayKey) return 'bg-brick';
    return 'bg-upcoming';
  };

  const openItem = (item) => navigate(item._type === 'task' ? '/tasks' : '/todos');

  const selectedItems = selectedKey ? getItems(selectedKey) : [];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-ink">
          {isAdmin ? 'Team calendar' : 'My calendar'}
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={goToPrevMonth} className="px-3 py-1 rounded border border-line hover:bg-white">
            &larr;
          </button>
          <button onClick={goToToday} className="px-3 py-1 rounded border border-line hover:bg-white text-sm">
            Today
          </button>
          <button onClick={goToNextMonth} className="px-3 py-1 rounded border border-line hover:bg-white">
            &rarr;
          </button>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-ink mb-4">
        {MONTH_NAMES[month]} {year}
      </h2>

      {loading && <p className="text-ink/40 mb-4">Loading calendar...</p>}

      <div className="grid grid-cols-7 gap-px bg-line border border-line rounded overflow-hidden">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="bg-steel text-white text-[10px] sm:text-xs font-semibold text-center py-2"
          >
            {day}
          </div>
        ))}

        {cells.map((cell, i) => {
          const items = getItems(cell.key);
          return (
            <div
              key={i}
              onClick={() => setSelectedKey(cell.key)}
              className={`bg-white min-h-14 sm:min-h-24 p-1 sm:p-1.5 cursor-pointer ${
                !cell.current ? 'opacity-40' : ''
              } ${selectedKey === cell.key ? 'ring-2 ring-inset ring-steel' : ''}`}
            >
              <p
                className={`text-xs font-medium mb-1 ${
                  cell.key === todayKey
                    ? 'inline-block bg-ochre text-ink rounded-full w-5 h-5 text-center leading-5'
                    : 'text-ink/60'
                }`}
              >
                {cell.day}
              </p>

              {/* Phones: colored dots */}
              <div className="flex flex-wrap gap-0.5 sm:hidden">
                {items.slice(0, 4).map((item) => (
                  <span
                    key={`${item._type}-${item.id}`}
                    className={`w-1.5 h-1.5 rounded-full ${itemColor(item)}`}
                  />
                ))}
              </div>

              {/* Larger screens: title pills */}
              <div className="hidden sm:block space-y-0.5">
                {items.slice(0, 3).map((item) => (
                  <button
                    key={`${item._type}-${item.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      openItem(item);
                    }}
                    className={`block w-full text-left text-[10px] leading-tight text-white rounded px-1 py-0.5 truncate hover:opacity-80 ${itemColor(item)}`}
                    title={item.title}
                  >
                    {item.title}
                  </button>
                ))}
                {items.length > 3 && (
                  <p className="text-[10px] text-ink/40">+{items.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-xs text-ink/60">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-upcoming inline-block" /> Task - upcoming
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-brick inline-block" /> Task - overdue
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-moss inline-block" /> Task - done
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-ochre inline-block" /> Personal to-do
        </span>
      </div>

      {selectedKey && (
        <div className="mt-6 bg-white border border-line rounded p-4">
          <p className="text-sm font-semibold text-ink mb-2">{labelForKey(selectedKey)}</p>
          {selectedItems.length === 0 ? (
            <p className="text-sm text-ink/40">Nothing due on this day.</p>
          ) : (
            <div className="space-y-1">
              {selectedItems.map((item) => (
                <button
                  key={`${item._type}-${item.id}`}
                  onClick={() => openItem(item)}
                  className="flex items-start gap-2 w-full text-left text-sm py-1.5"
                >
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${itemColor(item)}`} />
                  <span className="flex-1 min-w-0">
                    <span className="break-words">{item.title}</span>
                    {item.assignees && (
                      <span className="block text-xs text-ink/40">
                        {item.assignees.map((a) => a.user.name).join(', ')}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-ink/40 shrink-0">
                    {item._type === 'todo' ? 'To-do' : 'Task'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}