import { useEffect, useRef, useState, useCallback } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { getApiUrl } from '../apiConfig';

// ── UWQV Evalscript (Water Quality Viewer) ──────────────────────────────────
// Returns colored PNG: blue=clean water, green=algae, grey=land/cloud
const UWQV_EVALSCRIPT = `
//VERSION=3
const PARAMS = {
  chlMin: -0.005,
  chlMax: 0.05,
  tssMin: 0.075,
  tssMax: 0.185,
};

function setup() {
  return {
    input: [{ bands: ['B02','B03','B04','B05','B06','B08','B11','SCL'] }],
    output: { bands: 4, sampleType: 'UINT8' }
  };
}

function isCloud(scl) { return scl === 8 || scl === 9 || scl === 10; }
function isWater(ndwi, ndvi) { return ndwi > 0.0 && ndvi < 0; }

function evaluatePixel(s) {
  const ndwi = (s.B03 - s.B08) / (s.B03 + s.B08);
  const ndvi = (s.B08 - s.B04) / (s.B08 + s.B04);

  if (isCloud(s.SCL)) {
    return [0, 0, 0, 0]; // transparent for clouds
  }
  if (!isWater(ndwi, ndvi)) {
    return [0, 0, 0, 0]; // transparent for land
  }

  const baseline = s.B04 + (s.B06 - s.B04) * ((705 - 665) / (740 - 665));
  const chlIndex = s.B05 - baseline;
  const tssIndex = s.B05;

  let r, g, b;
  if (chlIndex > PARAMS.chlMax * 0.6) {
    // High algae — red/orange
    r = 255; g = 80; b = 50;
  } else if (chlIndex > PARAMS.chlMin) {
    const t = Math.min((chlIndex - PARAMS.chlMin) / (PARAMS.chlMax - PARAMS.chlMin), 1);
    r = Math.round(0 + t * 80);
    g = Math.round(120 + t * 135);
    b = Math.round(80 - t * 80);
  } else {
    // Clean water — blue
    r = 30; g = 100; b = 220;
  }

  // Semi-transparent so the base map shows through
  return [r, g, b, 180];
}
`;

// ── Token cache ──────────────────────────────────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getAccessToken(): Promise<string> {
    if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

    // We no longer need client ID/secret on frontend! 
    // The backend /satellite/token endpoint handles it securely.
    const resp = await fetch(getApiUrl('/api/v1/satellite/token'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    }).catch(err => {
        console.error('Fetch /satellite/token failed:', err);
        throw err;
    });

    if (!resp.ok) {
        const text = await resp.text();
        console.error('SH Token Proxy Error:', resp.status, text);
        throw new Error(`Token error: ${resp.status}`);
    }
    const data = await resp.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return cachedToken!;
}

// ── Processing API call ──────────────────────────────────────────────────────
async function fetchWaterQualityImage(
    bbox: [number, number, number, number],
    width: number,
    height: number,
    dateFrom: string,
    dateTo: string,
    signal?: AbortSignal
): Promise<string> {
    // Note: Our new backend /satellite/process endpoint also takes the payload
    // and handles the token internally if we want, but here we keep the structure
    // of passing the payload.

    const body = {
        input: {
            bounds: {
                bbox,
                properties: { crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84' },
            },
            data: [{
                type: 'sentinel-2-l2a',
                dataFilter: {
                    timeRange: {
                        from: dateFrom,
                        to: dateTo,
                    },
                    mosaickingOrder: 'mostRecent',
                },
            }],
        },
        output: {
            width,
            height,
            responses: [{ identifier: 'default', format: { type: 'image/png' } }],
        },
        evalscript: UWQV_EVALSCRIPT,
    };

    const resp = await fetch(getApiUrl('/api/v1/satellite/process'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'image/png',
        },
        body: JSON.stringify(body),
        signal,
    }).catch(err => {
        if (err.name !== 'AbortError') console.error('Fetch /satellite/process failed:', err);
        throw err;
    });

    if (!resp.ok) {
        const text = await resp.text();
        console.error('SH Proxy Process Error:', resp.status, text);
        throw new Error(`SH API Proxy ${resp.status}: ${text.slice(0, 200)}`);
    }

    const blob = await resp.blob();
    return URL.createObjectURL(blob);
}

