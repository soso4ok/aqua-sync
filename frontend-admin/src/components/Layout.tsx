import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  LogOut, 
  Waves, 
  Settings as SettingsIcon, 
  Bell, 
  Search,
  Zap,
  Navigation2
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
    <div className="flex h-screen bg-data-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-satellite-blue text-white flex flex-col border-r border-satellite-blue/20">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-galileo-teal p-2 rounded-lg">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight leading-none">AquaSync</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-galileo-teal/80 font-mono mt-1">Satellite Fusion</p>
          </div>
        </div>

        <nav className="flex-1 mt-4 px-4 space-y-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-galileo-teal text-white shadow-lg' 
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-galileo-teal text-white shadow-lg' 
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <User className="w-5 h-5" />
            <span className="font-medium">Profile</span>
          </NavLink>

          <div className="pt-4 pb-2">
             <p className="px-4 text-[10px] uppercase font-mono text-white/30 tracking-widest">Systems</p>
          </div>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-galileo-teal text-white shadow-lg' 
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <SettingsIcon className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </NavLink>
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
             <div className="flex items-center gap-2 mb-2">
                <Navigation2 className="w-3 h-3 text-galileo-teal" />
                <span className="text-[10px] font-mono text-white/50 uppercase tracking-tighter">Galileo Status</span>
             </div>
             <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Active (12 Sat)</span>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
             </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-signal-coral hover:bg-signal-coral/10 transition-all cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-satellite-blue/10 flex items-center justify-between px-8 z-10">
          {isDashboard ? (
            <div className="flex items-center gap-4 bg-data-white px-4 py-2 rounded-full border border-satellite-blue/5">
              <Search className="w-4 h-4 text-satellite-blue/40" />
              <input 
                type="text" 
                placeholder="Search category or description..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-64 placeholder:text-satellite-blue/30 font-mono"
              />
            </div>
          ) : <div className="flex-1"></div>}

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-xs font-mono text-satellite-blue/40 uppercase">Last Sync</span>
              <span className="text-sm font-medium">10:42 AM (Copernicus)</span>
            </div>
            
            <button className="relative text-satellite-blue/60 hover:text-satellite-blue transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-signal-coral rounded-full border-2 border-white"></span>
            </button>

            <div className="h-8 w-px bg-satellite-blue/10"></div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold leading-none">Admin Analyst</p>
                <p className="text-[10px] text-satellite-blue/50 font-mono">Region: Baltic Sea</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-galileo-teal/20 flex items-center justify-center border border-galileo-teal/40">
                <User className="w-6 h-6 text-galileo-teal" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-data-white">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
