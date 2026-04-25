import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Zap, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Scan() {
  const [accuracy, setAccuracy] = useState(15.4);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' },
          audio: false 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access denied", err);
      }
    };

    startCamera();

    const interval = setInterval(() => {
      setAccuracy(prev => {
        const next = Math.max(1.2, prev - (Math.random() * 2));
        return parseFloat(next.toFixed(1));
      });
    }, 1500);

    return () => {
      clearInterval(interval);
      if (videoRef.current) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (accuracy > 5) return;
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        localStorage.setItem('temp_photo', dataUrl);
        localStorage.setItem('temp_coords', JSON.stringify({ lat: 50.4501, lng: 30.5234, accuracy }));
        navigate('/report');
      }
    } else {
      localStorage.setItem('temp_photo', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800');
      localStorage.setItem('temp_coords', JSON.stringify({ lat: 50.4501, lng: 30.5234, accuracy: 2.1 }));
      navigate('/report');
    }
  };

  return (
    <div className="fixed inset-0 z-[101] bg-black flex flex-col">
      <div className="flex-grow camera-container overflow-hidden relative">
         <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
         <canvas ref={canvasRef} className="hidden" />
         
         <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
            <div className="flex justify-between items-start pointer-events-auto">
              <button 
                onClick={() => navigate('/home')} 
                className="w-12 h-12 bg-black/40 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white border border-white/10"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl flex items-center gap-2 border border-white/10">
                 <div className={`w-2 h-2 rounded-full ${accuracy < 5 ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-amber-400'}`} />
                 <span className="text-white font-mono text-sm font-bold">{accuracy}m Precision</span>
              </div>
            </div>

            <div className="flex flex-col items-center pointer-events-auto">
               <button 
                 onClick={capturePhoto}
                 disabled={accuracy > 5}
                 className={`w-20 h-20 rounded-3xl border-4 flex items-center justify-center transition-all shadow-2xl mb-12 ${accuracy < 5 ? 'border-white/50 bg-white/20' : 'border-white/10 bg-white/5 opacity-40 cursor-not-allowed'}`}
               >
                  <div className={`w-14 h-14 rounded-2xl transition-all ${accuracy < 5 ? 'bg-white' : 'bg-white/10'}`} />
               </button>
               <p className="text-white/60 font-mono text-[10px] uppercase font-bold tracking-widest bg-black/20 backdrop-blur-md px-4 py-2 rounded-full mb-8">
                 {accuracy < 5 ? 'Lock verified. Stable.' : 'Calculating distance...'}
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
