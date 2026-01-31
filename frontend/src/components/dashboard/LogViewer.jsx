import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Terminal, Pause, Play, Trash2, Download, Copy, Search,
    Filter, X, ChevronDown, ChevronUp, FileText, Minimize2
} from 'lucide-react';
import { useLogStream } from '../../hooks/useLogStream';

export const LogViewer = ({ pid, processName, port, onClose }) => {
    const { logs, stats, isPaused, togglePause, clearLogs } = useLogStream(pid, processName);
    const [searchTerm, setSearchTerm] = useState('');
    const [levelFilter, setLevelFilter] = useState('ALL');
    const [autoScroll, setAutoScroll] = useState(true);
    const logsContainerRef = useRef(null);

    // Filter logic
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesLevel = levelFilter === 'ALL' || log.level === levelFilter;
            return matchesSearch && matchesLevel;
        });
    }, [logs, searchTerm, levelFilter]);

    // Auto-scroll logic
    useEffect(() => {
        if (autoScroll && logsContainerRef.current) {
            const { scrollHeight, clientHeight } = logsContainerRef.current;
            logsContainerRef.current.scrollTo({
                top: scrollHeight - clientHeight,
                behavior: 'smooth'
            });
        }
    }, [filteredLogs, autoScroll]);

    // Handle scroll to detect user scrolling up
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const isAtBottom = scrollHeight - scrollTop === clientHeight;
        if (!isAtBottom) {
            setAutoScroll(false);
        } else {
            setAutoScroll(true);
        }
    };

    // Utils
    const copyToClipboard = () => {
        const text = filteredLogs.map(l => `[${l.timestamp}] [${l.level}] ${l.message}`).join('\n');
        navigator.clipboard.writeText(text);
    };

    const downloadLogs = () => {
        const text = filteredLogs.map(l => `[${l.timestamp}] [${l.level}] ${l.message}`).join('\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `port_sentinel_${processName}_${pid}.log`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getLevelColor = (level) => {
        switch (level) {
            case 'ERROR': return 'text-red-400';
            case 'WARN': return 'text-yellow-400';
            case 'INFO': return 'text-blue-400';
            case 'DEBUG': return 'text-gray-400';
            default: return 'text-white';
        }
    };

    return (
        <div className="flex flex-col h-[500px] bg-[#0D1117] rounded-xl border border-white/10 overflow-hidden shadow-2xl animate-in slide-in-from-top-2 duration-300">
            {/* Header / Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <Terminal size={16} className="text-cyan-400" />
                    <span className="font-mono text-sm font-bold text-gray-200">
                        {processName} <span className="text-gray-500">({pid})</span>
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30 capitalize">
                        Live
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative group">
                        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-md py-1 pl-8 pr-2 text-xs text-white focus:outline-none focus:border-cyan-500 w-32 focus:w-48 transition-all"
                        />
                    </div>

                    {/* Level Filter */}
                    <select
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-md py-1 px-2 text-xs text-gray-300 focus:outline-none focus:border-cyan-500"
                    >
                        <option value="ALL">All Levels</option>
                        <option value="INFO">Info</option>
                        <option value="WARN">Warn</option>
                        <option value="ERROR">Error</option>
                        <option value="DEBUG">Debug</option>
                    </select>

                    <div className="h-4 w-px bg-white/10 mx-1"></div>

                    {/* Actions */}
                    <button onClick={togglePause} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white" title={isPaused ? "Resume" : "Pause"}>
                        {isPaused ? <Play size={14} /> : <Pause size={14} />}
                    </button>
                    <button onClick={clearLogs} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-red-400" title="Clear">
                        <Trash2 size={14} />
                    </button>
                    <button onClick={copyToClipboard} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white" title="Copy All">
                        <Copy size={14} />
                    </button>
                    <button onClick={downloadLogs} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white" title="Download">
                        <Download size={14} />
                    </button>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white ml-2" title="Close">
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Log Content */}
            <div
                ref={logsContainerRef}
                className="flex-1 overflow-auto p-4 font-mono text-xs space-y-1 custom-scrollbar scroll-smooth"
                onScroll={handleScroll}
            >
                {filteredLogs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600">
                        <FileText size={48} className="opacity-20 mb-4" />
                        <p>No logs to display</p>
                    </div>
                ) : (
                    filteredLogs.map((log, index) => (
                        <div key={log.id} className="flex gap-3 hover:bg-white/5 px-1 rounded transition-colors group leading-5">
                            {/* Line Number */}
                            <span className="text-gray-700 w-8 text-right select-none">{index + 1}</span>

                            {/* Timestamp */}
                            <span className="text-gray-500 select-none">
                                {new Date(log.timestamp).toLocaleTimeString()}
                            </span>

                            {/* Level */}
                            <span className={`w-12 font-bold ${getLevelColor(log.level)} select-none`}>
                                {log.level}
                            </span>

                            {/* Message */}
                            <span className="text-gray-300 break-all whitespace-pre-wrap">
                                {log.message}
                            </span>
                        </div>
                    ))
                )}
            </div>

            {/* Footer / Stats */}
            <div className="bg-gray-900 border-t border-white/10 px-4 py-1.5 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                <div className="flex gap-4">
                    <span>Total: {logs.length}</span>
                    <span className="text-blue-400">Info: {stats.info}</span>
                    <span className="text-yellow-400">Warn: {stats.warn}</span>
                    <span className="text-red-400">Error: {stats.error}</span>
                </div>
                <div>
                    {autoScroll ? 'Autoscroll On' : 'Autoscroll Paused'}
                </div>
            </div>
        </div>
    );
};
