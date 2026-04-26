export interface BackendReport {
  id: number;
  latitude: number;
  longitude: number;
  description: string;
  photo_url: string | null;
  pollution_type: string;
  trust_level: string;
  ai_verdict?: string | null;
  submitted_at: string;
  points_awarded: number;
}

export const MOCK_REPORTS: BackendReport[] = [
    {
        "id": 96,
        "latitude": 35.8399,
        "longitude": -3.7276999999999996,
        "description": "Small patches of white foam near reeds. Could be natural or detergent runoff.",
        "photo_url": null,
        "pollution_type": "FOAM",
        "trust_level": "LOW",
        "ai_verdict": "GNSS: ±9m | AI (92%): foam confirmed",
        "submitted_at": "2026-03-27T06:40:54.898900Z",
        "points_awarded": 0
    },
    {
        "id": 97,
        "latitude": 35.842999999999996,
        "longitude": -3.7249999999999996,
        "description": "Seasonal algae bloom started on the southern end. Green discolouration visible.",
        "photo_url": null,
        "pollution_type": "ALGAL_BLOOM",
        "trust_level": "HIGH",
        "ai_verdict": "GNSS: ±4m | AI (92%): algal bloom confirmed",
        "submitted_at": "2026-03-22T03:40:54.898900Z",
        "points_awarded": 0
    },
    {
        "id": 98,
        "latitude": 35.8461,
        "longitude": -3.7222999999999997,
        "description": "Possible oil near fishing dock, hard to confirm due to low accuracy GPS.",
        "photo_url": null,
        "pollution_type": "OIL_SLICK",
        "trust_level": "LOW",
        "ai_verdict": "GNSS: ±22m | AI (92%): oil slick confirmed",
        "submitted_at": "2026-03-17T00:40:54.898900Z",
        "points_awarded": 0
    },
    {
        "id": 99,
        "latitude": 35.849199999999996,
        "longitude": -3.7196,
        "description": "Red-brown water near irrigation outlet. Suspected iron/chemical runoff.",
        "photo_url": null,
        "pollution_type": "DISCOLORATION",
        "trust_level": "HIGH",
        "ai_verdict": "GNSS: ±4m | AI (92%): discoloration confirmed",
        "submitted_at": "2026-03-09T21:40:54.898900Z",
        "points_awarded": 0
    },
    {
        "id": 100,
        "latitude": 35.8523,
        "longitude": -3.7169,
        "description": "Post-flood debris field: plastic, wood, bottles along 300m of shoreline.",
        "photo_url": null,
        "pollution_type": "DEBRIS",
        "trust_level": "HIGH",
        "ai_verdict": "GNSS: ±2m | AI (92%): debris confirmed",
        "submitted_at": "2026-03-01T18:40:54.898900Z",
        "points_awarded": 0
    },
    {
        "id": 101,
        "latitude": 35.855399999999996,
        "longitude": -3.7142,
        "description": "Greenish tint on water, photographed from far. Possibly early algae stage.",
        "photo_url": null,
        "pollution_type": "ALGAL_BLOOM",
        "trust_level": "LOW",
        "ai_verdict": "GNSS: ±15m | AI (92%): algal bloom confirmed",
        "submitted_at": "2026-02-22T15:40:54.898900Z",
        "points_awarded": 0
    },
    {
        "id": 102,
        "latitude": 35.8585,
        "longitude": -3.7114999999999996,
        "description": "Thick white foam in inlet channel, likely from upstream industrial discharge.",
        "photo_url": null,
        "pollution_type": "FOAM",
        "trust_level": "HIGH",
        "ai_verdict": "GNSS: ±5m | AI (92%): foam confirmed",
        "submitted_at": "2026-02-14T12:40:54.898900Z",
        "points_awarded": 0
    }
];
