import { motion } from 'motion/react';
import { Award, Zap, Globe, Target, ShieldCheck, Waves, Users, MessageSquare } from 'lucide-react';

const badges = [
  { id: 1, name: "Galileo Eye", icon: Globe, color: "text-galileo", earned: true, desc: "First 10 verified high-precision reports" },
  { id: 2, name: "First Drop", icon: Waves, color: "text-galileo", earned: true, desc: "Submit your first water pollution report" },
  { id: 3, name: "Sentinel Sync", icon: Target, color: "text-signal", earned: true, desc: "Report matched a satellite anomaly" },
  { id: 4, name: "Guardian", icon: ShieldCheck, color: "text-satellite", earned: false, desc: "Reach level 5 impact status" },
  { id: 5, name: "Eco Prophet", icon: Zap, color: "text-signal", earned: false, desc: "Identify 3 illegal chemical flows" },
];

export default function Profile() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFB] p-6 pb-48">
      {/* Header Profile Section */}
      <div className="flex justify-between items-start mb-8">
         <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-galileo flex items-center justify-center text-white font-bold text-2xl shadow-lg italic">
              EV
            </div>
            <div>
               <h1 className="text-xl font-bold text-satellite tracking-tight">EcoGuard_Kyiv</h1>
               <p className="text-xs text-satellite/40 font-mono uppercase tracking-widest">Level 3 Guardian</p>
            </div>
         </div>
         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center tech-border shadow-sm text-satellite/40">
            <ShieldCheck size={20} />
         </div>
      </div>

      {/* Main Portfolio/Impact Value Card */}
      <div className="bg-satellite rounded-[2rem] p-8 text-white mb-8 relative overflow-hidden shadow-2xl shadow-satellite/20">
         <div className="relative z-10">
            <p className="text-white/60 text-xs font-mono uppercase tracking-widest mb-2 font-bold">Total Impact Value</p>
            <div className="flex items-baseline gap-2 mb-1">
               <h2 className="text-4xl font-bold tracking-tighter">1,250.00</h2>
               <span className="text-xl font-medium opacity-60 italic">pts</span>
            </div>
            <p className="text-green-400 text-xs font-bold font-mono">
               +12.4% <span className="opacity-60 ml-1">weekly growth</span>
            </p>
         </div>
         
         <div className="absolute right-[-20px] top-1/2 -translate-y-1/2 opacity-10">
            <Waves size={160} />
         </div>

         <div className="mt-8 flex gap-3 relative z-10">
            <button className="flex-grow py-3 bg-white/10 backdrop-blur-md rounded-2xl text-xs font-bold uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-all">
              Withdraw Badges
            </button>
            <button className="flex-grow py-3 bg-galileo rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-galileo/20 hover:scale-105 active:scale-95 transition-all">
              Top Up Log
            </button>
         </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: 'History', icon: Target, color: 'bg-white text-satellite' },
          { label: 'Referral', icon: Users, color: 'bg-white text-satellite' },
          { label: 'Global', icon: Globe, color: 'bg-white text-satellite' },
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className={`w-14 h-14 rounded-2xl shadow-sm tech-border flex items-center justify-center ${item.color} active:scale-95 transition-all cursor-pointer`}>
              <item.icon size={22} />
            </div>
            <span className="text-[10px] font-bold text-satellite/60 tracking-tight uppercase">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Asset List / Achievement Log */}
      <div className="space-y-6">
         <div className="flex justify-between items-end">
            <h3 className="text-sm font-bold text-satellite/40 uppercase tracking-widest">Active Artifacts</h3>
            <span className="text-[10px] font-bold text-galileo uppercase">View All</span>
         </div>

         <div className="space-y-3">
            {badges.slice(0, 3).map(badge => (
              <div key={badge.id} className="bg-white p-4 rounded-3xl tech-border shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                 <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${badge.earned ? 'bg-galileo/10 text-galileo' : 'bg-data text-satellite/20'}`}>
                       <badge.icon size={24} />
                    </div>
                    <div>
                       <h4 className="font-bold text-satellite text-sm tracking-tight">{badge.name}</h4>
                       <p className="text-[10px] font-mono text-satellite/40 uppercase">Verified Logic Artifact</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="font-bold text-sm text-satellite">1.00</p>
                    <p className="text-[9px] font-mono text-green-500 font-bold uppercase tracking-tighter">Minted</p>
                 </div>
              </div>
            ))}
         </div>
      </div>

      {/* Reward Banner */}
      <div className="mt-autp mt-10 bg-white rounded-3xl p-6 border-2 border-galileo/5 relative overflow-hidden shadow-sm">
         <div className="relative z-10 pr-20">
            <h4 className="text-sm font-bold text-satellite mb-1 tracking-tight">EcoVanguard Review</h4>
            <p className="text-xs text-satellite/60 leading-tight">
               Get +500 impact pts by reviewing the basin status.
            </p>
            <button className="mt-4 bg-galileo text-white px-5 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase">
               Review Now
            </button>
         </div>
         <div className="absolute right-[-10px] bottom-[-10px] opacity-10">
            <Award size={100} className="text-galileo" />
         </div>
      </div>
    </div>
  );
}
