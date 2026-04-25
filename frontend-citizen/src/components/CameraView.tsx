import { useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useNavigate } from 'react-router-dom';

const videoConstraints = {
  facingMode: "environment"
};

export default function CameraView() {
  const webcamRef = useRef<Webcam>(null);
  const navigate = useNavigate();

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      navigate('/confirm', { state: { imgSrc: imageSrc } });
    }
  }, [webcamRef, navigate]);

  // Listen for capture event from MobileLayout
  useEffect(() => {
    const handleTriggerCapture = () => {
      capture();
    };

    window.addEventListener('trigger-capture', handleTriggerCapture);
    return () => window.removeEventListener('trigger-capture', handleTriggerCapture);
  }, [capture]);

  return (
    <div className="relative h-full w-full bg-black overflow-hidden flex flex-col">
      <div className="flex-1 relative flex items-center justify-center">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="h-full w-full object-cover"
        />
        
        <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-white/40 rounded-3xl"></div>
        </div>
      </div>

      <div className="absolute top-8 left-0 right-0 px-8 flex justify-center items-center">
        <div className="px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 bg-black/20 backdrop-blur-sm">
           <span className="text-white text-[10px] uppercase font-mono tracking-widest opacity-60">Capture Mode</span>
        </div>
      </div>
    </div>
  );
}
