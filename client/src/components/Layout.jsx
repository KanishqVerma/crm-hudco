import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUnread } from "../context/UnreadContext";
function getNavItems(role) { const items = [ { to: '/tasks', label: 'Tasks' }, { to: '/calendar', label: 'Calendar' }, { to: '/todos', label: 'My To-Dos' }, { to: '/chat', label: 'Chat' }, ]; if (role === 'admin') { items.push({ to: '/admin', label: 'Manage Users' }); } return items; }
export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navItems = getNavItems(user?.role);
  const { unreadTotal } = useUnread();
  const location = useLocation();
  return (
    <div className="min-h-screen flex bg-canvas">
      {" "}
      <aside className="w-56 bg-ink text-canvas flex flex-col shrink-0 h-screen sticky top-0 overflow-y auto">
        {" "}
        <div className="px-5 py-6 border-b border-white/10">
          {" "}
          <p className="font-bold text-lg tracking-tight">CRM</p>{" "}
          <p className="text-xs text-white/50 mt-0.5">
            Internal workspace
          </p>{" "}
        </div>{" "}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {" "}
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center justify-between px-3 py-2 rounded text-sm font-medium transition-colors ${
                  active
                    ? "bg-ochre text-ink"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>{item.label}</span>
                {item.to === "/chat" && unreadTotal > 0 && (
                  <span className="bg-brick text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {unreadTotal}
                  </span>
                )}
              </Link>
            );
          })}{" "}
        </nav>{" "}
        <div className="px-5 py-4 border-t border-white/10">
          {" "}
          <p className="text-sm font-medium">{user?.name}</p>{" "}
          <p className="text-xs text-white/50 capitalize mb-3">{user?.role}</p>{" "}
          <button
            onClick={logout}
            className="text-xs text-white/60 hover:text-white underline"
          >
            {" "}
            Log out{" "}
          </button>{" "}
        </div>{" "}
      </aside>{" "}
      <main className="flex-1 overflow-y-auto">{children}</main>{" "}
    </div>
  );
}
