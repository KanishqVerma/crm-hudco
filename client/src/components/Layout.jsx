import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUnread } from '../context/UnreadContext';

function getNavItems(role) {
  const items = [
    { to: '/tasks', label: 'Tasks' },
    { to: '/calendar', label: 'Calendar' },
    { to: '/todos', label: 'My To-Dos' },
    { to: '/chat', label: 'Chat' },
  ];
  if (role === 'admin') {
    items.push({ to: '/admin', label: 'Manage Users' });
  }
  return items;
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { unreadTotal } = useUnread();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = getNavItems(user?.role);

  // Close the mobile menu whenever the page changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen md:flex bg-canvas">
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 h-14 bg-steel text-white flex items-center px-3 z-30">
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="relative p-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          {unreadTotal > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-ochre" />
          )}
        </button>
      </header>

      {/* Dimmed backdrop behind the mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-dvh w-64 z-50 bg-steel text-white flex flex-col shrink-0 overflow-y-auto transition-transform duration-200 md:sticky md:h-screen md:w-56 md:translate-x-0 md:z-auto ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 py-6 border-b border-white/20 flex items-start justify-between">
          <div>
            <p className="font-bold text-lg tracking-tight">CRM</p>
            <p className="text-xs text-white/70 mt-0.5">Internal workspace</p>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="md:hidden p-1 -mr-1 text-white/80 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center justify-between px-3 py-2.5 rounded text-sm font-medium transition-colors ${
                  active
                    ? 'bg-ochre text-ink'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {item.to === '/chat' && unreadTotal > 0 && (
                  <span className="bg-white text-steel text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {unreadTotal}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-white/20">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-white/70 capitalize mb-3">{user?.role}</p>
          <button
            onClick={logout}
            className="text-xs text-white/80 hover:text-white underline"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 pt-14 md:pt-0">{children}</main>
    </div>
  );
}