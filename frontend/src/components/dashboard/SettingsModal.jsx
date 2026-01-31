import React from 'react';
import { X, Settings as SettingsIcon, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SettingsModal = ({ isOpen, onClose, settings, onUpdateSettings }) => {
    if (!isOpen) return null;



    const toggleSound = () => {
        onUpdateSettings({ soundEnabled: !settings.soundEnabled });
    };

    const toggleAutoRefresh = () => {
        onUpdateSettings({ autoRefresh: !settings.autoRefresh });
    };

    const setRefreshInterval = (interval) => {
        onUpdateSettings({ refreshInterval: interval });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-gray-900 border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border-b border-white/10 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <SettingsIcon className="text-indigo-400" size={24} />
                                <h2 className="text-xl font-bold text-white">Settings</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Settings List */}
                        <div className="p-6 space-y-6">


                            {/* Sound Notifications */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {settings.soundEnabled ? <Volume2 size={20} className="text-green-400" /> : <VolumeX size={20} className="text-gray-400" />}
                                    <div>
                                        <div className="text-sm font-medium text-white">Alert Sounds</div>
                                        <div className="text-xs text-gray-400">
                                            {settings.soundEnabled ? 'Enabled' : 'Disabled'}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleSound}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${settings.soundEnabled ? 'bg-green-500' : 'bg-gray-600'
                                        }`}
                                >
                                    <motion.div
                                        className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-lg"
                                        animate={{ x: settings.soundEnabled ? 28 : 0 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    />
                                </button>
                            </div>

                            {/* Auto Refresh */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <RefreshCw size={20} className={settings.autoRefresh ? 'text-cyan-400' : 'text-gray-400'} />
                                    <div>
                                        <div className="text-sm font-medium text-white">Auto Refresh</div>
                                        <div className="text-xs text-gray-400">
                                            {settings.autoRefresh ? 'Enabled' : 'Disabled'}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleAutoRefresh}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${settings.autoRefresh ? 'bg-cyan-500' : 'bg-gray-600'
                                        }`}
                                >
                                    <motion.div
                                        className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-lg"
                                        animate={{ x: settings.autoRefresh ? 28 : 0 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    />
                                </button>
                            </div>

                            {/* Refresh Interval */}
                            <div>
                                <div className="text-sm font-medium text-white mb-3">Refresh Interval</div>
                                <div className="grid grid-cols-3 gap-2">
                                    {[1000, 1500, 3000].map((interval) => (
                                        <button
                                            key={interval}
                                            onClick={() => setRefreshInterval(interval)}
                                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${settings.refreshInterval === interval
                                                ? 'bg-cyan-500 text-black'
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                                }`}
                                        >
                                            {interval / 1000}s
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-black/40 border-t border-white/10 p-4 flex justify-end">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
