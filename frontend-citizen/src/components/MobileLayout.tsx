import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

const ApertureIcon = ({ color }: { color: string }) => (
  <svg viewBox="-50 -50 100 100" width="26" height="26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath id="ac2">
        <circle r="46" />
      </clipPath>
    </defs>
    <g clipPath="url(#ac2)">
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const step = (2 * Math.PI) / 6;
        const off = step / 2;
        const R = 42;
        const r = 13;
        const a = i * step - Math.PI / 2;
        const pts = [
          [R * Math.cos(a), R * Math.sin(a)],
          [R * Math.cos(a + step), R * Math.sin(a + step)],
          [r * Math.cos(a + step + off), r * Math.sin(a + step + off)],
          [r * Math.cos(a + off), r * Math.sin(a + off)]
        ].map(p => p.map(v => v.toFixed(1)).join(",")).join(" ");
        return <polygon key={i} points={pts} fill={color} />;
      })}
    </g>
    <circle r="45.5" fill="none" stroke={color} strokeWidth="3" />
  </svg>
);

const ProfileIcon = ({ color }: { color: string }) => (
  <svg viewBox="-16 -17 32 34" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="-10" y="-13" width="20" height="26" rx="3.5" stroke={color} strokeWidth="1.9" />
    <circle cx="0" cy="-3.5" r="4" stroke={color} strokeWidth="1.7" />
    <path d="M-7 9 Q-7 4.5 0 4.5 Q7 4.5 7 9" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    <circle cx="0" cy="-13" r="2" fill={color} />
  </svg>
);

const ShopIcon = ({ color }: { color: string }) => (
  <svg viewBox="-16 -16 32 32" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M-10 -2 L-12 13 L12 13 L10 -2 Z" stroke={color} strokeWidth="1.9" strokeLinejoin="round" />
    <path d="M-6 -2 L-6 -7 Q-6 -13 0 -13 Q6 -13 6 -7 L6 -2" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    <path d="M-4 5 L0 3 L4 5 L0 7 Z" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

export default function MobileLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isProfile = location.pathname === '/profile';

  const handleHomeClick = (e: React.MouseEvent) => {
    if (isHome) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('trigger-capture'));
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-data-white max-w-md mx-auto relative shadow-2xl overflow-hidden border-x border-satellite-blue/5">
      {/* Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <Outlet />
      </main>

      {/* Modern Fixed Bottom Navbar */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center z-50 pointer-events-none px-6">
        <div className="relative flex items-center justify-center w-full max-w-[280px]">
          
          {/* Main Navigation Pill */}
          <nav className="relative flex items-center bg-[#172846] rounded-[34px] p-1.5 border border-white/10 shadow-[0_20px_50px_rgba(10,36,99,0.3)] overflow-hidden pointer-events-auto z-10">
            {/* White Indicator */}
            <motion.div
              className="absolute w-[52px] h-[52px] bg-white rounded-full z-0"
              initial={false}
              animate={{
                x: isHome ? 0 : 56,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />

            <NavLink
              to="/"
              onClick={handleHomeClick}
              className="relative w-[52px] h-[52px] flex items-center justify-center z-10 rounded-full transition-transform active:scale-90"
            >
              <ApertureIcon color={isHome ? '#172846' : 'rgba(255,255,255,0.55)'} />
            </NavLink>

            <div className="w-1" />

            <NavLink
              to="/profile"
              className="relative w-[52px] h-[52px] flex items-center justify-center z-10 rounded-full transition-transform active:scale-90"
            >
              <ProfileIcon color={isProfile ? '#172846' : 'rgba(255,255,255,0.55)'} />
            </NavLink>
          </nav>

          {/* Shop Pill (Absolute positioned to the right to prevent shifting) */}
          <AnimatePresence>
            {(isProfile || location.pathname === '/shop') && (
              <motion.div
                initial={{ opacity: 0, x: -20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.9 }}
                className="absolute left-[calc(50%+65px)] pointer-events-auto"
              >
                <NavLink
                  to="/shop"
                  className="flex items-center gap-[7px] px-[16px] pl-[12px] h-[62px] rounded-[34px] bg-[#FFF4EC] border border-[#C4551A]/10 active:scale-95 transition-transform shadow-[0_10px_30px_rgba(196,85,26,0.15)] whitespace-nowrap"
                >
                  <ShopIcon color="#C4551A" />
                  <span className="font-chakra text-[12px] font-bold tracking-[0.1em] text-[#C4551A]">SHOP</span>
                </NavLink>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
