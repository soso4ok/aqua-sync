import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  LogOut,
  Waves,
  Settings as SettingsIcon,
  Bell,
  Search,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useSearch } from '../context/SearchContext';

interface LayoutProps {
  onLogout: () => void;
}

export default function Layout({ onLogout }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { searchQuery, setSearchQuery } = useSearch();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const isDashboard = location.pathname === '/';

  return (
    <div className="flex h-screen bg-white overflow-hidden">

      {/* ── Main App Sidebar (Hover Expandable) ── */}
      <aside className="group fixed left-0 top-0 bottom-0 z-[3000] w-20 hover:w-64 bg-slate-900 text-white transition-all duration-300 ease-in-out flex flex-col shadow-2xl">

        {/* Logo Section */}
        <div className="p-6 flex items-center gap-4 overflow-hidden min-h-[88px]">
          <div className="bg-indigo-500 p-2 rounded-xl shrink-0 shadow-lg shadow-indigo-500/20">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            <h1 className="font-black text-xl tracking-tighter leading-none">AquaSync</h1>
            <p className="text-[9px] uppercase tracking-widest text-indigo-400 font-bold mt-1">Satellite Fusion</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-6 px-3 space-y-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-4 h-12 rounded-xl transition-all duration-200 overflow-hidden ${isActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <div className="w-14 h-12 flex items-center justify-center shrink-0">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm tracking-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300">Dashboard</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-4 h-12 rounded-xl transition-all duration-200 overflow-hidden ${isActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <div className="w-14 h-12 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm tracking-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300">Profile</span>
          </NavLink>

          <div className="pt-6 pb-2 px-4 overflow-hidden">
            <div className="h-px bg-white/10 w-full group-hover:hidden"></div>
            <p className="hidden group-hover:block text-[9px] uppercase font-black text-white/20 tracking-widest">Controls</p>
          </div>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-4 h-12 rounded-xl transition-all duration-200 overflow-hidden ${isActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <div className="w-14 h-12 flex items-center justify-center shrink-0">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm tracking-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300">Settings</span>
          </NavLink>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 h-12 w-full rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all overflow-hidden"
          >
            <div className="w-12 h-12 flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm tracking-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col relative overflow-hidden ml-20 transition-all duration-300">
        {/* Header */}
        <header className="h-[88px] bg-white border-b border-slate-100 flex items-center justify-between px-8 z-10 shrink-0">
          {isDashboard ? (
            <div className="flex items-center gap-4 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
              <Search className="w-4 h-4 text-slate-300" />
              <input
                type="text"
                placeholder="Search anomalies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-80 placeholder:text-slate-300 font-bold"
              />
            </div>
          ) : <div className="flex-1"></div>}

          <div className="flex items-center gap-8">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest leading-none mb-1">Status</span>
              <span className="text-xs font-black text-rose-500 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div> SENSOR LIVE</span>
            </div>

            <button className="relative text-slate-400 hover:text-indigo-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="flex items-center gap-4 pl-4 border-l border-slate-100">
              <div className="text-right">
                <p className="text-sm font-black text-slate-800 leading-none mb-1 uppercase tracking-tighter">Analyst Mode</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Security Clearance A</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                <User className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-slate-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
