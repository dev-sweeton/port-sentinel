import React, { useEffect } from 'react';
import { X, AlertTriangle, AlertOctagon, Info, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AlertIcon = ({ type, size = 20 }) => {
    switch (type) {
        case 'CRITICAL':
            return <AlertOctagon className="text-red-400" size={size} />;
        case 'WARNING':
            return <AlertTriangle className="text-yellow-400" size={size} />;
        case 'UNUSUAL':
            return <ShieldAlert className="text-orange-400" size={size} />;
        default:
            return <Info className="text-blue-400" size={size} />;
    }
};

export const AlertBanner = ({ alert, onDismiss }) => {
    useEffect(() => {
        if (!alert || alert.type === 'INFO') return;

        // Auto-dismiss after 8 seconds for non-critical alerts
        if (alert.type !== 'CRITICAL') {
            const timer = setTimeout(() => {
                onDismiss();
            }, 8000);

            return () => clearTimeout(timer);
        }
    }, [alert, onDismiss]);

    if (!alert) return null;

    const bgColors = {
        CRITICAL: 'from-red-900/90 to-red-800/90 border-red-500/50',
        WARNING: 'from-yellow-900/90 to-yellow-800/90 border-yellow-500/50',
        UNUSUAL: 'from-orange-900/90 to-orange-800/90 border-orange-500/50',
        INFO: 'from-blue-900/90 to-blue-800/90 border-blue-500/50',
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`fixed top-20 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl mx-auto`}
            >
                <div className={`bg-gradient-to-r ${bgColors[alert.type]} border backdrop-blur-xl rounded-xl shadow-2xl p-4 flex items-start gap-4`}>
                    <div className="flex-shrink-0 mt-0.5">
                        <AlertIcon type={alert.type} size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                                    {alert.type} ALERT
                                </h3>
                                <p className="text-sm text-white/90 mt-1">{alert.message}</p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-white/60">
                                    <span className="font-mono">Port: {alert.port}</span>
                                    <span>•</span>
                                    <span>{alert.timestamp.toLocaleTimeString()}</span>
                                </div>
                            </div>
                            <button
                                onClick={onDismiss}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white flex-shrink-0"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
