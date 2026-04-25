import { User, Shield, Target, Database, Activity, Mail, MapPin, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export default function Profile() {
  return (
    <div className="p-12 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row gap-12 items-start">
        {/* Profile Card */}
        <div className="w-full md:w-80 bg-white shadow-2xl rounded-[2.5rem] p-10 border border-satellite-blue/5 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-galileo-teal/5 rounded-full -mr-16 -mt-16"></div>
           
           <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                 <div className="w-32 h-32 rounded-full bg-galileo-teal/10 p-1 border-2 border-dashed border-galileo-teal flex items-center justify-center">
                    <User className="w-16 h-16 text-galileo-teal" />
                 </div>
                 <div className="absolute bottom-1 right-1 w-8 h-8 bg-satellite-blue rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                    <Shield className="w-4 h-4 text-white" />
                 </div>
              </div>

              <h2 className="text-2xl font-bold text-satellite-blue tracking-tight">Admin Analyst</h2>
              <p className="text-sm font-mono text-satellite-blue/40 uppercase tracking-[0.2em] mb-6">Senior Data Officer</p>
              
              <div className="w-full space-y-4 pt-6 border-t border-satellite-blue/5">
                 <div className="flex items-center gap-4 text-satellite-blue/70">
                    <Mail className="w-4 h-4 text-galileo-teal" />
                    <span className="text-sm">analyst@aquasync.io</span>
                 </div>
                 <div className="flex items-center gap-4 text-satellite-blue/70">
                    <MapPin className="w-4 h-4 text-galileo-teal" />
                    <span className="text-sm">Nordic/Baltic Command</span>
                 </div>
                 <div className="flex items-center gap-4 text-satellite-blue/70">
                    <Activity className="w-4 h-4 text-galileo-teal" />
                    <span className="text-sm">Active Session: 4h 12m</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="flex-1 space-y-8">
           <div>
              <h3 className="text-3xl font-bold tracking-tighter text-satellite-blue mb-2">Performance Telemetry</h3>
              <p className="text-satellite-blue/50">Your operational impact within the AquaSync ecosystem.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Reports Reconciled', value: '1,284', icon: Database, color: 'satellite-blue', bg: 'bg-satellite-blue/10', text: 'text-satellite-blue' },
                { label: 'Verification Accuracy', value: '99.2%', icon: Target, color: 'galileo-teal', bg: 'bg-galileo-teal/10', text: 'text-galileo-teal' },
                { label: 'Anomaly Intersections', value: '452', icon: Zap, color: 'signal-coral', bg: 'bg-signal-coral/10', text: 'text-signal-coral' },
                { label: 'Network Reputation', value: '98/100', icon: Activity, color: 'satellite-blue', bg: 'bg-satellite-blue/10', text: 'text-satellite-blue' },
              ].map((stat, i) => (
                <motion.div 
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-8 rounded-[2rem] border border-satellite-blue/5 hover:shadow-xl transition-shadow group cursor-default"
                >
                   <div className="flex justify-between items-start mb-4">
                      <div className={`p-4 rounded-2xl ${stat.bg} transition-transform group-hover:scale-110`}>
                        <stat.icon className={`w-6 h-6 ${stat.text}`} />
                      </div>
                   </div>
                   <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-satellite-blue/40 font-bold">{stat.label}</p>
                   <h4 className="text-4xl font-bold text-satellite-blue mt-1 tracking-tighter">{stat.value}</h4>
                </motion.div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
