import { useState, useEffect } from 'react';
import { User, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface BackendReport {
  id: number;
  latitude: number;
  longitude: number;
  description: string;
  photo_url: string | null;
  pollution_type: string;
  trust_level: string;
  submitted_at: string;
  points_awarded: number;
}

const MOCK_REPORTS: BackendReport[] = [
    {
        "id": 96,
        "latitude": 35.8399,
        "longitude": -3.7276999999999996,
        "description": "Small patches of white foam near reeds. Could be natural or detergent runoff.",
        "photo_url": null,
        "pollution_type": "FOAM",
        "trust_level": "LOW",
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
        "submitted_at": "2026-02-14T12:40:54.898900Z",
        "points_awarded": 0
    }
];

export default function ProfileView() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<BackendReport[]>(MOCK_REPORTS);
  const [isLoading, setIsLoading] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});

  const totalPoints = reports.reduce((acc, r) => acc + (r.points_awarded || 0), 0);

  return (
    <div className="h-full bg-data-white overflow-y-auto pb-24">
      <div className="p-8 pt-12 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-white border-2 border-satellite-blue/5 flex items-center justify-center shadow-sm">
            <User className="w-8 h-8 text-satellite-blue" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold tracking-tight text-satellite-blue truncate">
              Citizen #4092
            </h2>
          </div>
        </div>

        {/* Points Display */}
        <div className="bg-white rounded-[2.5rem] p-8 border-2 border-satellite-blue/5 shadow-sm text-center">
          <div className="flex flex-col items-center">
            <h3 className="text-6xl font-black tracking-tighter text-satellite-blue">
              {totalPoints}
              <span className="text-2xl font-mono text-galileo-teal ml-2">pkt</span>
            </h3>
          </div>
        </div>

        {/* History List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-xs font-mono uppercase font-bold tracking-widest text-satellite-blue/30">History reports</h4>
            <span className="text-[10px] font-mono text-galileo-teal font-bold">{reports.length} total</span>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-satellite-blue/20" />
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-satellite-blue/10">
                <p className="text-xs font-mono text-satellite-blue/30 uppercase tracking-widest">No reports yet</p>
              </div>
            ) : (
              reports.map((report) => (
                <motion.button
                  key={report.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/report/${report.id}`)}
                  className="w-full bg-white p-4 rounded-[2rem] border border-satellite-blue/5 shadow-sm hover:shadow-md transition-shadow text-left flex items-center gap-4 relative overflow-hidden"
                >
                  {/* Status Pill (Top Right) */}
                  <div className="absolute top-3 right-3">
                    {report.trust_level === 'HIGH' || report.trust_level === 'LOW' ? (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/10 font-chakra text-[8px] font-bold tracking-wider uppercase">
                         Verified ({report.trust_level})
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#FFF8E1] text-[#F57F17] border border-[#F57F17]/10 font-chakra text-[8px] font-bold tracking-wider uppercase">
                         Pending
                      </div>
                    )}
                  </div>

                  <div className="w-16 h-16 rounded-2xl bg-data-white overflow-hidden flex-shrink-0 border border-satellite-blue/5">
                    {report.photo_url && photoUrls[report.photo_url] ? (
                      <img src={photoUrls[report.photo_url]} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full bg-satellite-blue/5 flex items-center justify-center">
                        <User className="w-6 h-6 text-satellite-blue/10" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-8">
                    <h5 className="font-bold text-sm text-satellite-blue truncate capitalize">
                      {report.pollution_type.replace('_', ' ').toLowerCase()}
                    </h5>
                    <p className="text-[10px] font-mono text-satellite-blue/30 mt-0.5 tracking-tight">
                      {new Date(report.submitted_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Open Indicator (Bottom Right) */}
                  <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-data-white flex items-center justify-center border border-satellite-blue/5">
                    <ChevronRight className="w-4 h-4 text-satellite-blue/40" />
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
