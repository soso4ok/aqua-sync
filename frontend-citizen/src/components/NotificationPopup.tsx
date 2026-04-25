import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ErrorPopupProps {
    message: string;
    type?: 'error' | 'success';
    onClose: () => void;
    isVisible: boolean;
}

export default function NotificationPopup({ message, type = 'error', onClose, isVisible }: ErrorPopupProps) {
    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                    />
                    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[101] px-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="pointer-events-auto w-full max-w-sm bg-white rounded-[32px] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.2)] border border-black/5"
                        >
                            <div className="p-8 flex flex-col items-center text-center">
                                <div className={`w-16 h-16 rounded-full mb-6 flex items-center justify-center ${type === 'error' ? 'bg-red-50 text-red-500' : 'bg-teal-50 text-teal-500'
                                    }`}>
                                    {type === 'error' ? (
                                        <AlertCircle className="w-8 h-8" />
                                    ) : (
                                        <CheckCircle2 className="w-8 h-8" />
                                    )}
                                </div>

                                <h3 className={`text-xl font-chakra font-bold mb-3 tracking-wide uppercase ${type === 'error' ? 'text-red-900' : 'text-teal-900'
                                    }`}>
                                    {type === 'error' ? 'Operation Failed' : 'Success'}
                                </h3>

                                <p className="text-satellite-blue/70 text-sm leading-relaxed mb-8">
                                    {message}
                                </p>

                                <button
                                    onClick={onClose}
                                    className={`w-full py-4 rounded-2xl font-bold tracking-widest text-sm transition-all active:scale-[0.98] ${type === 'error'
                                            ? 'bg-red-900 text-white shadow-[0_10px_30px_rgba(153,27,27,0.3)]'
                                            : 'bg-teal-900 text-white shadow-[0_10px_30px_rgba(19,78,74,0.3)]'
                                        }`}
                                >
                                    DISMISS
                                </button>
                            </div>

                            {/* Close button top right */}
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 text-black/20 hover:text-black/40 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
