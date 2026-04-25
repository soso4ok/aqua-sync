import { useEffect, useRef, useState, useCallback } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

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

    const clientId = import.meta.env.VITE_SH_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_SH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('Missing VITE_SH_CLIENT_ID / VITE_SH_CLIENT_SECRET in .env');
    }

    const resp = await fetch(
        '/sh-token',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret,
            }),
        }
    );

    if (!resp.ok) throw new Error(`Token error: ${resp.status}`);
    const data = await resp.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // refresh 60s early
    return cachedToken!;
}

// ── Processing API call ──────────────────────────────────────────────────────
async function fetchWaterQualityImage(
    bbox: [number, number, number, number],
    width: number,
    height: number,
    signal?: AbortSignal
): Promise<string> {
    const token = await getAccessToken();

    // Use recent 30-day window for freshest data
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 60);

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
                        from: from.toISOString(),
                        to: to.toISOString(),
                    },
                    mosaickingOrder: 'leastCC',
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

    const resp = await fetch('/sh-process', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'image/png',
        },
        body: JSON.stringify(body),
        signal,
    });

    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`SH API ${resp.status}: ${text.slice(0, 200)}`);
    }

    const blob = await resp.blob();
    return URL.createObjectURL(blob);
}

// ── React component ──────────────────────────────────────────────────────────
interface SentinelWaterLayerProps {
    enabled?: boolean;
    opacity?: number;
}

export default function SentinelWaterLayer({ enabled = true, opacity = 0.7 }: SentinelWaterLayerProps) {
    const map = useMap();
    const overlayRef = useRef<L.ImageOverlay | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const prevBlobUrl = useRef<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const loadOverlay = useCallback(async () => {
        if (!enabled) return;

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
            // Remove overlay if exists
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
            const blobUrl = await fetchWaterQualityImage(bbox, width, height, controller.signal);

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
                setError(err.message?.slice(0, 80) || 'Failed to load');
            }
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
    }, [map, enabled, opacity]);

    // Debounced map move handler
    useMapEvents({
        moveend: () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(loadOverlay, 600);
        },
        zoomend: () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(loadOverlay, 600);
        },
    });

    // Initial load
    useEffect(() => {
        loadOverlay();
        return () => {
            if (abortRef.current) abortRef.current.abort();
            if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current);
            if (overlayRef.current) map.removeLayer(overlayRef.current);
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [enabled]);

    // Update opacity
    useEffect(() => {
        if (overlayRef.current) overlayRef.current.setOpacity(opacity);
    }, [opacity]);

    // Remove overlay when disabled
    useEffect(() => {
        if (!enabled && overlayRef.current) {
            map.removeLayer(overlayRef.current);
            overlayRef.current = null;
        }
    }, [enabled]);

    return (
        <>
            {/* Loading indicator */}
            {loading && (
                <div className="absolute top-6 right-6 z-[1000] bg-white/90 backdrop-blur shadow-xl rounded-xl px-4 py-3 flex items-center gap-3 border border-galileo-teal/30">
                    <div className="w-4 h-4 border-2 border-galileo-teal border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-mono text-satellite-blue/70">Loading satellite data…</span>
                </div>
            )}
            {/* Error / zoom hint */}
            {!loading && error && (
                <div className="absolute top-6 right-6 z-[1000] bg-white/90 backdrop-blur shadow-xl rounded-xl px-4 py-3 border border-signal-coral/30">
                    <span className="text-xs font-mono text-signal-coral">{error}</span>
                </div>
            )}
        </>
    );
}