// ── React component ──────────────────────────────────────────────────────────
interface SentinelWaterLayerProps {
    enabled?: boolean;
    opacity?: number;
    dateFrom?: string;
    dateTo?: string;
}

export default function SentinelWaterLayer({ enabled = true, opacity = 0.7, dateFrom, dateTo }: SentinelWaterLayerProps) {
    const map = useMap();
    const overlayRef = useRef<L.ImageOverlay | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const prevBlobUrl = useRef<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Re-fetch whenever loadOverlay identity changes (which encodes all deps)
    const loadOverlay = useCallback(async () => {
        if (!enabled) {
            if (overlayRef.current) {
                map.removeLayer(overlayRef.current);
                overlayRef.current = null;
            }
            return;
        }

        // Cancel previous request
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const bounds = map.getBounds();
        const bbox: [number, number, number, number] = [
            bounds.getWest(),
            bounds.getSouth(),
            bounds.getEast(),
            bounds.getNorth(),
        ];

        // Don't fetch if zoomed out too far (below zoom 9 = too large area)
        const zoom = map.getZoom();
        if (zoom < 9) {
            if (overlayRef.current) {
                map.removeLayer(overlayRef.current);
                overlayRef.current = null;
            }
            setError('Zoom in to see water quality data (min zoom: 9)');
            return;
        }

        // Calculate resolution based on container size
        const size = map.getSize();
        const width = Math.min(size.x, 512);
        const height = Math.min(size.y, 512);

        setLoading(true);
        setError(null);

        try {
            // Default to last 60 days if not specified
            const to = dateTo || new Date().toISOString();
            const fromDate = dateFrom || (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString(); })();

            console.log('🛰️ SentinelWaterLayer fetching via Proxy:', {
                from: new Date(fromDate).toLocaleDateString(),
                to: new Date(to).toLocaleDateString(),
                zoom,
            });
            const blobUrl = await fetchWaterQualityImage(bbox, width, height, fromDate, to, controller.signal);

            if (controller.signal.aborted) {
                URL.revokeObjectURL(blobUrl);
                return;
            }

            // Clean up previous blob
            if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current);
            prevBlobUrl.current = blobUrl;

            const leafletBounds = L.latLngBounds(
                [bounds.getSouth(), bounds.getWest()],
                [bounds.getNorth(), bounds.getEast()]
            );

            if (overlayRef.current) {
                overlayRef.current.setUrl(blobUrl);
                overlayRef.current.setBounds(leafletBounds);
            } else {
                overlayRef.current = L.imageOverlay(blobUrl, leafletBounds, { opacity, interactive: false });
                overlayRef.current.addTo(map);
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('SentinelWaterLayer error:', err);
                const msg = err instanceof TypeError ? 'Network/Proxy Error' : (err.message || 'Unknown error');
                setError(msg.slice(0, 80));
            }
        } finally {
            if (controller === abortRef.current) {
                setLoading(false);
            }
        }
    }, [map, enabled, opacity, dateFrom, dateTo]);

    // Map move/zoom handlers
    useMapEvents({
        moveend: () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(loadOverlay, 800);
        },
        zoomend: () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(loadOverlay, 800);
        },
    });

    useEffect(() => {
        loadOverlay();
    }, [loadOverlay]);

    useEffect(() => {
        return () => {
            if (abortRef.current) abortRef.current.abort();
            if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current);
            if (overlayRef.current) map.removeLayer(overlayRef.current);
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [map]);

    useEffect(() => {
        if (overlayRef.current) overlayRef.current.setOpacity(opacity);
    }, [opacity]);

    return (
        <>
            {loading && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-gradient-to-r from-teal-600 to-blue-600 text-white backdrop-blur shadow-2xl rounded-2xl px-6 py-3 flex items-center gap-3 border border-white/20">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-bold tracking-widest uppercase font-mono">Satellite Scan in Progress...</span>
                </div>
            )}
            {!loading && error && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur shadow-xl rounded-xl px-6 py-3 border border-red-200">
                    <span className="text-[10px] font-mono text-red-500 font-bold uppercase">{error}</span>
                </div>
            )}
        </>
    );
}
