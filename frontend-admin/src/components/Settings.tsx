import { useState } from 'react';
import { 
  Bell, 
  User, 
  Map as MapIcon, 
  Lock, 
  Eye, 
  Globe, 
  Save,
  CheckCircle2,
  Trash2,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'system'>('profile');
  const [showSavedToast, setShowSavedToast] = useState(false);

  const handleSave = () => {
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-10">
        <h2 className="text-3xl font-bold tracking-tight text-satellite-blue">System Settings</h2>
        <p className="text-satellite-blue/50">Manage your AquaSync configuration and personal preferences.</p>
      </div>

      <div className="flex gap-8">
        {/* Navigation Sidebar */}
        <div className="w-64 space-y-1">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'system', label: 'Map & Systems', icon: MapIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                activeTab === tab.id 
                  ? 'bg-satellite-blue text-white shadow-lg' 
                  : 'text-satellite-blue/60 hover:bg-data-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
          <div className="pt-8 mt-8 border-t border-satellite-blue/5 invisible">
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-[2rem] p-10 border border-satellite-blue/5 shadow-sm min-h-[500px]">
          {activeTab === 'profile' && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-full bg-galileo-teal/10 flex items-center justify-center border-2 border-dashed border-galileo-teal">
                   <User className="w-10 h-10 text-galileo-teal" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-satellite-blue/40 ml-1">Full Name</label>
                  <input type="text" defaultValue="Admin Analyst" className="w-full px-4 py-3 rounded-xl bg-data-white border-transparent focus:bg-white focus:border-galileo-teal focus:ring-4 focus:ring-galileo-teal/5 outline-none transition-all text-satellite-blue" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-satellite-blue/40 ml-1">Email Address</label>
                  <input type="email" defaultValue="analyst@aquasync.io" className="w-full px-4 py-3 rounded-xl bg-data-white border-transparent focus:bg-white focus:border-galileo-teal focus:ring-4 focus:ring-galileo-teal/5 outline-none transition-all text-satellite-blue" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-satellite-blue/40 ml-1">Role Description</label>
                <textarea rows={3} defaultValue="Senior Data Officer responsible for the Nordic and Baltic command regions. Overseeing Sentinel-2 indices reconcilement." className="w-full px-4 py-3 rounded-xl bg-data-white border-transparent focus:bg-white focus:border-galileo-teal focus:ring-4 focus:ring-galileo-teal/5 outline-none transition-all text-satellite-blue resize-none" />
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                 <h4 className="text-sm font-bold uppercase tracking-widest text-satellite-blue/40">Alert Channels</h4>
                 {[
                   { label: 'Satellite Anomaly Alerts', desc: 'Notify when Sentinel-2 detects NDWI spikes.', enabled: true },
                   { label: 'Daily System Status', desc: 'Summary of synchronization and GNSS accuracy.', enabled: false },
                 ].map((item) => (
                   <div key={item.label} className="flex items-center justify-between p-4 rounded-2xl bg-data-white/50 border border-satellite-blue/5">
                      <div>
                         <p className="text-sm font-bold text-satellite-blue">{item.label}</p>
                         <p className="text-xs text-satellite-blue/40">{item.desc}</p>
                      </div>
                      <button className={`w-12 h-6 rounded-full transition-all relative ${item.enabled ? 'bg-galileo-teal' : 'bg-satellite-blue/10'}`}>
                         <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${item.enabled ? 'right-1' : 'left-1'}`} />
                      </button>
                   </div>
                 ))}
              </div>

              {/* Warning Thresholds Removed */}
            </motion.div>
          )}

          {activeTab === 'system' && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
               <div className="grid grid-cols-1 gap-6">
                  <div className="p-6 rounded-2xl bg-satellite-blue text-white shadow-xl relative overflow-hidden">
                     <Globe className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5" />
                     <h5 className="font-bold mb-2">Coordinate System</h5>
                     <select className="w-full bg-white/10 border-none rounded-lg text-sm p-2 outline-none">
                        <option>Decimal Degrees (WGS84)</option>
                        <option>DMS Formatted</option>
                        <option>UTM Zone 34N</option>
                     </select>
                  </div>
               </div>

               {/* Visible Map Layers Removed */}
            </motion.div>
          )}

          <div className="mt-12 pt-8 border-t border-satellite-blue/5 flex justify-end gap-4">
             <button className="px-6 py-3 rounded-xl text-sm font-bold text-satellite-blue/60 hover:bg-data-white transition-all">Cancel</button>
             <button 
                onClick={handleSave}
                className="px-8 py-3 rounded-xl bg-satellite-blue text-white text-sm font-bold shadow-lg hover:bg-galileo-teal transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Changes
             </button>
          </div>
        </div>
      </div>

      {showSavedToast && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-10 right-10 bg-satellite-blue text-white px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3 border border-white/10"
        >
          <CheckCircle2 className="w-5 h-5 text-galileo-teal" />
          <span className="font-bold text-sm tracking-tight">Configuration Synchronized</span>
        </motion.div>
      )}
    </div>
  );
}
