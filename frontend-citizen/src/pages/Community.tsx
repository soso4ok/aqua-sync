import { motion } from 'motion/react';
import { Search, Trophy, Globe, Map as MapIcon, Users } from 'lucide-react';

const leaders = [
  { id: 1, name: "Capt_Dnipro", score: 4890, region: "Kyiv", active: true },
  { id: 2, name: "EcoWartowy_UA", score: 1250, region: "Kyiv-Reg", active: true },
  { id: 3, name: "AquaSage", score: 920, region: "Cherkasy", active: false },
  { id: 4, name: "StormChaser", score: 840, region: "Kaniv", active: false },
  { id: 5, name: "RiverRun", score: 710, region: "Kyiv", active: true },
];

export default function Community() {
  return (
    <div className="flex flex-col min-h-screen pb-48">
      {/* Map Header */}
      <div className="relative h-[45vh] bg-satellite overflow-hidden">
        {/* Mock Map Grid */}
        <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-10">
           {Array.from({ length: 144 }).map((_, i) => (
             <div key={i} className="border-[0.5px] border-white/50" />
           ))}
        </div>
        
        {/* Heatmap Blobs */}
        <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-galileo/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-signal/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-galileo/20 rounded-full blur-2xl" />

        {/* Floating Pins */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
           <MapIcon className="text-white drop-shadow-lg" size={32} />
           <div className="w-4 h-4 bg-signal rounded-full absolute -top-1 -right-1 border-2 border-satellite animate-bounce" />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-satellite via-transparent to-transparent" />
        
        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
           <div>
              <p className="text-[10px] font-mono text-data/40 uppercase tracking-widest">Active Region</p>
              <h2 className="text-2xl font-bold text-data">Ukraine Basin</h2>
           </div>
           <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-8 h-8 rounded-full bg-galileo border-2 border-satellite flex items-center justify-center text-[10px] font-bold text-satellite">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
              <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border-2 border-satellite flex items-center justify-center text-[10px] font-bold text-data/60">
                +12
              </div>
           </div>
        </div>
      </div>

      <div className="flex-grow bg-data -mt-4 rounded-t-[2rem] p-6 z-10">
        <div className="flex items-center gap-2 mb-8">
           <Trophy size={20} className="text-galileo" />
           <h2 className="text-xl font-bold tracking-tight uppercase">Guardian Leaderboard</h2>
        </div>

        <div className="space-y-3 mb-12">
          {leaders.map((leader, idx) => (
            <motion.div
              key={leader.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-4 rounded-2xl flex items-center gap-4 tech-border transition-all ${leader.id === 2 ? 'bg-satellite text-data border-satellite' : 'bg-white shadow-sm'}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono text-sm ${idx === 0 ? 'bg-amber-400 text-amber-900 border-2 border-amber-200' : 'bg-satellite/5 text-satellite/40'}`}>
                 {idx + 1}
              </div>
              <div className="flex-grow">
                 <div className="flex items-center gap-2">
                   <p className="font-bold text-sm tracking-tight">{leader.name}</p>
                   {leader.active && <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_4px_#22c55e]" />}
                 </div>
                 <p className={`text-[10px] font-mono uppercase tracking-widest ${leader.id === 2 ? 'text-data/40' : 'text-satellite/40'}`}>Sector: {leader.region}</p>
              </div>
              <div className="text-right">
                 <p className="font-bold text-sm font-mono tracking-tighter">{leader.score.toLocaleString()}</p>
                 <p className={`text-[10px] font-mono uppercase ${leader.id === 2 ? 'text-data/40' : 'text-satellite/40'}`}>Impact Rating</p>
              </div>
            </motion.div>
          ))}
        </div>

        <section className="bg-white rounded-3xl p-6 tech-border shadow-sm mb-24 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5">
              <Users size={64} />
           </div>
           <div className="flex items-center gap-3 mb-4">
              <Users size={20} className="text-galileo" />
              <h3 className="font-bold tracking-tight">Basin Coverage Reach</h3>
           </div>
           <p className="text-sm text-satellite/60 mb-6 leading-relaxed font-medium">
             Together with 1,240 other volunteers, we have flagged 84 potential pollution zones this month. Data verified by 12 regional patrol units. 
           </p>
           <button className="w-full h-12 bg-galileo text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-galileo/20 active:translate-y-1 transition-all uppercase tracking-widest">
             Join Regional Patrol
           </button>
        </section>
      </div>

      {/* Floating Action Hint */}
      <div className="fixed bottom-24 right-6 pointer-events-none md:bottom-8 md:right-8">
         <motion.div 
           animate={{ y: [0, -10, 0] }}
           transition={{ duration: 4, repeat: Infinity }}
           className="bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white flex items-center gap-3"
         >
            <div className="w-8 h-8 bg-satellite rounded-full flex items-center justify-center text-data">
               <Globe size={16} />
            </div>
            <div className="pr-4">
               <p className="text-[10px] font-mono text-satellite/40 uppercase">New Hub</p>
               <p className="text-xs font-bold">Lviv-Poltava Link Active</p>
            </div>
         </motion.div>
      </div>
    </div>
  );
}
