import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Tag, MessageSquare, Send, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

const tags = [
  { id: 'algae', label: 'Algae Bloom', icon: '🌿' },
  { id: 'chemical', label: 'Chemical Film', icon: '🛢️' },
  { id: 'trash', label: 'Litter / Trash', icon: '🚮' },
  { id: 'fish', label: 'Dead Fish', icon: '🐟' },
  { id: 'pipe', label: 'Suspicious Pipe', icon: '🏗️' },
  { id: 'smell', label: 'Strong Odor', icon: '👃' },
];

export default function ReportForm() {
  const [photo, setPhoto] = useState('');
  const [coords, setCoords] = useState<{lat: number, lng: number, accuracy: number} | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const savedPhoto = localStorage.getItem('temp_photo');
    const savedCoords = localStorage.getItem('temp_coords');
    if (savedPhoto) setPhoto(savedPhoto);
    if (savedCoords) setCoords(JSON.parse(savedCoords));
  }, []);

  const toggleTag = (id: string) => {
    setSelectedTags(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!coords) return;
    setIsSubmitting(true);
    try {
      const form = new FormData();
      form.append('latitude', String(coords.lat));
      form.append('longitude', String(coords.lng));
      form.append('gnss_accuracy_m', String(coords.accuracy));
      form.append('tags', selectedTags.join(','));
      form.append('captured_at', new Date().toISOString());
      if (comment) form.append('description', comment);

      // Attach photo blob if captured from canvas (data URL → blob)
      if (photo?.startsWith('data:')) {
        const res = await fetch(photo);
        const blob = await res.blob();
        form.append('photo', blob, 'photo.jpg');
      }

      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/v1/reports/', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });

      if (!response.ok) throw new Error('Submission failed');

      const data = await response.json();
      setPointsAwarded(data.points_awarded ?? 0);

      localStorage.removeItem('temp_photo');
      localStorage.removeItem('temp_coords');
      setIsSubmitting(false);
      setIsDone(true);
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-[#F8FAFB]">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-green-500 rounded-3xl flex items-center justify-center text-white mb-8 shadow-2xl shadow-green-500/20"
        >
          <CheckCircle2 size={48} />
        </motion.div>
        <h1 className="text-3xl font-bold mb-4 tracking-tight">Sync Complete</h1>
        <p className="text-satellite/60 mb-10 max-w-xs mx-auto">
          Your data has been broadcast to the Sentinel network.{pointsAwarded > 0 ? ` +${pointsAwarded} impact points rewarded.` : ''}
        </p>
        <button 
          onClick={() => navigate('/history')}
          className="w-full max-w-sm h-16 bg-satellite text-white font-bold rounded-2xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
        >
          VIEW LOGS
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFB] pb-32">
      <div className="p-6">
         <div className="flex items-center gap-4 mb-8">
            <button onClick={() => navigate('/home')} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center tech-border shadow-sm text-satellite/40">
               <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold tracking-tight">Report Specimen</h1>
         </div>

         {/* Photo Preview Card */}
         <div className="card-smooth overflow-hidden mb-8 border-none shadow-2xl shadow-satellite/10">
            <div className="aspect-[4/3] relative">
               {photo && <img src={photo} className="w-full h-full object-cover" alt="Pollution" />}
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-bottom p-6 flex-col justify-end">
                  <div className="flex items-center gap-2 text-white/80 font-mono text-[10px] uppercase font-bold tracking-widest bg-black/20 backdrop-blur-md px-3 py-1 rounded-full w-fit">
                     <MapPin size={12} className="text-signal" />
                     {coords?.lat.toFixed(4)}°, {coords?.lng.toFixed(4)}° • GPS Verified
                  </div>
               </div>
            </div>
         </div>

         {/* Detail Collection */}
         <div className="space-y-8">
            <section>
               <div className="flex items-center gap-2 mb-4">
                  <Tag size={16} className="text-galileo" />
                  <h3 className="text-[10px] font-bold text-satellite/40 uppercase tracking-widest">Environment Tags</h3>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${selectedTags.includes(tag.id) ? 'bg-galileo border-galileo text-white shadow-lg shadow-galileo/20' : 'bg-white border-satellite/5 text-satellite/40'}`}
                    >
                      <span className="text-xl">{tag.icon}</span>
                      <span className="text-xs font-bold leading-tight">{tag.label}</span>
                    </button>
                  ))}
               </div>
            </section>

            <section>
               <div className="flex items-center gap-2 mb-4">
                  <MessageSquare size={16} className="text-galileo" />
                  <h3 className="text-[10px] font-bold text-satellite/40 uppercase tracking-widest">Field Notes</h3>
               </div>
               <textarea 
                 value={comment}
                 onChange={(e) => setComment(e.target.value)}
                 className="w-full bg-white rounded-3xl p-6 tech-border shadow-sm min-h-[140px] text-sm text-satellite focus:outline-none focus:ring-2 focus:ring-galileo/20 transition-all placeholder:text-satellite/20"
                 placeholder="Describe the smell, range, or potential source..."
               />
            </section>
         </div>

         <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F8FAFB] via-[#F8FAFB] to-transparent z-50">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedTags.length === 0}
              className={`w-full h-16 rounded-2xl flex items-center justify-center font-bold tracking-widest uppercase transition-all shadow-xl shadow-satellite/20 ${isSubmitting || selectedTags.length === 0 ? 'bg-satellite/20 text-satellite/40 cursor-not-allowed' : 'bg-satellite text-white active:scale-95'}`}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-3">
                  <Loader2 size={24} className="animate-spin opacity-40" />
                  <span>Syncing...</span>
                </div>
              ) : (
                "Finalize Sync"
              )}
            </button>
         </div>
      </div>
    </div>
  );
}
