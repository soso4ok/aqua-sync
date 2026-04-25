import { useState, FormEvent } from 'react';
import { Waves, Zap, Globe, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen bg-satellite-blue flex flex-col md:flex-row relative overflow-hidden">
      {/* Background Decals */}
      <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
         <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] border border-white rounded-full"></div>
         <div className="absolute top-[-15%] right-[-15%] w-[70%] h-[70%] border border-white/50 rounded-full"></div>
         <div className="absolute bottom-[-20%] left-[-20%] w-[80%] h-[80%] border border-galileo-teal/30 rounded-full"></div>
      </div>

      <div className="flex-1 p-8 md:p-24 flex flex-col justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-galileo-teal p-3 rounded-xl shadow-lg">
            <Waves className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-3xl tracking-tight leading-none uppercase">AquaSync</h1>
            <p className="text-galileo-teal font-mono text-[10px] tracking-[0.4em] mt-1">Satellite Ground Hybrid</p>
          </div>
        </div>

        <div>
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9]"
          >
            THE SPACE-TO-CITIZEN <br />
            <span className="text-galileo-teal font-light uppercase italic">FEEDBACK LOOP.</span>
          </motion.h2>
          <p className="text-white/60 text-lg md:text-xl mt-8 max-w-lg leading-relaxed">
            Revolutionizing water monitoring by fusing Copernicus satellite telemetry 
            with hyper-precise Galileo-verified ground truth.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 max-w-md">
           <div className="space-y-2">
              <div className="flex items-center gap-2 text-galileo-teal">
                 <Globe className="w-4 h-4" />
                 <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Sentinel-2 Ingest</span>
              </div>
              <p className="text-white/40 text-[10px] leading-tight">Daily automated multispectral imagery analysis for 12 indices.</p>
           </div>
           <div className="space-y-2">
              <div className="flex items-center gap-2 text-galileo-teal">
                 <ShieldCheck className="w-4 h-4" />
                 <span className="text-[10px] font-mono uppercase tracking-widest font-bold">GNSS Anti-Fraud</span>
              </div>
              <p className="text-white/40 text-[10px] leading-tight">Strict reliance on Galileo metadata for location verification.</p>
           </div>
        </div>
      </div>

      <div className="flex-1 bg-data-white flex items-center justify-center p-8 md:p-24 relative overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="mb-12">
            <h3 className="text-3xl font-bold tracking-tight text-satellite-blue">Terminal Entry</h3>
            <p className="text-satellite-blue/50 text-sm mt-2">Authorized analyst access only.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-widest text-satellite-blue/40 font-bold ml-1">Personnel ID (Email)</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-white border border-satellite-blue/10 rounded-2xl focus:border-galileo-teal focus:ring-4 focus:ring-galileo-teal/10 outline-none transition-all text-satellite-blue font-medium"
                placeholder="analyst@aquasync.io"
              />
            </div>

            <div className="space-y-1 text-right">
              <label className="text-[10px] font-mono uppercase tracking-widest text-satellite-blue/40 font-bold ml-1 text-left block">Access Cipher (Password)</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-white border border-satellite-blue/10 rounded-2xl focus:border-galileo-teal focus:ring-4 focus:ring-galileo-teal/10 outline-none transition-all text-satellite-blue font-medium"
                placeholder="••••••••"
              />
              <button type="button" className="text-[10px] font-mono uppercase text-galileo-teal mt-2 hover:underline">Forgot Cipher?</button>
            </div>

            <button
              type="submit"
              className="w-full bg-satellite-blue text-white py-5 rounded-2xl font-bold uppercase tracking-[0.2em] shadow-xl hover:bg-galileo-teal hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              Initialize Node <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-satellite-blue/5">
             <p className="text-[10px] font-mono text-center text-satellite-blue/30 leading-normal uppercase italic">
                Encryption Standard: AES-256 <br />
                Node Status: Secured & Calibrated
             </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
