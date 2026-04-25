import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, MapPin, Clock, Tag, Check, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { getApiUrl } from '../apiConfig';
import NotificationPopup from './NotificationPopup';

export default function ConfirmationView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { imgSrc } = location.state || {};

  const [description, setDescription] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [address, setAddress] = useState('Fetching location...');
  const [coords, setCoords] = useState<{ lat: number, lng: number, accuracy: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'error' | 'success', isVisible: boolean }>({
    message: '',
    type: 'error',
    isVisible: false
  });

  const showError = (message: string) => {
    setNotification({ message, type: 'error', isVisible: true });
  };

  useEffect(() => {
    if (!imgSrc) {
      navigate('/');
      return;
    }

    const now = new Date();
    setCurrentTime(now.toISOString());

    // Real location fetching
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          setAddress(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setAddress('Location unavailable');
        },
        { enableHighAccuracy: true }
      );
    } else {
      setAddress('Geolocation not supported');
    }
  }, [imgSrc, navigate]);

  const tags = [
    { id: 'algae', label: 'Algal Bloom' },
    { id: 'chemical', label: 'Oil Slick' },
    { id: 'trash', label: 'Waste' },
    { id: 'fish', label: 'Dead Fish' },
    { id: 'pipe', label: 'Drainage Pipe' },
  ];
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (id: string) => {
    setSelectedTags(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleConfirm = async () => {
    if (!coords || !imgSrc) return;
    setIsSubmitting(true);

    try {
      // 1. Get Presigned URL
      const storageUrl = getApiUrl('/api/v1/storage/presigned-upload?content_type=image/jpeg');
      const storageRes = await fetch(storageUrl);
      if (!storageRes.ok) {
        const msg = await parseError(storageRes);
        throw new Error(msg);
      }
      const { upload_url, key } = await storageRes.json();

      // 2. Upload Image
      const blob = await (await fetch(imgSrc)).blob();
      const uploadRes = await fetch(upload_url, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': 'image/jpeg' }
      });
      if (!uploadRes.ok) throw new Error('Failed to upload image to storage');

      // 3. Create Report
      const formData = new FormData();
      formData.append('latitude', coords.lat.toString());
      formData.append('longitude', coords.lng.toString());
      formData.append('gnss_accuracy_m', coords.accuracy.toString());
      formData.append('description', description);
      formData.append('tags', selectedTags.join(','));
      formData.append('captured_at', currentTime);
      formData.append('photo_key', key);

      const reportUrl = getApiUrl('/api/v1/reports/');
      const reportRes = await fetch(reportUrl, {
        method: 'POST',
        body: formData,
      });

      if (!reportRes.ok) {
        const msg = await parseError(reportRes);
        throw new Error(msg);
      }

      const newReport = await reportRes.json();
      const myReports = JSON.parse(localStorage.getItem('my_reports') || '[]');
      myReports.push(newReport.id);
      localStorage.setItem('my_reports', JSON.stringify(myReports));

      navigate('/profile');
    } catch (error: any) {
      console.error('Submission error:', error);
      showError(error.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parseError = async (res: Response) => {
    try {
      const errorData = await res.json();
      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          return errorData.detail.map((err: any) => `${err.loc.join('.')}: ${err.msg}`).join(' | ');
        }
        return typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
      }
      return 'Server error occurred';
    } catch {
      return `Connection error (${res.status})`;
    }
  };

  if (!imgSrc) return null;

  return (
    <div className="flex flex-col h-screen bg-data-white overflow-y-auto pb-10">
      {/* Image Header */}
      <div className="relative h-2/5 min-h-[300px] w-full bg-black shrink-0">
        <img src={imgSrc} alt="captured" className="h-full w-full object-cover" />
        <button
          onClick={() => navigate(-1)}
          disabled={isSubmitting}
          className="absolute top-6 left-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 active:scale-90 transition-transform disabled:opacity-50"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Location & Time */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-satellite-blue">
            <div className="w-8 h-8 rounded-full bg-galileo-teal/10 flex items-center justify-center text-galileo-teal">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs uppercase font-mono tracking-wider opacity-60">Location</p>
              <p className="font-semibold">{address}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-satellite-blue">
            <div className="w-8 h-8 rounded-full bg-galileo-teal/10 flex items-center justify-center text-galileo-teal">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs uppercase font-mono tracking-wider opacity-60">Captured At</p>
              <p className="font-semibold text-sm">{new Date(currentTime).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Description Box */}
        <div className="space-y-2">
          <label htmlFor="description" className="text-xs uppercase font-mono tracking-wider opacity-60 pl-1">
            Description (Optional)
          </label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            placeholder="Add more details about what you're reporting..."
            className="w-full bg-white border border-satellite-blue/10 rounded-2xl p-4 focus:ring-2 focus:ring-galileo-teal/20 focus:border-galileo-teal outline-none transition-all placeholder:text-satellite-blue/30 disabled:bg-gray-50"
          />
        </div>

        {/* Tags */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs uppercase font-mono tracking-wider opacity-60 pl-1">
            <Tag className="w-3 h-3" />
            <span>Tags</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedTags.includes(tag.id)
                  ? 'bg-galileo-teal text-white shadow-md shadow-galileo-teal/20'
                  : 'bg-white border border-satellite-blue/10 text-satellite-blue/60'
                  } disabled:opacity-50`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Confirm Button */}
      <div className="p-6 pt-0">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleConfirm}
          disabled={isSubmitting || !coords}
          className="w-full h-14 bg-satellite-blue text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-satellite-blue/20 active:bg-satellite-blue/90 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Check className="w-5 h-5" />
          )}
          {isSubmitting ? 'Uploading...' : 'Confirm Report'}
        </motion.button>
        {!coords && !isSubmitting && (
          <p className="text-center text-[10px] text-signal-coral mt-2 font-mono">Waiting for GPS fix...</p>
        )}
      </div>

      <NotificationPopup
        isVisible={notification.isVisible}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}
