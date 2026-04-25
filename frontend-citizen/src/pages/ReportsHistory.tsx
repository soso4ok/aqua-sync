import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, AlertCircle, CheckCircle2, Clock, MapPin, ChevronRight, Share2 } from 'lucide-react';

interface Report {
  id: number;
  photo: string;
  coords: { lat: number; lng: number };
  tags: string[];
  comment: string;
  timestamp: string;
  status: 'processing' | 'verified' | 'alert' | 'resolved';
  aiAnalysis?: {
    severity: 'Low' | 'Medium' | 'High';
    systemInsight: string;
  };
}

const statusConfig = {
  processing: { label: 'In Processing', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
  verified: { label: 'Verified', icon: CheckCircle2, color: 'text-galileo', bg: 'bg-galileo/10' },
  alert: { label: 'Satellite Match!', icon: AlertCircle, color: 'text-signal', bg: 'bg-signal/10' },
  resolved: { label: 'Issue Resolved', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
};

export default function ReportsHistory() {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    fetch('/api/reports')
      .then(res => res.json())
      .then(data => setReports(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="flex flex-col min-h-screen p-6 pb-48">
      <h1 className="text-3xl font-bold mb-6">Mission Log</h1>
      
      {/* Search & Filter */}
      <div className="flex gap-3 mb-8">
        <div className="flex-grow relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-satellite/30" />
          <input 
            type="text" 
            placeholder="Search logs..." 
            className="w-full bg-white pl-11 pr-4 py-3 rounded-2xl border border-satellite/5 focus:border-galileo focus:outline-none text-sm"
          />
        </div>
        <button className="bg-white p-3 rounded-2xl border border-satellite/5 text-satellite/60">
           <Filter size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {reports.map((report, idx) => {
          const config = statusConfig[report.status];
          const StatusIcon = config.icon;
          
          return (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-3xl border border-satellite/5 shadow-sm overflow-hidden"
            >
              <div className="p-4 flex gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                   <img src={report.photo} className="w-full h-full object-cover" alt="Log" />
                </div>
                <div className="flex-grow min-w-0">
                   <div className="flex justify-between items-start mb-1">
                      <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${config.bg} ${config.color} flex items-center gap-1`}>
                        <StatusIcon size={10} /> {config.label}
                      </div>
                      <span className="text-[10px] font-mono text-satellite/30 italic">
                        {new Date(report.timestamp).toLocaleDateString()}
                      </span>
                   </div>
                   <h3 className="font-bold text-sm truncate">{report.tags.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' • ')}</h3>
                   <p className="text-xs text-satellite/60 line-clamp-1 mt-1">{report.comment}</p>
                   
                   {report.aiAnalysis && (
                     <div className="mt-3 p-3 bg-data rounded-xl border border-satellite/5">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-mono uppercase text-satellite/40">AI Severity</span>
                          <span className={`text-[9px] font-bold uppercase ${report.aiAnalysis.severity === 'High' ? 'text-signal' : 'text-galileo'}`}>
                            {report.aiAnalysis.severity}
                          </span>
                        </div>
                        <p className="text-[10px] italic text-satellite/80 leading-tight">
                          "{report.aiAnalysis.systemInsight}"
                        </p>
                     </div>
                   )}

                   <div className="flex items-center gap-2 mt-2 text-[10px] text-satellite/40">
                      <MapPin size={10} />
                      <span className="font-mono">{report.coords.lat.toFixed(4)}°, {report.coords.lng.toFixed(4)}°</span>
                   </div>
                </div>
                <div className="flex flex-col justify-between py-1">
                   <button className="text-satellite/20 hover:text-galileo transition-colors"><Share2 size={16} /></button>
                   <button className="text-satellite/40"><ChevronRight size={20} /></button>
                </div>
              </div>

              {report.status === 'alert' && (
                <div className="bg-signal/5 px-4 py-2 flex items-center justify-between border-t border-signal/10">
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-signal rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold text-signal uppercase tracking-wider">Satellite Confirmation Pending</span>
                   </div>
                   <button className="text-[9px] font-bold text-signal underline underline-offset-2">View Anomaly Layer</button>
                </div>
              )}
            </motion.div>
          );
        })}

        {reports.length === 0 && (
          <div className="text-center py-12">
            <p className="text-satellite/30 italic">No missions logged yet. Scan the water to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
