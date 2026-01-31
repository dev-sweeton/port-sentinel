import React, { useState, useEffect, useCallback } from 'react';
import { useRealProcessData } from '../../hooks/useRealProcessData';
import { OverviewTab } from './OverviewTab';
import { AlertsTab } from './AlertsTab';

import { SettingsModal } from './SettingsModal';
import { AlertBanner } from './AlertBanner';
import { LayoutDashboard, Bell, Cpu, ArrowUpRight, Zap, ShieldCheck, Download, Settings, RefreshCw, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToJSON, timeAgo } from '../../utils/utils';

const StatCard = ({ label, value, subtext, icon: Icon, color }) => (
    <div className="bg-gray-900/40 border border-white/10 rounded-xl p-5 backdrop-blur-sm relative overflow-hidden group">
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
            <Icon size={48} />
        </div>
        <div className="relative z-10">
            <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{label}</div>
            <div className="text-2xl font-mono font-bold text-white mb-1">{value}</div>
            <div className="text-[10px] text-gray-500">{subtext}</div>
        </div>
    </div>
);

export const Dashboard = () => {
    const { ports, globalStats, alerts, actions, settings } = useRealProcessData();
    const [activeTab, setActiveTab] = useState('overview');
    const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [currentAlert, setCurrentAlert] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    // Update last update timestamp
    useEffect(() => {
        const interval = setInterval(() => {
            setLastUpdate(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Show alert banner for critical/warning alerts
    useEffect(() => {
        if (alerts.length > 0) {
            const latestAlert = alerts[0];
            if (latestAlert.type === 'CRITICAL' || latestAlert.type === 'WARNING') {
                setCurrentAlert(latestAlert);
            }
        }
    }, [alerts]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e) => {
            // Ignore if typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                if (e.key === 'Escape') {
                    e.target.blur();
                }
                return;
            }

            switch (e.key) {
                case '?':
                    setShowKeyboardShortcuts(prev => !prev);
                    break;
                case '/':
                    e.preventDefault();
                    document.querySelector('input[type="text"]')?.focus();
                    break;
                case 'r':
                    handleRefresh();
                    break;
                case 'e':
                    handleExport();
                    break;
                case '1':
                    setActiveTab('overview');
                    break;
                case '2':
                    setActiveTab('alerts');
                    break;
                case 's':
                    actions.updateSettings({ soundEnabled: !settings.soundEnabled });
                    break;
                case 'Escape':
                    setShowKeyboardShortcuts(false);
                    setShowSettings(false);
                    setCurrentAlert(null);
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [settings, actions]);

    const handleRefresh = useCallback(() => {
        setLastUpdate(new Date());
        // In a real app, this would trigger a data refresh
    }, []);

    const handleExport = useCallback(() => {
        const exportData = {
            timestamp: new Date().toISOString(),
            ports: ports.map(p => ({
                port: p.port,
                name: p.name,
                pid: p.pid,
                status: p.status,
                cpu: p.cpu,
                memory: p.memory,
                connections: p.connections,
                totalTraffic: p.totalTraffic,
            })),
            globalStats,
            alerts: alerts.map(a => ({
                type: a.type,
                message: a.message,
                timestamp: a.timestamp,
                port: a.port,
            })),
        };
        exportToJSON(exportData, `portsentinel-${Date.now()}.json`);
    }, [ports, globalStats, alerts]);

    const tabs = [
        { id: 'overview', label: 'Live Monitor', icon: LayoutDashboard },
        { id: 'alerts', label: 'Security Alerts', icon: Bell, count: alerts.length },
    ];

    return (
        <div className="min-h-screen bg-black text-gray-300 font-sans selection:bg-cyan-500/30 transition-colors">
            <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

            {/* Alert Banner */}
            <AlertBanner
                alert={currentAlert}
                onDismiss={() => setCurrentAlert(null)}
            />

            {/* Top Navigation */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-black/50 border-b border-white/10 backdrop-blur-xl z-50 flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-tight">
                        PORT<span className="text-cyan-400">SENTINEL</span>
                    </h1>
                    <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-green-900/30 text-green-400 border border-green-500/20 font-mono">
                        LIVE MONITOR (HYBRID)
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {/* Last Updated */}
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                        <Clock size={12} />
                        Updated {timeAgo(lastUpdate)}
                    </div>

                    {/* Quick Actions */}
                    <button
                        onClick={handleRefresh}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Refresh (r)"
                    >
                        <RefreshCw size={16} className="text-gray-400 hover:text-white" />
                    </button>

                    <button
                        onClick={handleExport}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Export Data (e)"
                    >
                        <Download size={16} className="text-gray-400 hover:text-white" />
                    </button>

                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Settings"
                    >
                        <Settings size={16} className="text-gray-400 hover:text-white" />
                    </button>



                    <div className="flex items-center gap-2 text-xs font-mono text-gray-400 ml-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        SYSTEM ONLINE
                    </div>
                </div>
            </header>

            <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto relative z-10">
                {/* Global Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        label="Active Ports"
                        value={ports.length}
                        subtext={`${ports.filter(p => p.status === 'critical').length} Critical Load`}
                        icon={Zap}
                        color="text-yellow-400"
                    />
                    <StatCard
                        label="Total Traffic"
                        value={(globalStats.totalTraffic / 1024 / 1024).toFixed(1) + ' MB'}
                        subtext="Combined In/Out"
                        icon={ArrowUpRight}
                        color="text-blue-400"
                    />
                    <StatCard
                        label="Avg CPU Load"
                        value={globalStats.avgCpu + '%'}
                        subtext="System Wide"
                        icon={Cpu}
                        color="text-purple-400"
                    />
                    <StatCard
                        label="Active Alerts"
                        value={alerts.length}
                        subtext="Last 24 Hours"
                        icon={Bell}
                        color="text-red-400"
                    />
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-white/10 mb-8 flex gap-8">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-4 px-2 text-sm font-medium transition-all relative ${activeTab === tab.id
                                ? 'text-cyan-400'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <tab.icon size={16} />
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">
                                        {tab.count}
                                    </span>
                                )}
                            </div>
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'overview' && <OverviewTab ports={ports} actions={actions} />}
                        {activeTab === 'alerts' && <AlertsTab alerts={alerts} actions={actions} />}
                    </motion.div>
                </AnimatePresence>
            </main>


            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                settings={settings}
                onUpdateSettings={actions.updateSettings}
            />
        </div>
    );
};
