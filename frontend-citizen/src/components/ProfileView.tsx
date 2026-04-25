import { useState, useEffect } from 'react';
import { User, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8000/api/v1';

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

export default function ProfileView() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<BackendReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const myReportIds = JSON.parse(localStorage.getItem('my_reports') || '[]');
      
      const res = await fetch(`${API_BASE}/reports/`);
      if (!res.ok) throw new Error('Failed to fetch reports');
      const data: BackendReport[] = await res.json();
      
      // Filter only reports belonging to this device
      const myData = data.filter(r => myReportIds.includes(r.id));
      setReports(myData);
      
      // Fetch signed URLs for photos
      myData.forEach(async (report: BackendReport) => {
        if (report.photo_url && !photoUrls[report.photo_url]) {
          try {
            const urlRes = await fetch(`${API_BASE}/storage/photo-url?key=${encodeURIComponent(report.photo_url)}`);
            if (urlRes.ok) {
              const { url } = await urlRes.json();
              setPhotoUrls(prev => ({ ...prev, [report.photo_url!]: url }));
            }
          } catch (e) {
            console.error("Error fetching photo URL", e);
          }
        }
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalPoints = reports.reduce((acc, r) => acc + (r.points_awarded || 0), 0);

  return (
    <div className="h-full bg-data-white overflow-y-auto pb-24">
      <div className="p-8 pt-12 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-white border-2 border-satellite-blue/5 flex items-center justify-center shadow-sm">
            <User className="w-8 h-8 text-satellite-blue" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-satellite-blue">Citizen #4092</h2>
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
                    {report.trust_level !== 'evidence_void' ? (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/10 font-chakra text-[8px] font-bold tracking-wider uppercase">
                         Verified
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
