import { MapContainer, TileLayer, FeatureGroup, Polygon, Marker, Popup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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
  Coins,
  History,
  RefreshCw
} from 'lucide-react';
import SentinelWaterLayer from './SentinelWaterLayer';
import { getApiUrl } from '../apiConfig';

// ─── Types ──────────────────────────────────────────────
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
  const [refreshKey, setRefreshKey] = useState(0);

  // Use simple mode string
  const [dateRangeMode, setDateRangeMode] = useState<'day' | 'week' | 'month'>('week');
  const [isChangingRange, setIsChangingRange] = useState(false);

  // Memoize date interval to prevent infinite re-renders and fix SH API 400
  const { dateFrom, dateTo } = useMemo(() => {
    const to = new Date();
    const from = new Date();

    // Buffer search range to ensure satellite imagery is found
    // 24h -> 3 days search (Sentinel-2 passes every ~2-5 days)
    if (dateRangeMode === 'day') from.setDate(to.getDate() - 3);
    else if (dateRangeMode === 'week') from.setDate(to.getDate() - 10);
    else from.setDate(to.getDate() - 45);

    const dates = {
      dateFrom: from.toISOString().split('.')[0] + 'Z', // Strictly YYYY-MM-DDTHH:mm:ssZ
      dateTo: to.toISOString().split('.')[0] + 'Z'
    };

    console.log('Date range updated:', dateRangeMode, dates);
    return dates;
  }, [dateRangeMode]);

  const alertReportIds = new Set(alerts.map(a => a.report_id));

  const handleTimeRangeChange = (mode: 'day' | 'week' | 'month') => {
    setIsChangingRange(true);
    setDateRangeMode(mode);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setIsChangingRange(false), 1500);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [repRes, alRes] = await Promise.all([
          fetch(getApiUrl('/api/v1/reports/')),
          fetch(getApiUrl('/api/v1/alerts/'))
        ]);
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
              <div className="flex justify-between items-start mb-1.5 text-[8px] font-black uppercase opacity-60">
                <span>SENSOR ID: #{r.id}</span>
                {alertReportIds.has(r.id) && <Zap className={`w-3 h-3 ${selectedReport?.id === r.id ? 'text-white' : 'text-rose-500'} animate-pulse`} />}
              </div>
              <p className="text-xs font-black truncate leading-tight mb-1">{r.description || 'Verified Anomaly'}</p>
              <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${selectedReport?.id === r.id ? 'bg-white/20 text-white' : POLLUTION_STYLES[r.pollution_type]?.bg + ' ' + POLLUTION_STYLES[r.pollution_type]?.text}`}>
                {r.pollution_type}
              </span>
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
          <SentinelWaterLayer key={refreshKey} enabled={true} opacity={0.7} dateFrom={dateFrom} dateTo={dateTo} />
          {reports.map(r => (
            <Marker key={r.id} position={[r.latitude, r.longitude]} icon={createReportIcon(r.pollution_type, r.is_high_accuracy, alertReportIds.has(r.id))} eventHandlers={{ click: () => setSelectedReport(r) }} />
          ))}
        </MapContainer>

        {/* ─── PRESET RANGE PICKER ─── */}
        <div className="none top-6 left-1/2 -translate-x-1/2 z-[1000]">
          <div className={`bg-white/95 backdrop-blur shadow-2xl rounded-2xl px-2 py-2 border border-slate-100 flex items-center transition-all ${isChangingRange ? 'ring-4 ring-indigo-300' : ''}`}>
            <div className="flex items-center gap-2 pl-3 pr-4 border-r border-slate-50">
              <History className={`w-4 h-4 ${isChangingRange ? 'text-indigo-600 animate-spin' : 'text-indigo-500'}`} />
              <span className="text-[9px] font-black uppercase text-slate-400">Satellite Time Range</span>
            </div>

            <div className="flex items-center gap-1.5 px-2">
              <button onClick={() => handleTimeRangeChange('day')} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${dateRangeMode === 'day' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
                3 Days
              </button>
              <button onClick={() => handleTimeRangeChange('week')} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${dateRangeMode === 'week' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
                10 Days
              </button>
              <button onClick={() => handleTimeRangeChange('month')} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${dateRangeMode === 'month' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
                45 Days
              </button>
            </div>

            <button
              onClick={() => {
                setIsChangingRange(true);
                setRefreshKey(prev => prev + 1);
                setTimeout(() => setIsChangingRange(false), 1500);
              }}
              className="ml-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 transition-all border-l border-slate-50 pl-4"
              title="Refresh satellite data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChangingRange ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="mt-2 text-center text-[8px] font-mono text-slate-600 bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 border border-indigo-100 shadow-sm">
            <span className="text-indigo-600 font-black">FROM:</span> {new Date(dateFrom).toLocaleDateString('en-GB')}
            <span className="mx-2 text-slate-300">→</span>
            <span className="text-indigo-600 font-black">TO:</span> {new Date(dateTo).toLocaleDateString('en-GB')}
            {isChangingRange && <span className="ml-2 text-indigo-500 animate-pulse">● REFRESHING</span>}
          </div>
        </div>

        {/* ─── SIDE POPUP (RIGHT) ─── */}
        {selectedReport && (
          <div className="absolute top-4 right-4 bottom-4 w-[380px] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[32px] p-6 z-[2000] overflow-y-auto border border-slate-50 flex flex-col gap-6 animate-in slide-in-from-right-8 duration-300 ease-out custom-scrollbar">

            <div className="flex justify-between items-center">
              <div className={`px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${POLLUTION_STYLES[selectedReport.pollution_type]?.bg} ${POLLUTION_STYLES[selectedReport.pollution_type]?.text} ${POLLUTION_STYLES[selectedReport.pollution_type]?.border}`}>
                #{selectedReport.id} • {POLLUTION_STYLES[selectedReport.pollution_type]?.label}
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-[24px] overflow-hidden aspect-video bg-slate-50 border border-slate-100 shadow-inner shrink-0 relative">
              {selectedReport.photo_url ? (
                <img src={`https://pub-628de2851ecc4ad69183874dc91ad113.r2.dev/${selectedReport.photo_url}`} className="w-full h-full object-cover" />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-200"><Camera className="w-8 h-8 mb-1" /></div>
              )}
              <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg text-[8px] text-white font-black uppercase">
                SENSOR-ID: {selectedReport.id}
              </div>
            </div>

            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-800 leading-tight mb-2">
                {selectedReport.description || 'Stationary sensor anomaly'}
              </h1>
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wide">
                  {new Date(selectedReport.submitted_at).toLocaleString('uk-UA', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            <div className="bg-[#f8fafc] p-4 rounded-[24px] border border-slate-50">
              <label className="text-[8px] font-black uppercase text-indigo-400 block mb-1 tracking-widest">AI Anomaly Report</label>
              <p className="text-xs font-bold text-slate-500 italic leading-snug">
                "{selectedReport.ai_verdict}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-50/30 p-4 rounded-[20px] border border-indigo-50">
                <span className="text-[8px] font-black text-indigo-400 uppercase block mb-1">Confidence</span>
                <div className="flex items-center gap-2">
                  <Shield className={`w-3.5 h-3.5 ${selectedReport.trust_level === 'HIGH' ? 'text-indigo-600' : 'text-amber-500'}`} />
                  <span className="text-xs font-black text-slate-800">{selectedReport.trust_level}</span>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-[20px]">
                <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Economy</span>
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                  <Coins className="w-3.5 h-3.5 text-amber-500" /> +{selectedReport.points_awarded} pts
                </div>
              </div>
              <div className="col-span-2 bg-slate-50 p-4 rounded-[20px] flex items-center justify-between">
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Geolocation Precision</span>
                  <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-slate-300" /> {selectedReport.latitude.toFixed(6)}, {selectedReport.longitude.toFixed(6)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-indigo-600">±{selectedReport.gnss_accuracy_m}m</span>
                </div>
              </div>
            </div>

            {alertReportIds.has(selectedReport.id) && (
              <div className="bg-[#FF1F5B] p-4 rounded-[24px] text-white flex items-center gap-4 shadow-xl shadow-rose-100 transition-all hover:scale-[1.02] mt-auto">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <Satellite className="w-6 h-6" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-sm font-black uppercase tracking-tighter leading-none">Space Verification</h4>
                  <p className="text-[8px] font-bold opacity-80 mt-0.5 uppercase truncate tracking-widest">Spectral match confirmed</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Time Range Change Notification */}
        {isChangingRange && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[2000] bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-pulse border border-white/20">
            <Satellite className="w-5 h-5 animate-bounce" />
            <div>
              <div className="text-sm font-black">UPDATING SATELLITE DATA</div>
              <div className="text-[10px] opacity-80">
                {dateRangeMode === 'day' ? '3 days' : dateRangeMode === 'week' ? '10 days' : '45 days'} time range
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
