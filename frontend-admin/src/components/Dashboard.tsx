import { MapContainer, TileLayer, FeatureGroup, Polygon, Marker, Popup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { useState, useCallback, useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import {
  X,
  MapPin,
  Clock,
  Satellite,
  Shield,
  Camera,
  CalendarRange,
  Zap,
} from 'lucide-react';
import SentinelWaterLayer from './SentinelWaterLayer';

// ─── Types ──────────────────────────────────────────────
interface MonitoringZone {
  id: string;
  name: string;
  type: 'polygon' | 'rectangle';
  latlngs: L.LatLng[];
  color: string;
  notifications: boolean;
  createdAt: string;
}

interface Report {
  id: number;
  latitude: number;
  longitude: number;
  gnss_accuracy_m: number;
  is_high_accuracy: boolean;
  description: string | null;
  photo_url: string | null;
  pollution_type: string;
  trust_level: string;
  ai_verdict: string;
  submitted_at: string;
  points_awarded: number;
}

interface Alert {
  id: number;
  report_id: number;
  anomaly_id: number;
  severity: string;
  status: string;
  notes: string | null;
  created_at: string;
}

const POLLUTION_STYLES: Record<string, { bg: string; text: string; label: string; border: string }> = {
  ALGAL_BLOOM: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: 'Algal Bloom' },
  OIL_SLICK: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', label: 'Oil Slick' },
  DEBRIS: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100', label: 'Debris' },
  FOAM: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-100', label: 'Foam' },
  DISCOLORATION: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-100', label: 'Discoloration' },
};

function createReportIcon(pollutionType: string, isHighAccuracy: boolean, isAlert: boolean = false) {
  const color = isAlert ? '#FF1F5B' : '#6366F1';
  const alertPulse = isAlert ? `
    <circle cx="15" cy="15" r="8" fill="none" stroke="#FF1F5B" stroke-width="2">
      <animate attributeName="r" from="6" to="14" dur="1.2s" repeatCount="indefinite" />
      <animate attributeName="opacity" from="0.7" to="0" dur="1.2s" repeatCount="indefinite" />
    </circle>` : '';
  const shapePath = `M15 4.5 L25.5 9.75 L25.5 20.25 L15 25.5 L4.5 20.25 L4.5 9.75 Z`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">${alertPulse}<path d="${shapePath}" fill="${color}" stroke="white" stroke-width="1.5" /></svg>`;
  return L.divIcon({ html: svg, className: 'm-marker', iconSize: [30, 30], iconAnchor: [15, 15] });
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'reports' | 'alerts'>('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange] = useState(() => {
    const now = new Date();
    const from = new Date(now); from.setDate(now.getDate() - 3);
    const to = new Date(now); to.setDate(now.getDate() + 3);
    return { from: from.toISOString(), to: to.toISOString(), center: now };
  });

  const alertReportIds = new Set(alerts.map(a => a.report_id));

  useEffect(() => {
    async function fetchData() {
      try {
        const [repRes, alRes] = await Promise.all([fetch('/api/v1/reports/'), fetch('/api/v1/alerts/')]);
        if (repRes.ok) setReports(await repRes.json());
        if (alRes.ok) setAlerts(await alRes.json());
      } finally { setLoading(false); }
    }
    fetchData();
  }, []);

  return (
    <div className="flex h-full bg-[#f8fafc] overflow-hidden relative">

      {/* ── Internal Feed Sidebar ── */}
      <div className="w-[360px] border-r border-slate-100 bg-white flex flex-col z-10 shadow-sm shrink-0">
        <div className="flex border-b border-slate-50">
          <button onClick={() => setActiveTab('reports')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'reports' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>
            Live ({reports.length})
          </button>
          <button onClick={() => setActiveTab('alerts')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'alerts' ? 'text-rose-600 border-b-2 border-rose-600' : 'text-slate-400'}`}>
            Alerts ({alerts.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
          {activeTab === 'reports' && reports.map(r => (
            <button key={r.id} onClick={() => setSelectedReport(r)} className={`w-full text-left p-4 rounded-[20px] border transition-all ${selectedReport?.id === r.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white border-slate-100 hover:border-indigo-100'}`}>
              <div className="flex justify-between items-start mb-1.5">
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${selectedReport?.id === r.id ? 'bg-white/20 text-white' : POLLUTION_STYLES[r.pollution_type]?.bg + ' ' + POLLUTION_STYLES[r.pollution_type]?.text}`}>
                  {r.pollution_type}
                </span>
                {alertReportIds.has(r.id) && <Zap className={`w-3 h-3 ${selectedReport?.id === r.id ? 'text-white' : 'text-rose-500'} animate-pulse`} />}
              </div>
              <p className="text-xs font-black truncate leading-tight">{r.description || 'Verified Anomaly'}</p>
            </button>
          ))}

          {activeTab === 'alerts' && alerts.map(a => {
            const r = reports.find(rep => rep.id === a.report_id);
            return (
              <button key={a.id} onClick={() => r && setSelectedReport(r)} className="w-full text-left p-4 rounded-[20px] border border-rose-100 bg-rose-50/20 hover:bg-rose-50 transition-all flex flex-col gap-1 shadow-sm">
                <span className="text-[8px] font-black text-rose-600 bg-white border border-rose-100 px-2 py-0.5 rounded-full uppercase self-start">{a.severity} Severity</span>
                <p className="text-xs font-black text-slate-800 uppercase line-clamp-1">{r?.description || 'Spectral Anomaly'}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Map Area ── */}
      <div className="flex-1 relative h-full">
        <MapContainer center={[51.1077, 17.0385]} zoom={13} className="h-full w-full z-0" zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          <SentinelWaterLayer enabled={true} opacity={0.7} dateFrom={dateRange.from} dateTo={dateRange.to} />
          {reports.map(r => (
            <Marker key={r.id} position={[r.latitude, r.longitude]} icon={createReportIcon(r.pollution_type, r.is_high_accuracy, alertReportIds.has(r.id))} eventHandlers={{ click: () => setSelectedReport(r) }} />
          ))}
        </MapContainer>

        {/* Date Filter (Floating Small) */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur shadow-xl rounded-full px-4 py-1.5 border border-slate-100 flex items-center gap-3">
          <CalendarRange className="w-4 h-4 text-indigo-600" />
          <span className="text-[10px] font-black">{new Date(dateRange.center).toLocaleDateString()}</span>
        </div>

        {/* ─── COMPACT SIDE POPUP (RIGHT) ─────────────────── */}
        {selectedReport && (
          <div className="absolute top-4 right-4 bottom-4 w-[380px] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[32px] p-6 z-[2000] overflow-y-auto border border-slate-50 flex flex-col gap-5 animate-in slide-in-from-right-8 duration-300 ease-out custom-scrollbar">

            <div className="flex justify-between items-center">
              <div className={`px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${POLLUTION_STYLES[selectedReport.pollution_type]?.bg} ${POLLUTION_STYLES[selectedReport.pollution_type]?.text} ${POLLUTION_STYLES[selectedReport.pollution_type]?.border}`}>
                #{selectedReport.id} • {POLLUTION_STYLES[selectedReport.pollution_type]?.label}
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-[24px] overflow-hidden aspect-video bg-slate-50 border border-slate-100 shadow-inner shrink-0">
              {selectedReport.photo_url ? (
                <img src={`https://pub-628de2851ecc4ad69183874dc91ad113.r2.dev/${selectedReport.photo_url}`} className="w-full h-full object-cover" />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-200"><Camera className="w-8 h-8 mb-1" /></div>
              )}
            </div>

            <h1 className="text-xl font-black tracking-tight text-slate-800 leading-tight">
              {selectedReport.description || 'Verified Anomaly'}
            </h1>

            <div className="bg-[#f8fafc] p-4 rounded-[24px] border border-slate-50">
              <label className="text-[8px] font-black uppercase text-indigo-400 block mb-1 tracking-widest">AI Verdict</label>
              <p className="text-xs font-bold text-slate-500 italic leading-snug">
                "{selectedReport.ai_verdict}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-50/30 p-4 rounded-[20px] border border-indigo-50">
                <span className="text-[8px] font-black text-indigo-400 uppercase block mb-1 italic">Confidence</span>
                <div className="flex items-center gap-2">
                  <Shield className={`w-3.5 h-3.5 ${selectedReport.trust_level === 'HIGH' ? 'text-indigo-600' : 'text-amber-500'}`} />
                  <span className="text-xs font-black text-slate-800 uppercase">{selectedReport.trust_level}</span>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-[20px]">
                <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Precision</span>
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-slate-300" /> ±{selectedReport.gnss_accuracy_m}m
                </div>
              </div>
            </div>

            {alertReportIds.has(selectedReport.id) && (
              <div className="bg-[#FF1F5B] p-4 rounded-[24px] text-white flex items-center gap-4 shadow-xl shadow-rose-100 mt-auto">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <Satellite className="w-6 h-6" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-sm font-black uppercase tracking-tighter leading-none">Space-Confirmed</h4>
                  <p className="text-[8px] font-bold opacity-80 mt-0.5 uppercase truncate">Spectral match verified</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
