import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CheckCircle2, Clock, Info, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { BackendReport, MOCK_REPORTS } from '../mockData';
export default function DetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<BackendReport | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const parsedId = parseInt(id || '', 10);
      const found = MOCK_REPORTS.find(r => r.id === parsedId);
      
      if (found) {
        setReport(found);
      } else {
        setReport(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full bg-data-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-satellite-blue/20" />
      </div>
    );
  }

  if (!report) return <div className="p-10 text-center font-mono uppercase text-xs text-signal-coral">Report not found</div>;

  const isVerified = report.trust_level !== 'evidence_void';

  return (
    <div className="h-full bg-data-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white p-6 pt-12 flex items-center justify-between border-b border-satellite-blue/5">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-data-white flex items-center justify-center text-satellite-blue active:scale-90 transition-transform"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg tracking-tight">Detailed History</h2>
        <div className="w-10 h-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Map Area */}
        <div className="h-64 relative bg-gray-200 border-b border-satellite-blue/10">
          <MapContainer center={[report.latitude, report.longitude]} zoom={15} className="h-full w-full grayscale" zoomControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            <Marker position={[report.latitude, report.longitude]} />
          </MapContainer>
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-satellite-blue/10 shadow-lg flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-galileo-teal" />
            <span className="text-[10px] font-mono font-bold text-satellite-blue">
              {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 pb-32">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1.5 rounded-full bg-satellite-blue/5 text-satellite-blue text-[10px] font-mono font-bold uppercase tracking-widest italic border border-satellite-blue/10">
                {report.pollution_type.replace('_', ' ')}
              </span>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-mono text-satellite-blue/30 uppercase tracking-tighter">Reported on</span>
                <span className="text-[11px] font-bold text-satellite-blue">{new Date(report.submitted_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="aspect-video rounded-[2rem] overflow-hidden border border-satellite-blue/5 shadow-inner bg-data-white">
              {photoUrl ? (
                <img src={photoUrl} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Info className="w-8 h-8 text-satellite-blue/5" />
                </div>
              )}
            </div>

            <div className="p-6 rounded-[2rem] bg-white border border-satellite-blue/5 space-y-4">
              <h4 className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-satellite-blue/30">
                <Info className="w-3 h-3" />
                Report Analysis
              </h4>
              <p className="text-sm text-satellite-blue/70 leading-relaxed font-medium">
                {report.description || "No description provided."}
              </p>
              {report.ai_verdict && (
                <div className="mt-4 p-4 rounded-xl bg-galileo-teal/5 border border-galileo-teal/10">
                  <p className="text-[10px] font-mono text-galileo-teal/60 uppercase font-bold mb-1">AI Verdict</p>
                  <p className="text-[11px] text-galileo-teal leading-tight">{report.ai_verdict}</p>
                </div>
              )}
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-satellite-blue/30 px-2">Validation Chain</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-5 rounded-3xl bg-white border border-satellite-blue/5">
                <div className="w-10 h-10 rounded-xl bg-galileo-teal/10 flex items-center justify-center text-galileo-teal">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-satellite-blue">Satellite Reconcilement</p>
                  <p className="text-[10px] text-satellite-blue/40">Verified against Sentinel-2 spectral indices.</p>
                </div>
                <div className="text-[10px] font-mono text-green-500 font-bold uppercase">Passed</div>
              </div>

              <div className="flex items-center gap-4 p-5 rounded-3xl bg-white border border-satellite-blue/5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isVerified ? 'bg-galileo-teal/10 text-galileo-teal' : 'bg-amber-50 text-amber-500'}`}>
                  {isVerified ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-satellite-blue">Ground-Truth Audit</p>
                  <p className="text-[10px] text-satellite-blue/40">Manual review by command specialists.</p>
                </div>
                <div className={`text-[10px] font-mono font-bold uppercase ${isVerified ? 'text-green-500' : 'text-amber-500'}`}>
                  {isVerified ? 'Approved' : 'Queued'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
