import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Droplets, Mail, Lock, ArrowRight, Loader2, UserPlus, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function LoginView() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-satellite-blue flex flex-col items-center justify-center p-6 overflow-hidden relative">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-galileo-teal/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] bg-signal-coral/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
            className="w-20 h-20 bg-galileo-teal/20 backdrop-blur-xl rounded-[28px] flex items-center justify-center mb-5 border border-white/10 shadow-2xl shadow-galileo-teal/20"
          >
            <Droplets className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-1 font-sans">
            AQUA<span className="text-galileo-teal">SYNC</span>
          </h1>
          <p className="text-white/30 text-[10px] font-mono uppercase tracking-[0.3em]">
            Citizen Sensor Network
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 shadow-2xl">
          {/* Mode Toggle */}
          <div className="flex bg-white/[0.05] rounded-2xl p-1 mb-7 border border-white/5">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(null); }}
              className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                !isRegister
                  ? 'bg-white text-satellite-blue shadow-md'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Login
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(null); }}
              className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                isRegister
                  ? 'bg-white text-satellite-blue shadow-md'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-galileo-teal transition-colors">
                <Mail className="w-4.5 h-4.5" />
              </div>
              <input
                id="login-email"
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 outline-none focus:border-galileo-teal/50 focus:bg-white/[0.08] transition-all text-sm"
              />
            </div>

            {/* Password */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-galileo-teal transition-colors">
                <Lock className="w-4.5 h-4.5" />
              </div>
              <input
                id="login-password"
                type="password"
                required
                minLength={8}
                placeholder={isRegister ? 'Password (min 8 chars)' : 'Password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 outline-none focus:border-galileo-teal/50 focus:bg-white/[0.08] transition-all text-sm"
              />
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-signal-coral/10 border border-signal-coral/20 rounded-xl p-3 flex items-center gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-signal-coral shrink-0" />
                  <p className="text-signal-coral text-xs font-semibold">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-galileo-teal hover:bg-galileo-teal/90 disabled:opacity-50 text-white rounded-2xl py-4 font-bold text-xs uppercase tracking-widest shadow-lg shadow-galileo-teal/20 transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isRegister ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-white/15 text-[9px] font-mono uppercase tracking-[0.2em] mt-8">
          Space-to-Citizen · Water Quality Monitoring
        </p>
      </motion.div>
    </div>
  );
}
