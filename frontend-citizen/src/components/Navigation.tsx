import { NavLink } from 'react-router-dom';
import { Camera, User, History, Map as MapIcon, Home } from 'lucide-react';
import { motion } from 'motion/react';

export default function Navigation() {
  const navItems = [
    { to: '/home', icon: Home, label: 'Home' },
    { to: '/community', icon: MapIcon, label: 'Map' },
    { to: '/scan', icon: Camera, label: 'Scan' },
    { to: '/history', icon: History, label: 'Reports' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-6 left-6 right-6 z-[100] md:left-auto md:right-8 md:top-1/2 md:bottom-auto md:-translate-y-1/2 md:w-20">
      <div className="bg-satellite/90 backdrop-blur-3xl rounded-[2.5rem] p-2 flex justify-around items-center border border-white/10 shadow-2xl shadow-satellite/40 md:flex-col md:gap-4 md:py-8">
        <div className="hidden md:flex w-12 h-12 bg-galileo rounded-2xl items-center justify-center text-white shadow-lg mb-2">
           <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
        </div>
        
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `
              relative group flex flex-col items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-2xl transition-all duration-500
              ${isActive ? 'bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'text-white/40 hover:text-white/80'}
              ${to === '/scan' ? 'bg-galileo/20' : ''}
            `}
          >
            {({ isActive }) => (
              <>
                <Icon size={to === '/scan' ? 24 : 20} strokeWidth={isActive ? 2.5 : 2} className={`transition-transform group-active:scale-90 ${to === '/scan' && !isActive ? 'text-galileo' : ''}`} />
                <span className="text-[6px] mt-0.5 font-bold uppercase tracking-tighter md:hidden truncate w-full text-center">{label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="nav-active"
                    className="absolute bottom-1 md:right-1 md:top-1/2 md:-translate-y-1/2 md:bottom-auto w-1 h-1 bg-galileo rounded-full shadow-[0_0_8px_#3E92CC]"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
