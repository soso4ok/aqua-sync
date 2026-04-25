import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Zap, Info, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type GnssInfo = {
  accuracy: number | null;
  lat: number | null;
  lng: number | null;
  error: string | null;
};

export default function Home() {
  const [gnss, setGnss] = useState<GnssInfo>({ accuracy: null, lat: null, lng: null, error: null });
  const navigate = useNavigate();

  useEffect(() => {
    if (!navigator.geolocation) {
      setGnss(s => ({ ...s, error: 'Geolocation not supported' }));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        console.log('[GNSS]', {
          lat: latitude.toFixed(6),
          lng: longitude.toFixed(6),
          accuracy_m: accuracy.toFixed(1),
          highAccuracy: accuracy < 5,
          note: 'Constellation (GPS/Galileo/GLONASS) decided by OS/chip — not exposed by browser API',
        });
        setGnss({ accuracy: parseFloat(accuracy.toFixed(1)), lat: latitude, lng: longitude, error: null });
      },
      (err) => { console.warn('[GNSS] error:', err.message); setGnss(s => ({ ...s, error: err.message })); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const { accuracy, lat, lng } = gnss;

  return (
    <div className="relative min-h-screen bg-[#F8FAFB]">
      {/* Top Navigation - Fintech Style */}
      <div className="p-6 pb-20 bg-satellite">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4 text-white/80">
            <Info size={20} />
            <Zap size={20} className="text-signal" />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-white/60 text-xs font-mono uppercase tracking-widest">Active Basin Sync</p>
          <div className="flex items-baseline gap-2">
            <h1 className="text-4xl font-bold text-white tracking-tight">Sentinel-2B</h1>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_#4ade80]" />
          </div>
          <p className="text-white/40 text-[10px] font-mono">Sync level: 98% • Galileo Active</p>
        </div>
      </div>

      {/* Main Content Areas */}
      <div className="px-6 pb-48 -mt-10">
        {/* Quick Match - Now in flow */}
        <div className="bg-white rounded-3xl p-6 shadow-smooth border border-satellite/5 flex justify-between items-center mb-10">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-galileo/10 rounded-2xl flex items-center justify-center text-galileo">
                 <Zap size={24} />
              </div>
              <div>
                 <h3 className="font-bold text-satellite">Quick Match</h3>
                 <p className="text-xs text-satellite/40">3 High-Priority Anomalies</p>
              </div>
           </div>
           <button 
             onClick={() => navigate('/scan')}
             className="bg-galileo text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-lg shadow-galileo/20 hover:scale-105 active:scale-95 transition-all"
           >
             Scan Now
           </button>
        </div>

        <h2 className="text-sm font-bold text-satellite/40 uppercase tracking-widest mb-6">Environment Ops</h2>
        
        <div className="grid grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Map', icon: Info, color: 'bg-indigo-50 text-indigo-500' },
            { label: 'Alerts', icon: ShieldAlert, color: 'bg-red-50 text-red-500' },
            { label: 'Log', icon: CheckCircle2, color: 'bg-green-50 text-green-500' },
            { label: 'Hub', icon: Zap, color: 'bg-amber-50 text-amber-500' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2 group">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform cursor-pointer`}>
                <item.icon size={24} />
              </div>
              <span className="text-[10px] font-bold text-satellite/60 tracking-tight uppercase">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Feature Banner */}
        <div className="bg-[#EEF2FF] rounded-3xl p-6 mb-10 relative overflow-hidden group border border-indigo-100 shadow-sm shadow-indigo-100/50">
           <div className="relative z-10 pr-20">
              <h3 className="text-lg font-bold text-indigo-900 mb-1">Galileo Precision</h3>
              <p className="text-xs text-indigo-800/60 leading-relaxed">
                Unlock "EcoGuard" status by providing 10 verified high-precision reports.
              </p>
              <button className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-md">
                View Path
              </button>
           </div>
           <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 opacity-20 transform rotate-12 group-hover:rotate-0 transition-transform">
              <Zap size={100} className="text-indigo-600" />
           </div>
        </div>

        {/* GNSS Debug Panel */}
        <div className="card-smooth p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-satellite">Verification Precision</h3>
            <span className={`text-xs font-mono font-bold px-2 py-1 rounded-lg ${
              accuracy === null ? 'bg-satellite/10 text-satellite/40' :
              accuracy < 5 ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
            }`}>
              {accuracy === null ? 'ACQUIRING' : accuracy < 5 ? 'LOCK VERIFIED' : 'CALIBRATING'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center ${accuracy === null ? 'border-satellite/10 animate-pulse' : accuracy < 5 ? 'border-green-400/40' : 'border-galileo/20'}`}>
                <div className="w-8 h-8 rounded-full border border-current opacity-40" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold text-galileo">
                {accuracy !== null ? `${accuracy}m` : '—'}
              </div>
            </div>
            <div className="grow">
              <div className="flex justify-between text-[10px] font-bold text-satellite/40 mb-2 uppercase">
                <span>GNSS Signal</span>
                <span>{accuracy !== null ? `${Math.round(Math.min(100, (1 / accuracy) * 500))}%` : '—'}</span>
              </div>
              <div className="w-full h-1.5 bg-data rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: accuracy !== null ? `${Math.min(100, (1 / accuracy) * 500)}%` : '0%' }}
                  className={`h-full transition-colors ${accuracy !== null && accuracy < 5 ? 'bg-green-400' : 'bg-signal'}`}
                />
              </div>
            </div>
          </div>

          {/* Coordinates row */}
          <div className="bg-satellite/5 rounded-2xl px-4 py-3 font-mono text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-satellite/40 uppercase tracking-widest">Lat</span>
              <span className="text-satellite font-bold">{lat !== null ? lat.toFixed(6) + '°' : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-satellite/40 uppercase tracking-widest">Lng</span>
              <span className="text-satellite font-bold">{lng !== null ? lng.toFixed(6) + '°' : '—'}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-satellite/10">
              <span className="text-satellite/40 uppercase tracking-widest">Constellation</span>
              <span className="text-satellite/60">GPS / Galileo / GLONASS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-satellite/40 uppercase tracking-widest">Selection</span>
              <span className="text-satellite/60">OS / chip (not exposed)</span>
            </div>
          </div>

          {gnss.error && (
            <p className="text-[11px] text-red-500 font-mono">{gnss.error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
