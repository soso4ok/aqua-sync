import { MapContainer, TileLayer, FeatureGroup, Polygon, Rectangle, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { useState, useCallback, useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import {
  Plus,
  Trash2,
  Bell,
  BellOff,
  Square,
  Pencil,
  Save,
  X,
  MapPin,
  Satellite,
  Eye,
  EyeOff,
  MousePointer2,
  Pentagon,
  RectangleHorizontal,
  Move
} from 'lucide-react';
import SentinelWaterLayer from './SentinelWaterLayer';

// ─── Types ──────────────────────────────────────────────
interface MonitoringZone {
  id: string;
  name: string;
  type: 'polygon' | 'rectangle';
  latlngs: L.LatLng[][] | L.LatLng[];  // polygon coords
  color: string;
  notifications: boolean;
  createdAt: string;
}

// ─── Color palette for zones ────────────────────────────
const ZONE_COLORS = ['#14B8A6', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

// ─── Helper: set cross cursor on map ────────────────────
function SetCursor({ active }: { active: boolean }) {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    if (active) {
      container.style.cursor = 'crosshair';
    } else {
      container.style.cursor = '';
    }
    return () => { container.style.cursor = ''; };
  }, [active, map]);
  return null;
}

export default function Dashboard() {
  const [sentinelEnabled, setSentinelEnabled] = useState(true);
  const [sentinelOpacity] = useState(0.7);

  // Zone state
  const [zones, setZones] = useState<MonitoringZone[]>([
    {
      id: 'zone-demo',
      name: 'Gulf of Gdańsk — West',
      type: 'rectangle',
      latlngs: [
        L.latLng(54.41, 18.52),
        L.latLng(54.41, 18.62),
        L.latLng(54.46, 18.62),
        L.latLng(54.46, 18.52),
      ],
      color: '#14B8A6',
      notifications: true,
      createdAt: new Date().toISOString(),
    },
  ]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  // Save dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [zoneName, setZoneName] = useState('');
  const [pendingLayer, setPendingLayer] = useState<L.Layer | null>(null);
  const [pendingType, setPendingType] = useState<'polygon' | 'rectangle'>('polygon');
  const [pendingLatLngs, setPendingLatLngs] = useState<L.LatLng[]>([]);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const featureGroupRef = useRef<L.FeatureGroup>(null);

  // ── Handlers ──
  const handleCreated = useCallback((e: any) => {
    const { layerType, layer } = e;
    let latlngs: L.LatLng[] = [];

    if (layerType === 'polygon') {
      latlngs = layer.getLatLngs()[0] as L.LatLng[];
    } else if (layerType === 'rectangle') {
      latlngs = layer.getLatLngs()[0] as L.LatLng[];
    }

    // Remove the layer from leaflet-draw's feature group (we'll render it ourselves)
    if (featureGroupRef.current) {
      featureGroupRef.current.removeLayer(layer);
    }

    setPendingLatLngs(latlngs);
    setPendingType(layerType === 'rectangle' ? 'rectangle' : 'polygon');
    setPendingLayer(layer);
    setShowSaveDialog(true);
  }, []);

  const saveZone = useCallback(() => {
    if (!pendingLatLngs.length || !zoneName.trim()) return;
    const newZone: MonitoringZone = {
      id: `zone-${Date.now()}`,
      name: zoneName.trim(),
      type: pendingType,
      latlngs: pendingLatLngs,
      color: ZONE_COLORS[zones.length % ZONE_COLORS.length],
      notifications: true,
      createdAt: new Date().toISOString(),
    };
    setZones((prev) => [...prev, newZone]);
    cancelSave();
  }, [pendingLatLngs, zoneName, pendingType, zones.length]);

  const cancelSave = useCallback(() => {
    setShowSaveDialog(false);
    setZoneName('');
    setPendingLayer(null);
    setPendingLatLngs([]);
  }, []);

  const deleteZone = useCallback((id: string) => {
    setZones((prev) => prev.filter((z) => z.id !== id));
    setSelectedZoneId(null);
  }, []);

  const toggleNotifications = useCallback((id: string) => {
    setZones((prev) =>
      prev.map((z) => (z.id === id ? { ...z, notifications: !z.notifications } : z))
    );
  }, []);

  // ── Editing handlers ──
  const handleEdited = useCallback((e: any) => {
    const layers = e.layers;
    layers.eachLayer((layer: any) => {
      const zoneId = (layer as any)._zoneId;
      if (!zoneId) return;
      const newLatLngs = layer.getLatLngs()[0] as L.LatLng[];
      setZones((prev) =>
        prev.map((z) => (z.id === zoneId ? { ...z, latlngs: newLatLngs } : z))
      );
    });
    setIsEditing(false);
  }, []);

  const handleDeleted = useCallback((e: any) => {
    const layers = e.layers;
    const deletedIds: string[] = [];
    layers.eachLayer((layer: any) => {
      const zoneId = (layer as any)._zoneId;
      if (zoneId) deletedIds.push(zoneId);
    });
    setZones((prev) => prev.filter((z) => !deletedIds.includes(z.id)));
    setSelectedZoneId(null);
  }, []);

  // Convert zone latlngs to bounds for rectangle rendering
  const getBoundsFromLatLngs = (latlngs: L.LatLng[]): L.LatLngBoundsExpression => {
    const lats = latlngs.map((ll) => ll.lat);
    const lngs = latlngs.map((ll) => ll.lng);
    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
  };

  return (
    <div className="flex h-full">
      {/* ── Left Panel: Monitoring Zones ── */}
      <div className="w-96 border-r border-satellite-blue/10 bg-white flex flex-col">
        <div className="p-6 border-b border-satellite-blue/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Monitoring Zones</h2>
            <span className="text-[10px] font-mono text-satellite-blue/40 bg-data-white px-2 py-1 rounded-full">
              {zones.length} zone{zones.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-satellite-blue text-white p-3 rounded-xl">
              <p className="text-[10px] uppercase font-mono opacity-60">Active Zones</p>
              <div className="flex items-end justify-between mt-1">
                <span className="text-2xl font-bold">{zones.length}</span>
                <span className="text-[10px] font-mono text-galileo-teal uppercase">Sentinel</span>
              </div>
            </div>
            <div className="bg-galileo-teal text-white p-3 rounded-xl">
              <p className="text-[10px] uppercase font-mono opacity-80">Alerts On</p>
              <div className="flex items-end justify-between mt-1">
                <span className="text-2xl font-bold">{zones.filter((z) => z.notifications).length}</span>
                <Bell className="w-4 h-4 text-white/60" />
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-4 p-3 bg-data-white rounded-xl border border-satellite-blue/5">
            <p className="text-[10px] font-mono text-satellite-blue/50 leading-relaxed">
              Use the <strong className="text-satellite-blue">drawing tools</strong> on the map (bottom-left) to create rectangles or polygons. After drawing, name and save the zone.
            </p>
          </div>
        </div>

        {/* Zone List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {zones.map((zone) => (
            <div
              key={zone.id}
              onClick={() => setSelectedZoneId(zone.id === selectedZoneId ? null : zone.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${selectedZoneId === zone.id
                ? 'bg-data-white border-galileo-teal shadow-inner'
                : 'bg-white border-satellite-blue/5 hover:border-satellite-blue/20 hover:shadow-md'
                }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }}></div>
                  <h3 className="font-semibold text-sm">{zone.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-satellite-blue/5 text-satellite-blue/40 uppercase">
                    {zone.type}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleNotifications(zone.id);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${zone.notifications
                      ? 'text-galileo-teal hover:bg-galileo-teal/10'
                      : 'text-satellite-blue/20 hover:bg-satellite-blue/5'
                      }`}
                    title={zone.notifications ? 'Notifications ON' : 'Notifications OFF'}
                  >
                    {zone.notifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[10px] font-mono text-satellite-blue/40">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>Copernicus Watch</span>
                </div>
                <span>•</span>
                <span>{new Date(zone.createdAt).toLocaleDateString()}</span>
              </div>

              {selectedZoneId === zone.id && (
                <div className="mt-3 pt-3 border-t border-satellite-blue/5 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteZone(zone.id);
                    }}
                    className="flex-1 h-9 flex items-center justify-center gap-1.5 border border-red-200 rounded-lg text-red-500 text-[10px] font-bold uppercase tracking-wider hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}

          {zones.length === 0 && (
            <div className="py-12 text-center">
              <Square className="w-8 h-8 text-satellite-blue/20 mx-auto mb-3" />
              <p className="text-sm text-satellite-blue/40 font-mono italic">
                No monitoring zones yet.
              </p>
              <p className="text-[10px] text-satellite-blue/30 mt-1">
                Use drawing tools on the map to start.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right Map Pane ── */}
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

          {/* 🛰 Sentinel-2 Water Quality Overlay */}
          <SentinelWaterLayer enabled={sentinelEnabled} opacity={sentinelOpacity} />

          {/* ── Leaflet Draw Controls ── */}
          <FeatureGroup ref={featureGroupRef}>
            <EditControl
              position="bottomleft"
              onCreated={handleCreated}
              onEdited={handleEdited}
              onDeleted={handleDeleted}
              draw={{
                polygon: {
                  allowIntersection: false,
                  shapeOptions: {
                    color: ZONE_COLORS[zones.length % ZONE_COLORS.length],
                    weight: 2,
                    fillOpacity: 0.2,
                  },
                },
                rectangle: {
                  shapeOptions: {
                    color: ZONE_COLORS[zones.length % ZONE_COLORS.length],
                    weight: 2,
                    fillOpacity: 0.2,
                  },
                },
                circle: false,
                circlemarker: false,
                marker: false,
                polyline: false,
              }}
              edit={{
                featureGroup: featureGroupRef.current!,
                remove: false,
              }}
            />
          </FeatureGroup>

          {/* ── Rendered saved zones (outside FeatureGroup so draw controls don't interfere) ── */}
          {zones.map((zone) => (
            <Polygon
              key={zone.id}
              positions={zone.latlngs as L.LatLngExpression[]}
              pathOptions={{
                color: zone.color,
                weight: selectedZoneId === zone.id ? 3 : 2,
                fillOpacity: selectedZoneId === zone.id ? 0.25 : 0.1,
                dashArray: selectedZoneId === zone.id ? undefined : '5, 8',
              }}
              eventHandlers={{
                click: () => setSelectedZoneId(zone.id === selectedZoneId ? null : zone.id),
              }}
            />
          ))}
        </MapContainer>

        {/* ── Save Zone Dialog ── */}
        {showSaveDialog && (
          <div className="absolute bottom-8 right-8 w-80 bg-white/95 backdrop-blur shadow-2xl rounded-2xl border border-satellite-blue/10 p-6 z-[1000]">
            <h4 className="text-[10px] font-mono text-galileo-teal uppercase tracking-widest mb-1">
              New Monitoring Zone
            </h4>
            <p className="text-lg font-bold tracking-tight mb-1">Save This Area</p>
            <p className="text-[10px] font-mono text-satellite-blue/40 mb-4">
              Type: {pendingType} • {pendingLatLngs.length} vertices
            </p>

            <input
              type="text"
              placeholder="Zone name (e.g. Baltic Coast West)"
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveZone()}
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-satellite-blue/10 bg-data-white text-sm font-mono placeholder:text-satellite-blue/30 focus:outline-none focus:ring-2 focus:ring-galileo-teal/30 mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={saveZone}
                disabled={!zoneName.trim()}
                className="flex-1 bg-satellite-blue text-white h-12 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-galileo-teal transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Save className="w-4 h-4" />
                Save Zone
              </button>
              <button
                onClick={cancelSave}
                className="h-12 px-4 flex items-center justify-center border border-satellite-blue/10 rounded-xl hover:bg-data-white transition-colors"
              >
                <X className="w-5 h-5 text-satellite-blue/40" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
