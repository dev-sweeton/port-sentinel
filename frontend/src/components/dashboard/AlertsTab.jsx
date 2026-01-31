import React, { useState } from 'react';
import { AlertTriangle, Info, AlertOctagon, CheckCircle, X, ShieldAlert, Trash2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { timeAgo } from '../../utils/utils';

const AlertIcon = ({ type }) => {
    switch (type) {
        case 'CRITICAL': return <AlertOctagon className="text-red-500" size={20} />;
        case 'WARNING': return <AlertTriangle className="text-yellow-500" size={20} />;
        case 'UNUSUAL': return <ShieldAlert className="text-orange-500" size={20} />;
        default: return <Info className="text-blue-500" size={20} />;
    }
};

export const AlertsTab = ({ alerts, actions }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    const filteredAlerts = alerts.filter(alert => {
        const matchesSearch = alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            alert.port.toString().includes(searchTerm);
        const matchesType = filterType === 'all' || alert.type === filterType;
        return matchesSearch && matchesType;
    });

    const alertCounts = {
        CRITICAL: alerts.filter(a => a.type === 'CRITICAL').length,
        WARNING: alerts.filter(a => a.type === 'WARNING').length,
        UNUSUAL: alerts.filter(a => a.type === 'UNUSUAL').length,
        INFO: alerts.filter(a => a.type === 'INFO').length,
    };

    const threatLevel = alertCounts.CRITICAL > 0 ? 'HIGH' :
        alertCounts.WARNING > 3 ? 'MEDIUM' : 'LOW';

    const threatColors = {
        HIGH: 'text-red-400 border-red-500',
        MEDIUM: 'text-yellow-400 border-yellow-500',
        LOW: 'text-green-400 border-green-500',
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
                {/* Toolbar */}
                <div className="bg-gray-900/40 border border-white/10 rounded-xl p-4 backdrop-blur-md">
                    <div className="flex items-center gap-4 flex-wrap">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input
                                type="text"
                                placeholder="Search alerts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white w-full focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                        </div>

                        {/* Type Filter */}
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                        >
                            <option value="all" className="bg-gray-900">All Types</option>
                            <option value="CRITICAL" className="bg-gray-900">Critical</option>
                            <option value="WARNING" className="bg-gray-900">Warning</option>
                            <option value="UNUSUAL" className="bg-gray-900">Unusual</option>
                            <option value="INFO" className="bg-gray-900">Info</option>
                        </select>

                        {/* Clear All */}
                        {alerts.length > 0 && (
                            <button
                                onClick={actions.clearAllAlerts}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
                            >
                                <Trash2 size={14} />
                                Clear All
                            </button>
                        )}
                    </div>
                </div>

                {/* Alert Feed */}
                <div className="bg-gray-900/40 border border-white/10 rounded-xl p-6 backdrop-blur-md">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-yellow-500" />
                        Live Security Feed
                        <span className="ml-auto text-xs text-gray-500 font-normal">
                            {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}
                        </span>
                    </h3>

                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                        <AnimatePresence>
                            {filteredAlerts.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <CheckCircle className="mx-auto mb-3 opacity-20" size={48} />
                                    {searchTerm || filterType !== 'all' ? 'No alerts match your filters' : 'No active alerts. System is secure.'}
                                </div>
                            ) : (
                                filteredAlerts.map((alert) => (
                                    <motion.div
                                        key={alert.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                        className={`relative p-4 rounded-lg border flex items-start gap-4 transition-colors ${alert.type === 'CRITICAL' ? 'bg-red-900/10 border-red-500/20' :
                                                alert.type === 'WARNING' ? 'bg-yellow-900/10 border-yellow-500/20' :
                                                    alert.type === 'UNUSUAL' ? 'bg-orange-900/10 border-orange-500/20' :
                                                        'bg-gray-800/30 border-white/5'
                                            }`}
                                    >
                                        <div className="mt-1 flex-shrink-0">
                                            <AlertIcon type={alert.type} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className={`text-sm font-bold ${alert.type === 'CRITICAL' ? 'text-red-400' :
                                                                alert.type === 'WARNING' ? 'text-yellow-400' :
                                                                    alert.type === 'UNUSUAL' ? 'text-orange-400' : 'text-blue-400'
                                                            }`}>
                                                            {alert.type} ALERT
                                                        </h4>
                                                        <span className="text-[10px] text-gray-500 font-mono">
                                                            {timeAgo(alert.timestamp)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-300 mt-1">{alert.message}</p>
                                                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 font-mono">
                                                        <span>Port: {alert.port}</span>
                                                        {alert.portName && (
                                                            <>
                                                                <span>•</span>
                                                                <span>{alert.portName}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => actions.dismissAlert(alert.id)}
                                                    className="text-gray-500 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
                                                    title="Dismiss alert"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
                {/* Threat Level */}
                <div className="bg-gray-900/40 border border-white/10 rounded-xl p-6 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Threat Level</h3>
                    <div className="flex items-center justify-center p-8">
                        <div className={`relative w-32 h-32 flex items-center justify-center rounded-full border-4 ${threatColors[threatLevel]}`}>
                            <div className={`text-2xl font-bold ${threatColors[threatLevel].split(' ')[0]}`}>
                                {threatLevel}
                            </div>
                            <div className={`absolute inset-0 rounded-full border-t-4 ${threatColors[threatLevel].split(' ')[1]} animate-spin transition-all duration-[3s]`}></div>
                        </div>
                    </div>
                    <div className="space-y-2 mt-4">
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>Critical Events</span>
                            <span className="text-red-400 font-bold">{alertCounts.CRITICAL}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>Warnings</span>
                            <span className="text-yellow-400 font-bold">{alertCounts.WARNING}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>Unusual Activity</span>
                            <span className="text-orange-400 font-bold">{alertCounts.UNUSUAL}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>Info Messages</span>
                            <span className="text-blue-400 font-bold">{alertCounts.INFO}</span>
                        </div>
                    </div>
                </div>

                {/* Alert Timeline */}
                <div className="bg-gray-900/40 border border-white/10 rounded-xl p-6 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                        {alerts.slice(0, 5).map((alert, index) => (
                            <div key={alert.id} className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${alert.type === 'CRITICAL' ? 'bg-red-500' :
                                        alert.type === 'WARNING' ? 'bg-yellow-500' :
                                            alert.type === 'UNUSUAL' ? 'bg-orange-500' : 'bg-blue-500'
                                    }`}></div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-gray-300 truncate">{alert.message}</div>
                                    <div className="text-[10px] text-gray-500 mt-0.5">{timeAgo(alert.timestamp)}</div>
                                </div>
                            </div>
                        ))}
                        {alerts.length === 0 && (
                            <div className="text-xs text-gray-500 text-center py-4">No recent activity</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
