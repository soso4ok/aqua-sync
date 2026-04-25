import { useState } from 'react';
import { ShoppingBag, Search, ChevronRight, Zap, Gift, ShieldCheck, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ShopItem } from '../types';
import { useNavigate } from 'react-router-dom';

const MOCK_ITEMS: ShopItem[] = [
  { id: '1', name: 'Premium Data access', price: 500, category: 'Digital', imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=200' },
  { id: '2', name: 'Ocean Protect Tee', price: 1200, category: 'Merch', imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=200' },
  { id: '3', name: 'Priority Validation', price: 300, category: 'Perks', imageUrl: 'https://images.unsplash.com/photo-1518112391131-993d691f11cb?auto=format&fit=crop&q=80&w=200' },
  { id: '4', name: 'Water Filter Pack', price: 2000, category: 'Gear', imageUrl: 'https://images.unsplash.com/photo-1617468165799-aabc7f26715b?auto=format&fit=crop&q=80&w=200' },
];

const CATEGORIES = ['All', 'Digital', 'Merch', 'Perks', 'Gear'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 20 }
  }
};

export default function ShopView() {
  const [activeTab, setActiveTab] = useState('All');
  const navigate = useNavigate();

  const filteredItems = MOCK_ITEMS.filter(item => activeTab === 'All' || item.category === activeTab);

  return (
    <div className="h-full bg-data-white overflow-y-auto pb-32">
      {/* Header */}
      <div className="p-8 pt-12 space-y-8">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-4"
        >
           <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-satellite-blue shadow-sm border border-satellite-blue/5 active:scale-90 transition-transform"
           >
              <ArrowLeft className="w-5 h-5" />
           </button>
           <h2 className="text-3xl font-bold tracking-tight text-satellite-blue font-chakra italic uppercase">Shop</h2>
        </motion.div>

        {/* Categories / Filters */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        >
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-5 py-2.5 rounded-xl text-[10px] uppercase font-mono tracking-widest font-bold whitespace-nowrap transition-all border ${
                activeTab === cat 
                  ? 'bg-satellite-blue text-white border-satellite-blue' 
                  : 'bg-white text-satellite-blue/40 border-satellite-blue/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Items Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          key={activeTab}
          className="grid grid-cols-2 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                variants={itemVariants}
                whileTap={{ scale: 0.98 }}
                className="bg-white p-3 rounded-[1.5rem] border border-satellite-blue/10 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="aspect-square rounded-xl bg-data-white overflow-hidden mb-3 relative group">
                   <img src={item.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                   <div className="absolute inset-0 bg-satellite-blue/0 group-hover:bg-satellite-blue/10 transition-colors" />
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-[11px] text-satellite-blue leading-tight truncate px-1">{item.name}</h5>
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-mono font-bold text-galileo-teal">{item.price}</span>
                      <span className="text-[8px] font-mono text-satellite-blue/40">pkt</span>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-data-white flex items-center justify-center">
                      <ChevronRight className="w-3.5 h-3.5 text-satellite-blue/40" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
