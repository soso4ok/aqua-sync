import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { ReportStatus } from '../types';

const MOCK_REPORTS: ReportStatus[] = [
  { 
    id: '1', category: 'Algal Bloom', date: '2026-04-24', status: 'Verified', 
    description: 'Significant green coloration near the public beach area. Water seems opaque. Local wind speed was low, allowing the bloom to accumulate in surface layers.',
    coordinates: { lat: 54.438, lng: 18.575 },
    imageUrl: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&q=80&w=800'
  },
  { 
    id: '2', category: 'Marine Debris', date: '2026-04-20', status: 'Pending',
    description: 'Floating plastics and net fragments caught in the reeds. Appears to be drifting from the harbor direction after the heavy rainfall.',
    coordinates: { lat: 54.398, lng: 18.655 },
    imageUrl: 'https://images.unsplash.com/photo-1618477430045-8f6a9179979b?auto=format&fit=crop&q=80&w=800'
  },
  { 
    id: '3', category: 'Oil Leak', date: '2026-04-15', status: 'Verified',
    description: 'Visible rainbow sheen on the surface near the industrial dock. Originating from suspected tank discharge.',
    coordinates: { lat: 54.410, lng: 18.600 },
    imageUrl: 'https://images.unsplash.com/photo-15426019069d0-b4d9235e6171?auto=format&fit=crop&q=80&w=800'
  }
];

export default function DetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const report = MOCK_REPORTS.find(r => r.id === id);

  if (!report) return <div>Report not found</div>;

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
          <MapContainer center={[report.coordinates.lat, report.coordinates.lng]} zoom={15} className="h-full w-full grayscale" zoomControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            <Marker position={[report.coordinates.lat, report.coordinates.lng]} />
          </MapContainer>
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-satellite-blue/10 shadow-lg flex items-center gap-2">
             <MapPin className="w-3.5 h-3.5 text-galileo-teal" />
             <span className="text-[10px] font-mono font-bold text-satellite-blue">
                {report.coordinates.lat.toFixed(4)}, {report.coordinates.lng.toFixed(4)}
             </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 pb-32">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1.5 rounded-full bg-satellite-blue/5 text-satellite-blue text-[10px] font-mono font-bold uppercase tracking-widest italic border border-satellite-blue/10">
                {report.category}
              </span>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-mono text-satellite-blue/30 uppercase tracking-tighter">Reported on</span>
                  <span className="text-[11px] font-bold text-satellite-blue">{report.date}</span>
                </div>
              </div>
            </div>

            <div className="aspect-video rounded-[2rem] overflow-hidden border border-satellite-blue/5 shadow-inner">
               <img src={report.imageUrl} className="w-full h-full object-cover" alt="" />
            </div>
            
            <div className="p-6 rounded-[2rem] bg-white border border-satellite-blue/5 space-y-4">
              <h4 className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-satellite-blue/30">
                <Info className="w-3 h-3" />
                Report Analysis
              </h4>
              <p className="text-sm text-satellite-blue/70 leading-relaxed font-medium">
                {report.description}
              </p>
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
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${report.status === 'Verified' ? 'bg-galileo-teal/10 text-galileo-teal' : 'bg-amber-50 text-amber-500'}`}>
                  {report.status === 'Verified' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-satellite-blue">Ground-Truth Audit</p>
                  <p className="text-[10px] text-satellite-blue/40">Manual review by command specialists.</p>
                </div>
                <div className={`text-[10px] font-mono font-bold uppercase ${report.status === 'Verified' ? 'text-green-500' : 'text-amber-500'}`}>
                   {report.status === 'Verified' ? 'Approved' : 'Queued'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
