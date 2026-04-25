import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Camera, Droplets, ChevronRight, Globe, Github } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    title: "See Pollution?",
    desc: "Use your phone as a high-precision environmental sensor. Every photo counts.",
    icon: Droplets,
    color: "bg-galileo"
  },
  {
    title: "Capture the Evidence",
    desc: "Our Galileo-powered radar ensures your reports are verified by satellite intelligence.",
    icon: Camera,
    color: "bg-signal"
  },
  {
    title: "Save the Waterway",
    desc: "Direct communication with environmental inspectors. Real data, real impact.",
    icon: Shield,
    color: "bg-satellite"
  }
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      setShowAuth(true);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('onboarding_complete', 'true');
    localStorage.setItem('auth_token', 'mock_token');
    onComplete();
    navigate('/home');
  };

  return (
    <div className="fixed inset-0 bg-[#F8FAFB] z-[100] flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {!showAuth ? (
          <motion.div
            key="slides"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex-grow flex flex-col"
          >
            <div className="flex-grow flex flex-col justify-center items-center p-8 text-center max-w-md mx-auto">
              <motion.div
                key={currentSlide}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`w-32 h-32 ${slides[currentSlide].color} rounded-[2rem] flex items-center justify-center mb-10 shadow-2xl shadow-satellite/20 relative`}
              >
                <div className="absolute inset-0 bg-white/10 rounded-[2rem] animate-pulse" />
                {(() => {
                  const Icon = slides[currentSlide].icon;
                  return <Icon size={56} className="text-white relative z-10" />;
                })()}
              </motion.div>
              
              <motion.h1
                key={`t-${currentSlide}`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-3xl font-bold text-satellite mb-4 tracking-tight"
              >
                {slides[currentSlide].title}
              </motion.h1>
              
              <motion.p
                key={`p-${currentSlide}`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 0.6 }}
                className="text-base text-satellite/80 px-4 leading-relaxed"
              >
                {slides[currentSlide].desc}
              </motion.p>
            </div>

            <div className="p-8 pb-12 flex flex-col items-center">
              <div className="flex gap-1.5 mb-10">
                {slides.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 transition-all duration-500 rounded-full ${i === currentSlide ? 'w-8 bg-satellite' : 'w-1.5 bg-satellite/10'}`} 
                  />
                ))}
              </div>
              
              <button
                onClick={nextSlide}
                className="w-full max-w-sm h-16 bg-satellite text-white font-bold rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-satellite/20"
              >
                <span className="tracking-widest uppercase text-xs">
                  {currentSlide === slides.length - 1 ? "Initialize" : "Continue"}
                </span>
                <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-grow flex flex-col"
          >
            <div className="p-8 pt-20 flex-grow">
               <div className="mb-12">
                  <div className="w-16 h-16 bg-galileo rounded-2xl flex items-center justify-center text-white shadow-lg mb-6">
                    <Globe size={32} />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2">AquaSync</h1>
                  <p className="text-satellite/40 text-sm font-medium">Join the global network of water guardians.</p>
               </div>

               <div className="space-y-4">
                  <button onClick={handleFinish} className="w-full flex items-center gap-4 bg-white p-5 rounded-2xl border border-satellite/5 shadow-sm hover:shadow-md active:scale-98 transition-all group">
                     <div className="w-10 h-10 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all">
                       <svg className="w-6 h-6" viewBox="0 0 24 24">
                         <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                         <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                         <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                         <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                       </svg>
                     </div>
                     <span className="font-bold text-satellite text-sm">Google</span>
                  </button>

                  <button onClick={handleFinish} className="w-full flex items-center gap-4 bg-satellite p-5 rounded-2xl shadow-xl shadow-satellite/20 active:scale-98 transition-all">
                     <div className="w-10 h-10 flex items-center justify-center text-white">
                        <Github size={24} />
                     </div>
                     <span className="font-bold text-white text-sm">GitHub</span>
                  </button>
               </div>
            </div>

            <div className="p-8 pb-12">
               <button 
                 onClick={handleFinish}
                 className="w-full p-4 rounded-xl text-satellite/40 text-[10px] uppercase font-bold tracking-widest hover:text-satellite transition-all"
               >
                 Continue Anonymously
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
