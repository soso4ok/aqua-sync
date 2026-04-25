import { User, ShoppingBag, Clock, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { ReportStatus, UserProfile } from '../types';
import { useNavigate } from 'react-router-dom';

const MOCK_PROFILE: UserProfile = {
  name: "Citizen #4092",
  points: 1250
};

const MOCK_REPORTS: ReportStatus[] = [
  { 
    id: '1', category: 'Algal Bloom', date: '2026-04-24', status: 'Verified', 
    description: 'Significant green coloration near the public beach area. Water seems opaque.',
    coordinates: { lat: 54.43, lng: 18.57 },
    imageUrl: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: '2', category: 'Marine Debris', date: '2026-04-20', status: 'Pending',
    description: 'Floating plastics and net fragments caught in the reeds.',
    coordinates: { lat: 54.40, lng: 18.65 },
    imageUrl: 'https://images.unsplash.com/photo-1618477430045-8f6a9179979b?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: '3', category: 'Oil Leak', date: '2026-04-15', status: 'Verified',
    description: 'Visible rainbow sheen on the surface near the industrial dock.',
    coordinates: { lat: 54.45, lng: 18.70 },
    imageUrl: 'https://images.unsplash.com/photo-15426019069d0-b4d9235e6171?auto=format&fit=crop&q=80&w=400'
  }
];

export default function ProfileView() {
  const navigate = useNavigate();

  return (
    <div className="h-full bg-data-white overflow-y-auto pb-24">
      <div className="p-8 pt-12 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-white border-2 border-satellite-blue/5 flex items-center justify-center shadow-sm">
            <User className="w-8 h-8 text-satellite-blue" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-satellite-blue">{MOCK_PROFILE.name}</h2>
          </div>
        </div>

        {/* Points Display */}
        <div className="bg-white rounded-[2.5rem] p-8 border-2 border-satellite-blue/5 shadow-sm text-center">
          <div className="flex flex-col items-center">
            <h3 className="text-6xl font-black tracking-tighter text-satellite-blue">
              {MOCK_PROFILE.points}
              <span className="text-2xl font-mono text-galileo-teal ml-2">pkt</span>
            </h3>
          </div>
        </div>

        {/* History List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-xs font-mono uppercase font-bold tracking-widest text-satellite-blue/30">History reports</h4>
            <span className="text-[10px] font-mono text-galileo-teal font-bold">{MOCK_REPORTS.length} total</span>
          </div>

          <div className="space-y-3">
            {MOCK_REPORTS.map((report) => (
              <motion.button
                key={report.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/report/${report.id}`)}
                className="w-full bg-white p-5 rounded-[1.5rem] border border-satellite-blue/5 shadow-sm hover:shadow-md transition-shadow text-left flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-data-white overflow-hidden flex-shrink-0">
                  <img src={report.imageUrl} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-sm text-satellite-blue truncate">{report.category}</h5>
                  <p className="text-[10px] font-mono text-satellite-blue/30 mt-0.5">{report.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  {report.status === 'Verified' ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-600 border border-green-100 italic font-mono text-[9px] font-bold">
                       <CheckCircle2 className="w-3 h-3" />
                       Verified
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 italic font-mono text-[9px] font-bold">
                       <Clock className="w-3 h-3" />
                       Pending
                    </div>
                  )}
                  <ChevronRight className="w-4 h-4 text-satellite-blue/10" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
