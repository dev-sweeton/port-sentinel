import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Pause, Play, Square, CheckSquare, Filter, Zap, RotateCcw, ShieldCheck, Globe, AlertTriangle, Search, X } from 'lucide-react';

const COMMON_PORTS = [3000, 8000, 8080, 5173, 5000];

const ProcessTable = ({ showToast }) => {
    const queryClient = useQueryClient();
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [confirmKill, setConfirmKill] = useState(null);
    const [selectedPids, setSelectedPids] = useState(new Set());
    const [quickSelectOpen, setQuickSelectOpen] = useState(false);
    const [ghostRows, setGhostRows] = useState([]); // Array of { ...process, killedAt: timestamp }
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch Processes
    const { data: processes = [], isError, error } = useQuery({
        queryKey: ['processes'],
        queryFn: async () => {
            const res = await fetch('/api/processes');
            if (!res.ok) throw new Error('Failed to fetch processes');
            return res.json();
        },
        refetchInterval: autoRefresh ? 3000 : false,
        retry: false
    });

    if (isError) {
        showToast(`Connection Error: ${error.message}. Is backend running?`);
    }

    // Filtered processes based on search term
    const filteredProcesses = useMemo(() => {
        if (!searchTerm) return processes;
        const lowSearch = searchTerm.toLowerCase();
        return processes.filter(p =>
            (p.name && p.name.toLowerCase().includes(lowSearch)) ||
            (p.pid && p.pid.toString().includes(lowSearch)) ||
            (p.port && p.port.toString().includes(lowSearch)) ||
            (p.commandPath && p.commandPath.toLowerCase().includes(lowSearch))
        );
    }, [processes, searchTerm]);

    // Helper to add ghost row
    const addGhostRow = (pid) => {
        const proc = processes.find(p => p.pid === pid);
        if (proc) {
            setGhostRows(prev => [...prev, { ...proc, killedAt: Date.now() }]);
            // Remove after 30s
            setTimeout(() => {
                setGhostRows(prev => prev.filter(p => p.pid !== pid));
            }, 30000);
        }
    };

    // Single Kill Mutation
    const killMutation = useMutation({
        mutationFn: async (pid) => {
            const res = await fetch('/api/kill', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pid })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to kill process');
            return data;
        },
        onSuccess: (data, pid) => {
            showToast(data.message, 'success');
            addGhostRow(pid); // Add to ghost rows
            setSelectedPids(prev => {
                const next = new Set(prev);
                next.delete(pid);
                return next;
            });
            queryClient.invalidateQueries({ queryKey: ['processes'] });
        },
        onError: (err) => showToast(err.message)
    });

    // Bulk Kill Mutation
    const bulkKillMutation = useMutation({
        mutationFn: async (pids) => {
            const res = await fetch('/api/kill-bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pids })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to execute bulk kill');
            return data;
        },
        onSuccess: (data, pids) => {
            pids.forEach(pid => addGhostRow(pid));

            const successCount = data.results.success.length;
            const failedCount = data.results.failed.length;
            const skippedCount = data.results.skipped.length;

            let msg = `Killed ${successCount} processes.`;
            if (failedCount > 0) msg += ` Failed: ${failedCount}.`;
            if (skippedCount > 0) msg += ` Skipped: ${skippedCount}.`;

            showToast(msg, successCount > 0 ? 'success' : 'error');

            setSelectedPids(new Set());
            queryClient.invalidateQueries({ queryKey: ['processes'] });
        },
        onError: (err) => showToast(err.message)
    });

    // Restart Mutation (Phoenix)
    const restartMutation = useMutation({
        mutationFn: async (pid) => {
            const res = await fetch('/api/restart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pid })
            });
            if (!res.ok) throw new Error('Failed to restart process');
            return res.json();
        },
        onSuccess: (data, pid) => {
            showToast(data.message, 'success');
            // Remove from ghost rows immediately as it should reappear in list soon
            setGhostRows(prev => prev.filter(p => p.pid !== pid));
            // Trigger refresh
            setTimeout(() => queryClient.invalidateQueries({ queryKey: ['processes'] }), 1000);
        },
        onError: (err) => showToast(err.message)
    });

    // Selection Logic
    const toggleSelection = (pid) => {
        setSelectedPids(prev => {
            const next = new Set(prev);
            if (next.has(pid)) next.delete(pid);
            else next.add(pid);
            return next;
        });
    };

    // Derived state for selection to handle stale PIDs safely
    const visiblePids = useMemo(() => new Set(processes.map(p => p.pid)), [processes]);
    const selectedVisibleCount = processes.filter(p => selectedPids.has(p.pid)).length;
    const isAllSelected = processes.length > 0 && selectedVisibleCount === processes.length;
    const isIndeterminate = selectedVisibleCount > 0 && selectedVisibleCount < processes.length;

    const toggleAll = () => {
        if (isAllSelected) {
            setSelectedPids(new Set()); // Deselect All
        } else {
            setSelectedPids(new Set(filteredProcesses.map(p => p.pid))); // Select All Filtered
        }
    };

    const selectByName = (name) => {
        const matches = filteredProcesses.filter(p => p.name.toLowerCase().includes(name.toLowerCase())).map(p => p.pid);
        setSelectedPids(new Set([...selectedPids, ...matches]));
        setQuickSelectOpen(false);
    };

    const handleKillClick = (pid) => {
        if (confirmKill === pid) {
            killMutation.mutate(pid);
            setConfirmKill(null);
        } else {
            setConfirmKill(pid);
            setTimeout(() => setConfirmKill(current => current === pid ? null : current), 3000);
        }
    };

    // Security Badge component
    const SecurityBadge = ({ address }) => {
        if (!address) return null;
        const isLocal = address.includes('127.0.0.1') || address.includes('::1') || address.includes('localhost');

        return (
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${isLocal ? 'border-green-500/30 text-green-400 bg-green-900/20' : 'border-red-500/30 text-red-400 bg-red-900/20'}`}>
                {isLocal ? <ShieldCheck size={10} /> : <Globe size={10} />}
                {isLocal ? 'Local' : 'Exposed'}
            </div>
        );
    };

    // Combine processes and ghost rows for display (Ghost rows at top or separate?)
    // Requirement says "replace with Ghost Row". So we can just put them in the list or keep separate.
    // Putting them separate at the top might be clearer for "Recently Killed".

    return (
        <div className="bg-cyber-surface border border-cyber-dim/30 rounded-lg shadow-2xl backdrop-blur-sm relative min-h-[500px] pb-20">
            {/* Toolbar */}
            <div className="flex justify-between items-center p-4 border-b border-cyber-dim/20 bg-cyber-bg/50 sticky top-0 z-20 backdrop-blur-md">
                <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-cyber-primary animate-pulse"></div>
                        <span className="text-sm font-bold text-cyber-primary hidden lg:inline">LIVE MONITORING</span>
                    </div>

                    {/* Search Bar */}
                    <div className="relative flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={14} className="text-cyber-dim" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by port, name, or PID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full bg-cyber-bg/50 border border-cyber-dim/30 rounded py-1.5 pl-10 pr-10 text-sm text-cyber-text focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary/30 transition-all font-mono"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-cyber-dim hover:text-white"
                                title="Clear search"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Quick Select Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setQuickSelectOpen(!quickSelectOpen)}
                            className="flex items-center gap-1 text-xs text-cyber-text hover:text-cyber-primary border border-cyber-dim/30 hover:border-cyber-primary rounded px-2 py-1 transition-colors"
                        >
                            <Filter size={12} /> Quick Select
                        </button>
                        {quickSelectOpen && (
                            <div className="absolute top-full left-0 mt-1 w-48 bg-cyber-surface border border-cyber-primary/30 shadow-xl rounded z-50 py-1">
                                <div className="px-3 py-1 text-[10px] text-cyber-dim uppercase font-bold tracking-wider">Select All...</div>
                                {['node', 'python', 'java', 'chrome'].map(name => (
                                    <button
                                        key={name}
                                        onClick={() => selectByName(name)}
                                        className="w-full text-left px-3 py-2 text-sm text-cyber-text hover:bg-cyber-primary/10 hover:text-cyber-primary flex items-center justify-between group"
                                    >
                                        {name}
                                        <span className="opacity-0 group-hover:opacity-100 text-[10px] text-cyber-primary">+ADD</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold border transition-colors ${autoRefresh
                        ? 'border-cyber-primary text-cyber-primary hover:bg-cyber-primary/10'
                        : 'border-cyber-secondary text-cyber-secondary hover:bg-cyber-secondary/10'
                        }`}
                >
                    {autoRefresh ? <><Pause size={14} /> PAUSE</> : <><Play size={14} /> RESUME</>}
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-cyber-dim/10 text-xs font-mono text-cyber-dim uppercase tracking-wider sticky top-[57px] z-10 backdrop-blur-md bg-cyber-surface/90">
                            <th className="p-4 border-b border-cyber-dim/20 w-12 text-center">
                                <button onClick={toggleAll} className="text-cyber-primary hover:text-white transition-colors">
                                    {isAllSelected ? <CheckSquare size={16} /> : (isIndeterminate ? <div className="w-4 h-4 border border-current rounded flex items-center justify-center"><div className="w-2 h-2 bg-current"></div></div> : <Square size={16} />)}
                                </button>
                            </th>
                            <th className="p-4 border-b border-cyber-dim/20">Process Name</th>
                            <th className="p-4 border-b border-cyber-dim/20">PID</th>
                            <th className="p-4 border-b border-cyber-dim/20">Proto</th>
                            <th className="p-4 border-b border-cyber-dim/20">Port</th>
                            <th className="p-4 border-b border-cyber-dim/20 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="font-mono text-sm">
                        {/* Ghost Rows (Recent Kills) */}
                        {ghostRows.map((proc) => (
                            <tr key={`ghost-${proc.pid}-${proc.port}`} className="bg-cyber-secondary/5 border-b border-cyber-secondary/20 grayscale opacity-80">
                                <td className="p-4 text-center text-cyber-secondary">
                                    <Trash2 size={16} />
                                </td>
                                <td className="p-4 text-cyber-dim line-through decoration-cyber-secondary">{proc.name}</td>
                                <td className="p-4 text-cyber-dim line-through">{proc.pid}</td>
                                <td className="p-4 text-cyber-dim">{proc.proto}</td>
                                <td className="p-4 text-cyber-dim line-through">{proc.port}</td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => restartMutation.mutate(proc.pid)}
                                        className="px-3 py-1.5 rounded text-xs font-bold border border-cyber-primary text-cyber-primary hover:bg-cyber-primary hover:text-black transition-all flex items-center gap-2 ml-auto"
                                    >
                                        <RotateCcw size={14} /> PHOENIX RESTART
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {/* Active Processes */}
                        {filteredProcesses.length === 0 && ghostRows.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-cyber-dim italic">
                                    {searchTerm ? 'No processes match your search.' : 'No active listening ports detected.'}
                                </td>
                            </tr>
                        ) : (
                            filteredProcesses.map((proc) => {
                                const isHighlighted = COMMON_PORTS.includes(proc.port);
                                const isConfirming = confirmKill === proc.pid;
                                const isSelected = selectedPids.has(proc.pid);

                                return (
                                    <tr
                                        key={`${proc.pid}-${proc.port}`}
                                        className={`group border-b border-cyber-dim/10 transition-colors ${isSelected ? 'bg-cyber-secondary/10 border-cyber-secondary/30' :
                                            isHighlighted ? 'bg-cyber-primary/5 shadow-[inset_2px_0_0_0_rgba(0,255,157,0.5)]' : 'hover:bg-cyber-dim/5'
                                            }`}
                                    >
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => toggleSelection(proc.pid)}
                                                className={`${isSelected ? 'text-cyber-secondary' : 'text-cyber-dim group-hover:text-cyber-text'}`}
                                            >
                                                {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                                            </button>
                                        </td>
                                        <td className="p-4 text-white font-medium flex items-center gap-2 relative">
                                            {isHighlighted && <div className="w-1.5 h-1.5 rounded-full bg-cyber-primary shadow-[0_0_5px_#00ff9d]"></div>}
                                            <div className="group/tooltip relative cursor-help">
                                                <span>{proc.name || 'Unknown'}</span>

                                                {/* Security Badge */}
                                                <div className="ml-2 inline-block">
                                                    <SecurityBadge address={proc.localAddress} />
                                                </div>

                                                {/* Tooltip */}
                                                <div className="absolute left-0 bottom-full mb-2 w-max max-w-xs break-all hidden group-hover/tooltip:block z-50">
                                                    <div className="bg-cyber-surface border border-cyber-primary/30 text-xs text-cyber-text p-2 rounded shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                                                        <div className="text-cyber-primary font-bold mb-1">Command Path:</div>
                                                        <div className="opacity-80 font-mono">{proc.commandPath || 'N/A'}</div>
                                                        <div className="text-cyber-primary font-bold mb-1 mt-2">Local Address:</div>
                                                        <div className="opacity-80 font-mono">{proc.localAddress || 'Unknown'}</div>
                                                    </div>
                                                    {/* Arrow */}
                                                    <div className="w-2 h-2 bg-cyber-surface border-r border-b border-cyber-primary/30 transform rotate-45 absolute left-4 -bottom-1"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-cyber-dim">{proc.pid}</td>
                                        <td className="p-4 text-cyber-dim">{proc.proto}</td>
                                        <td className="p-4">
                                            <span className={`text-lg font-bold ${isHighlighted ? 'text-cyber-primary drop-shadow-[0_0_3px_rgba(0,255,157,0.5)]' : 'text-cyber-text'}`}>
                                                {proc.port}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleKillClick(proc.pid)}
                                                className={`px-3 py-1.5 rounded text-xs font-bold transition-all duration-200 border flex items-center gap-2 ml-auto ${isConfirming
                                                    ? 'bg-cyber-secondary text-white border-cyber-secondary animate-pulse'
                                                    : 'bg-transparent text-cyber-secondary border-cyber-secondary/50 hover:bg-cyber-secondary hover:text-white hover:border-cyber-secondary'
                                                    }`}
                                            >
                                                {isConfirming ? (
                                                    <>CONFIRM KILL?</>
                                                ) : (
                                                    <><Trash2 size={14} /> KILL</>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Smart Nuke Bar (Floating Footer) */}
            <div className={`absolute bottom-0 left-0 right-0 bg-cyber-surface border-t-2 border-cyber-secondary p-4 flex justify-between items-center transition-transform duration-300 transform ${selectedPids.size > 0 ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="flex items-center gap-3">
                    <div className="bg-cyber-secondary/20 p-2 rounded-full text-cyber-secondary">
                        <Zap size={20} />
                    </div>
                    <div>
                        <div className="text-white font-bold">{selectedPids.size} Processes Selected</div>
                        <div className="text-xs text-cyber-dim">Ready to terminate</div>
                    </div>
                </div>
                <button
                    onClick={() => bulkKillMutation.mutate(Array.from(selectedPids))}
                    className="bg-cyber-secondary hover:bg-red-600 text-white font-bold py-2 px-6 rounded shadow-[0_0_15px_rgba(255,0,85,0.4)] hover:shadow-[0_0_25px_rgba(255,0,85,0.6)] transition-all flex items-center gap-2"
                >
                    <Trash2 size={18} /> KILL SELECTED
                </button>
            </div>
        </div>
    );
};

export default ProcessTable;
