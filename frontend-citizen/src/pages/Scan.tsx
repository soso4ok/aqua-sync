import { useState, useRef, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type GnssState = {
  accuracy: number | null;
  lat: number | null;
  lng: number | null;
  error: string | null;
  watching: boolean;
};

export default function Scan() {
  const [gnss, setGnss] = useState<GnssState>({
    accuracy: null, lat: null, lng: null, error: null, watching: false,
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  // Start camera
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
      .catch(() => {});

    return () => {
      if (videoRef.current) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream?.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Watch real GPS — browser picks best available (Galileo/GPS/network)
  useEffect(() => {
    if (!navigator.geolocation) {
      setGnss(s => ({ ...s, error: 'Geolocation not supported' }));
      return;
    }

    setGnss((s: GnssState) => ({ ...s, watching: true }));
    const watchId = navigator.geolocation.watchPosition(
      (pos: GeolocationPosition) => {
        setGnss({
          accuracy: pos.coords.accuracy,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          error: null,
          watching: true,
        });
      },
      (err: GeolocationPositionError) => setGnss((s: GnssState) => ({ ...s, error: err.message, watching: false })),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const isReady = gnss.lat !== null && gnss.accuracy !== null;
  const isHighAccuracy = isReady && gnss.accuracy! < 5;

  const capturePhoto = () => {
    if (!isReady) return;

    const coords = {
      lat: gnss.lat!,
      lng: gnss.lng!,
      accuracy: gnss.accuracy!,
      is_high_accuracy: isHighAccuracy,
    };

    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        localStorage.setItem('temp_photo', canvasRef.current.toDataURL('image/jpeg'));
      }
    }

    localStorage.setItem('temp_coords', JSON.stringify(coords));
    navigate('/report');
  };

  const accuracyLabel = gnss.error
    ? gnss.error
    : gnss.accuracy === null
    ? 'Acquiring GPS...'
    : `${gnss.accuracy.toFixed(1)}m ${isHighAccuracy ? '— Lock verified' : '— Calculating...'}`;

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
              <div className={`w-2 h-2 rounded-full ${isHighAccuracy ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : gnss.accuracy !== null ? 'bg-amber-400' : 'bg-white/40 animate-pulse'}`} />
              <span className="text-white font-mono text-sm font-bold">{accuracyLabel}</span>
            </div>
          </div>

          <div className="flex flex-col items-center pointer-events-auto">
            <button
              onClick={capturePhoto}
              disabled={!isReady}
              className={`w-20 h-20 rounded-3xl border-4 flex items-center justify-center transition-all shadow-2xl mb-12 ${isReady ? 'border-white/50 bg-white/20' : 'border-white/10 bg-white/5 opacity-40 cursor-not-allowed'}`}
            >
              <div className={`w-14 h-14 rounded-2xl transition-all ${isReady ? 'bg-white' : 'bg-white/10'}`} />
            </button>
            <p className="text-white/60 font-mono text-[10px] uppercase font-bold tracking-widest bg-black/20 backdrop-blur-md px-4 py-2 rounded-full mb-8">
              {isHighAccuracy ? 'Lock verified. Stable.' : isReady ? `${gnss.accuracy!.toFixed(1)}m — accepted` : 'Acquiring position...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
