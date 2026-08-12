import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: "⊞", perm: "view" },
  { to: "/loans", label: "Loans", icon: "📋", perm: "view" },
  { to: "/add-loan", label: "Add Loan", icon: "＋", perm: "add_loan" },
  { to: "/admin", label: "Administration", icon: "⚙", perm: "manage_users" },
];

export default function Layout({ children }) {
  const { currentUser, logout, can } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleColors = {
    master_admin: "bg-violet-100 text-violet-700",
    admin: "bg-indigo-100 text-indigo-700",
    editor: "bg-sky-100 text-sky-700",
    viewer: "bg-slate-100 text-slate-600",
  };
  const roleLabels = { master_admin: "Master Admin", admin: "Admin", editor: "Editor", viewer: "Viewer" };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 fixed h-full z-20">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">₹</div>
          <span className="font-bold text-slate-900 text-lg">Ledger</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.filter((n) => can(n.perm)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {currentUser?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{currentUser?.name}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColors[currentUser?.role]}`}>
                {roleLabels[currentUser?.role]}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition"
          >
            <span>↩</span> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">₹</div>
          <span className="font-bold text-slate-900">Ledger</span>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100">
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-20 pt-14" onClick={() => setMenuOpen(false)}>
          <div className="bg-white border-b border-slate-100 px-4 py-3 space-y-1">
            {NAV.filter((n) => can(n.perm)).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                    isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
                  }`
                }
              >
                <span>{item.icon}</span> {item.label}
              </NavLink>
            ))}
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl">
              <span>↩</span> Sign out
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">{children}</div>
      </main>
    </div>
  );
}
