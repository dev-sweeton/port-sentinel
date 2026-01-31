import React from 'react';
import { X, Wifi, Clock, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDuration } from '../../utils/utils';

const ConnectionStateBadge = ({ state }) => {
    const colors = {
        ESTABLISHED: 'bg-green-500/20 text-green-400 border-green-500/30',
        LISTENING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        TIME_WAIT: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        CLOSE_WAIT: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        SYN_SENT: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    };

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${colors[state] || colors.ESTABLISHED}`}>
            {state}
        </span>
    );
};

export const ConnectionModal = ({ isOpen, onClose, port }) => {
    if (!isOpen || !port) return null;

    const newConnections = port.connectionList?.filter(c => c.isNew) || [];
    const allConnections = port.connectionList || [];

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
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[80vh] bg-gray-900 border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border-b border-white/10 p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                    <Wifi className="text-cyan-400" size={24} />
                                    Active Connections
                                </h2>
                                <p className="text-sm text-gray-400 mt-1">
                                    Port <span className="font-mono text-cyan-400">{port.port}</span> • {port.name}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Stats Bar */}
                        <div className="bg-black/40 border-b border-white/5 p-4 grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white font-mono">{allConnections.length}</div>
                                <div className="text-xs text-gray-400 uppercase">Total Connections</div>
                            </div>
                            <div className="text-center border-x border-white/10">
                                <div className="text-2xl font-bold text-green-400 font-mono">
                                    {allConnections.filter(c => c.state === 'ESTABLISHED').length}
                                </div>
                                <div className="text-xs text-gray-400 uppercase">Established</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-cyan-400 font-mono flex items-center justify-center gap-2">
                                    {newConnections.length}
                                    {newConnections.length > 0 && (
                                        <span className="flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-cyan-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-400 uppercase">New (5s)</div>
                            </div>
                        </div>

                        {/* Connection List */}
                        <div className="overflow-y-auto max-h-[400px] p-4">
                            {allConnections.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Wifi className="mx-auto mb-3 opacity-20" size={48} />
                                    No active connections
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {allConnections.map((conn) => (
                                        <motion.div
                                            key={conn.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`p-4 rounded-lg border transition-all ${conn.isNew
                                                    ? 'bg-cyan-900/20 border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                                                    : 'bg-gray-800/40 border-white/5 hover:border-white/10'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <MapPin size={14} className="text-gray-500" />
                                                        <span className="font-mono text-sm text-white">{conn.remoteIP}</span>
                                                        {conn.isNew && (
                                                            <span className="px-2 py-0.5 bg-cyan-500 text-black text-[10px] font-bold rounded uppercase animate-pulse">
                                                                NEW
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                                        <div className="flex items-center gap-1">
                                                            <Clock size={12} />
                                                            <span>{formatDuration(conn.duration)}</span>
                                                        </div>
                                                        <ConnectionStateBadge state={conn.state} />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="bg-black/40 border-t border-white/10 p-4 flex justify-end">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
