import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { useState, useMemo } from 'react';
import { divIcon } from 'leaflet';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Info,
  Layers,
  Filter,
  ArrowUpRight,
  Droplets,
  Satellite,
  Zap
} from 'lucide-react';
import { CitizenReport, SatelliteAnomaly } from '../types';

const MOCK_ANOMALIES: SatelliteAnomaly[] = [
  { id: 'an-1', lat: 54.44, lng: 18.57, radius: 800, type: 'Chlorophyll-a', intensity: 0.85, lastDetected: '2026-04-25T06:00:00Z' },
  { id: 'an-2', lat: 54.40, lng: 18.65, radius: 400, type: 'Turbidity Spike', intensity: 0.62, lastDetected: '2026-04-25T05:30:00Z' },
  { id: 'an-3', lat: 54.45, lng: 18.70, radius: 1200, type: 'NDWI Anomaly', intensity: 0.45, lastDetected: '2026-04-25T07:15:00Z' }
];

const MOCK_REPORTS: CitizenReport[] = [
  { 
    id: 'rep-1', lat: 54.438, lng: 18.575, timestamp: '2026-04-25T07:30:00Z', 
    category: 'Algal Bloom', description: 'Large green mat spotted near the pier.', 
    imageUrl: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&q=80&w=400',
    isVerified: true, accuracyMeters: 1.2, anomalyIntersect: 'an-1'
  },
  { 
    id: 'rep-2', lat: 54.398, lng: 18.655, timestamp: '2026-04-25T07:45:00Z', 
    category: 'Trash', description: 'Plastic accumulations along the river bank.', 
    imageUrl: 'https://images.unsplash.com/photo-1618477430045-8f6a9179979b?auto=format&fit=crop&q=80&w=400',
    isVerified: true, accuracyMeters: 4.5, anomalyIntersect: 'an-2'
  },
  { 
    id: 'rep-3', lat: 54.410, lng: 18.600, timestamp: '2026-04-25T07:00:00Z', 
    category: 'Oil Sheen', description: 'Shiny rainbow film on water surface.', 
    imageUrl: 'https://images.unsplash.com/photo-15426019069d0-b4d9235e6171?auto=format&fit=crop&q=80&w=400',
    isVerified: false, accuracyMeters: 15.2
  }
];

export default function Dashboard() {
  const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredReports = useMemo(() => {
    if (filterCategory === 'All') return MOCK_REPORTS;
    return MOCK_REPORTS.filter(r => r.category === filterCategory);
  }, [filterCategory]);

  const stats = useMemo(() => {
    const activePins = MOCK_REPORTS.length;
    const suspectedZones = MOCK_ANOMALIES.length;
    const intersections = MOCK_REPORTS.filter(r => r.anomalyIntersect).length;
    return { activePins, suspectedZones, intersections };
  }, []);

  const categories = ['All', 'Algal Bloom', 'Trash', 'Discoloration', 'Oil Sheen'];

  return (
    <div className="flex h-full">
      {/* Left List Pane */}
      <div className="w-96 border-r border-satellite-blue/10 bg-white flex flex-col">
        <div className="p-6 border-b border-satellite-blue/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Incoming Signals</h2>
            <div className="relative">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`p-2 rounded-lg transition-all text-satellite-blue/40 flex items-center gap-2 ${isFilterOpen ? 'bg-data-white ring-1 ring-satellite-blue/10 shadow-sm' : 'hover:bg-data-white'}`}
              >
                <Filter className={`w-4 h-4 ${isFilterOpen ? 'text-galileo-teal' : ''}`} />
                <span className="text-[10px] font-mono uppercase tracking-wider">{filterCategory}</span>
              </button>
              
              {isFilterOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsFilterOpen(false)}
                  ></div>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-satellite-blue/10 rounded-xl shadow-2xl z-50 py-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          setFilterCategory(cat);
                          setIsFilterOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs hover:bg-data-white transition-colors flex items-center justify-between ${filterCategory === cat ? 'text-galileo-teal font-bold bg-galileo-teal/5' : 'text-satellite-blue/60'}`}
                      >
                        {cat}
                        {filterCategory === cat && <div className="w-1.5 h-1.5 rounded-full bg-galileo-teal"></div>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-satellite-blue text-white p-3 rounded-xl">
                <p className="text-[10px] uppercase font-mono opacity-60">Active Pins</p>
                <div className="flex items-end justify-between mt-1">
                   <span className="text-2xl font-bold">{stats.activePins}</span>
                   <span className="text-[10px] font-mono text-galileo-teal uppercase">Galileo</span>
                </div>
             </div>
             <div className="bg-signal-coral text-white p-3 rounded-xl">
                <p className="text-[10px] uppercase font-mono opacity-80">Suspected Zones</p>
                <div className="flex items-end justify-between mt-1">
                   <span className="text-2xl font-bold">{stats.suspectedZones}</span>
                   <span className="text-[10px] font-mono text-white/50 uppercase">Sentinel</span>
                </div>
             </div>
             <div className="bg-galileo-teal text-white p-3 rounded-xl col-span-2 border border-white/20 shadow-lg">
                <p className="text-[10px] uppercase font-mono opacity-90 font-bold">Space-to-Citizen Fusion Hits</p>
                <div className="flex items-end justify-between mt-1">
                   <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-white animate-pulse" />
                      <span className="text-2xl font-bold">{stats.intersections}</span>
                   </div>
                   <span className="text-[10px] font-mono text-white/60 lowercase italic">High Priority Verified</span>
                </div>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredReports.map((report) => (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                selectedReport?.id === report.id 
                ? 'bg-data-white border-galileo-teal shadow-inner' 
                : 'bg-white border-satellite-blue/5 hover:border-satellite-blue/20 hover:shadow-md'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                  report.category === 'Algal Bloom' ? 'bg-green-100 text-green-700' :
                  report.category === 'Oil Sheen' ? 'bg-purple-100 text-purple-700' :
                  report.category === 'Trash' ? 'bg-orange-100 text-orange-700' :
                  'bg-satellite-blue/5 text-satellite-blue/60'
                }`}>
                  {report.category}
                </span>
                <span className="text-[10px] font-mono text-satellite-blue/40">
                  {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              <h3 className="font-semibold text-sm line-clamp-1">{report.description}</h3>
              
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1">
                    <CheckCircle2 className={`w-3 h-3 ${report.isVerified ? 'text-galileo-teal' : 'text-satellite-blue/20'}`} />
                    <span className="text-[10px] font-mono mt-0.5">GNSS Acc: {report.accuracyMeters}m</span>
                </div>
                {report.anomalyIntersect && (
                  <div className="flex items-center gap-1 text-signal-coral">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="text-[10px] font-mono mt-0.5">MATCH</span>
                  </div>
                )}
              </div>
            </button>
          ))}
          {filteredReports.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-satellite-blue/40 font-mono italic">No signals found in this category.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Map Pane */}
      <div className="flex-1 relative">
        <MapContainer 
          center={[54.42, 18.62]} 
          zoom={12} 
          className="z-0"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {/* Satellite Anomalies */}
          {MOCK_ANOMALIES.map((anomaly) => (
            <Circle 
              key={anomaly.id}
              center={[anomaly.lat, anomaly.lng]}
              radius={anomaly.radius}
              pathOptions={{
                color: '#0A2463',
                fillColor: '#0A2463',
                fillOpacity: 0.15,
                weight: 2,
                dashArray: '5, 10'
              }}
            >
              <Popup className="font-sans">
                 <div className="p-1">
                    <div className="flex items-center gap-2 mb-2">
                       <Satellite className="w-4 h-4 text-satellite-blue" />
                       <span className="text-xs font-bold uppercase tracking-tight">Copernicus Detection</span>
                    </div>
                    <p className="text-lg font-bold text-satellite-blue leading-none mb-1">{anomaly.type}</p>
                    <p className="text-[10px] font-mono text-satellite-blue/60 mb-2">Confidence: {(anomaly.intensity * 100).toFixed(0)}%</p>
                    <div className="h-px bg-satellite-blue/10 my-2"></div>
                    <p className="text-[10px] text-satellite-blue/50 italic">Verified ground-truth required for calibration.</p>
                 </div>
              </Popup>
            </Circle>
          ))}

          {/* Citizen Reports - Also filtered for consistency */}
          {filteredReports.map((report) => (
            <Marker 
              key={report.id} 
              position={[report.lat, report.lng]}
              icon={divIcon({
                className: 'custom-marker-parent',
                html: `<div class="${report.anomalyIntersect ? 'custom-marker-report animate-bounce' : 'custom-marker-report opacity-70'}"></div>`,
                iconSize: [24, 24],
                iconAnchor: [6, 6]
              })}
            >
              <Popup className="font-sans">
                <div className="w-48 overflow-hidden rounded-lg">
                  <img src={report.imageUrl} alt="Report View" className="w-full h-24 object-cover mb-2" />
                  <div className="p-1">
                    <div className="flex items-center gap-1 mb-1">
                       <CheckCircle2 className="w-3 h-3 text-galileo-teal" />
                       <span className="text-[9px] font-mono text-galileo-teal uppercase">Verified Galileo Point</span>
                    </div>
                    <p className="text-sm font-bold text-satellite-blue">{report.category}</p>
                    <p className="text-[11px] text-satellite-blue/70 mb-2">{report.description}</p>
                    <button className="w-full bg-satellite-blue text-white text-[10px] py-1.5 rounded uppercase font-bold tracking-wider hover:bg-galileo-teal transition-colors">
                       Analyze Indices
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Map Overlays */}
        <div className="absolute top-6 left-6 flex flex-col gap-3">
           <div className="bg-white/90 backdrop-blur shadow-xl rounded-xl border border-satellite-blue/10 p-2 flex flex-col gap-1">
              <button className="p-2.5 rounded-lg bg-satellite-blue text-white shadow-lg">
                 <Layers className="w-5 h-5" />
              </button>
              <button className="p-2.5 rounded-lg hover:bg-data-white text-satellite-blue/60 transition-colors">
                 <Droplets className="w-5 h-5" />
              </button>
              <button className="p-2.5 rounded-lg hover:bg-data-white text-satellite-blue/60 transition-colors">
                 <Satellite className="w-5 h-5" />
              </button>
           </div>
        </div>

        {/* Info Panel Overlay */}
        {selectedReport && (
          <div className="absolute bottom-8 right-8 w-80 bg-white/95 backdrop-blur shadow-2xl rounded-2xl border border-satellite-blue/10 p-6 z-20">
             <div className="flex items-start justify-between mb-4">
                <div>
                   <h4 className="text-[10px] font-mono text-galileo-teal uppercase tracking-widest mb-1">Station Record</h4>
                   <p className="text-xl font-bold tracking-tight">{selectedReport.category}</p>
                </div>
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="p-1 hover:bg-data-white rounded-full text-satellite-blue/30"
                >
                   <ArrowUpRight className="w-4 h-4 rotate-45" />
                </button>
             </div>

             <div className="aspect-video rounded-xl bg-data-white mb-4 overflow-hidden border border-satellite-blue/5">
                <img src={selectedReport.imageUrl} className="w-full h-full object-cover" alt="Verification view" />
             </div>

             <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                   <div className="flex items-center gap-2 text-satellite-blue/50">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Timestamp</span>
                   </div>
                   <span className="font-mono">{new Date(selectedReport.timestamp).toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                   <div className="flex items-center gap-2 text-satellite-blue/50">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>GNSS Precision</span>
                   </div>
                   <span className="font-mono text-galileo-teal">± {selectedReport.accuracyMeters}m (Galileo)</span>
                </div>

                <div className="pt-4 border-t border-satellite-blue/5">
                   <p className="text-xs text-satellite-blue/70 leading-relaxed mb-4">
                      "{selectedReport.description}"
                   </p>
                   
                   <div className="flex gap-2">
                      <button className="flex-1 bg-satellite-blue text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                         Valid Signage
                      </button>
                      <button className="w-12 h-12 flex items-center justify-center border border-satellite-blue/10 rounded-xl hover:bg-data-white transition-colors">
                         <Info className="w-5 h-5 text-satellite-blue" />
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
