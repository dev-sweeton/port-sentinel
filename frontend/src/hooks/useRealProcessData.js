import { useState, useEffect, useRef, useCallback } from 'react';
import { generateMockIP, getConnectionState, isSuspiciousPort } from '../utils/utils';

export const useRealProcessData = () => {
    const [ports, setPorts] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [lastFetchTime, setLastFetchTime] = useState(Date.now());
    const [settings, setSettings] = useState({
        soundEnabled: true,
        autoRefresh: true,
        refreshInterval: 1000, // Poll every 1 second for real data
    });
    const [globalStats, setGlobalStats] = useState({
        totalTraffic: 0,
        activeConnections: 0,
        avgCpu: 0,
        avgMemory: 0,
    });
    const [watchlist, setWatchlist] = useState([]);

    const alertIdCounter = useRef(0);
    const lastAlertTime = useRef(Date.now());
    // Store history locally to reuse it between fetches
    const historyCache = useRef(new Map());

    // Generate mock connections for a port (Simulation for visual effect)
    const generateConnections = useCallback((port, count) => {
        return Array.from({ length: count }, (_, i) => ({
            id: `${port}-${i}`,
            remoteIP: generateMockIP(),
            state: getConnectionState(),
            duration: Math.floor(Math.random() * 300000),
            established: Date.now() - Math.floor(Math.random() * 300000),
            isNew: false,
        }));
    }, []);

    const fetchProcesses = useCallback(async () => {
        try {
            // Use relative path for production (served by backend)
            // In dev (Vite), proxy in vite.config.js handles this
            const endpoint = import.meta.env.PROD ? '/api/processes' : 'http://localhost:3001/api/processes';
            const response = await fetch(endpoint);
            if (!response.ok) {
                throw new Error('Failed to fetch processes');
            }
            const rawProcesses = await response.json();
            return rawProcesses;
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    }, []);

    // Fetch and Process Data Loop
    useEffect(() => {
        if (!settings.autoRefresh) return;

        const fetchData = async () => {
            const rawProcesses = await fetchProcesses();
            const now = Date.now();

            setPorts(currentPorts => {
                let totalTrafficDelta = 0;
                let totalConnections = 0;
                let totalCpu = 0;
                let totalMem = 0;

                const newPorts = rawProcesses.map(proc => {
                    // Check if we have existing data for this PID/Port to preserve history
                    const cacheKey = `${proc.port}-${proc.pid}`;
                    const existingHistory = historyCache.current.get(cacheKey) || Array(60).fill({ cpu: 0, traffic: 0, memory: 0 });

                    // --- REAL METRICS & SIMULATED TRAFFIC ---
                    // CPU/Memory now comes from backend (Linux/macOS)
                    // Traffic is still simulated as we don't have reliable per-process network stats without root/nethogs

                    const isActive = Math.random() > 0.4;
                    const burstMultiplier = Math.random() > 0.9 ? 5 : 1;

                    const trafficIn = isActive ? Math.floor(Math.random() * 5000 * burstMultiplier) : Math.floor(Math.random() * 200);
                    const trafficOut = isActive ? Math.floor(Math.random() * 5000 * burstMultiplier) : Math.floor(Math.random() * 200);

                    // Use real stats if available, otherwise default to 0 (don't fake it anymore)
                    const newCpu = typeof proc.cpu === 'number' ? proc.cpu : 0;
                    const newMem = typeof proc.memory === 'number' ? proc.memory : 0;

                    // Append to history
                    const newHistory = [...existingHistory.slice(1), {
                        cpu: newCpu,
                        traffic: trafficIn + trafficOut,
                        memory: newMem,
                    }];

                    // Update Cache
                    historyCache.current.set(cacheKey, newHistory);

                    // Stats accumulation
                    totalTrafficDelta += (trafficIn + trafficOut);
                    totalConnections += 1; // Basic count
                    totalCpu += newCpu;
                    totalMem += newMem;

                    // Determine Category
                    let category = 'other';
                    const lowerName = proc.name.toLowerCase();
                    if (lowerName.includes('node') || lowerName.includes('python') || lowerName.includes('java')) category = 'backend';
                    if (lowerName.includes('chrome') || lowerName.includes('firefox') || lowerName.includes('vite')) category = 'frontend';
                    if (lowerName.includes('sql') || lowerName.includes('mongo') || lowerName.includes('redis')) category = 'database';
                    if (lowerName.includes('docker')) category = 'container';

                    // Connections List (Simulated for visual)
                    const connectionList = generateConnections(proc.port, Math.floor(Math.random() * 5));

                    // Status Logic
                    // Real logic: existing is healthy. We could add 'unresponsive' if we had heartbeat.
                    let status = 'healthy';
                    if (newCpu > 80) status = 'warning';

                    // Preserve favorite status
                    const wasFavorite = currentPorts.find(p => p.port === proc.port)?.isFavorite || false;

                    return {
                        port: proc.port,
                        name: proc.name,
                        pid: proc.pid,
                        type: 'process', // Generic
                        category,
                        status,
                        connections: connectionList.length,
                        connectionList,
                        cpu: newCpu,
                        memory: newMem,
                        trafficIn,
                        trafficOut,
                        totalTraffic: (trafficIn + trafficOut) * 10, // Simulated accumulation
                        history: newHistory,
                        dependencies: [],
                        isFavorite: wasFavorite,
                        commandPath: proc.commandPath,
                    };
                });

                // Clean up old cache entries
                const currentKeys = new Set(newPorts.map(p => `${p.port}-${p.pid}`));
                for (const key of historyCache.current.keys()) {
                    if (!currentKeys.has(key)) {
                        historyCache.current.delete(key);
                    }
                }

                // Update Globals
                setGlobalStats({
                    totalTraffic: (globalStats.totalTraffic || 0) + totalTrafficDelta,
                    activeConnections: totalConnections,
                    avgCpu: newPorts.length > 0 ? Math.floor(totalCpu / newPorts.length) : 0,
                    avgMemory: newPorts.length > 0 ? Math.floor(totalMem / newPorts.length) : 0,
                });

                return newPorts;
            });
        };

        fetchData();
        const interval = setInterval(fetchData, settings.refreshInterval);
        return () => clearInterval(interval);
    }, [settings.autoRefresh, settings.refreshInterval]); // Removed globalStats dependency to avoid loop

    const generateAlert = useCallback((type, port, customMessage = null) => {
        const messages = {
            'CRITICAL': customMessage || `Suspicious activity detected on port ${port.port}`,
            'WARNING': customMessage || `High resource usage on ${port.name}`,
            'UNUSUAL': customMessage || `Unexpected connection spike on port ${port.port}`,
            'INFO': customMessage || `Routine health check on ${port.name}`,
        };

        const newAlert = {
            id: alertIdCounter.current++,
            type,
            message: messages[type],
            timestamp: new Date(),
            port: port.port,
            portName: port.name,
        };

        setAlerts(prev => [newAlert, ...prev].slice(0, 50));
    }, []);

    const killProcess = useCallback(async (pid) => {
        try {
            const endpoint = import.meta.env.PROD ? '/api/kill' : 'http://localhost:3001/api/kill';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pid }),
            });

            const result = await response.json();

            if (response.ok) {
                // Optimistic UI update
                setPorts(prev => {
                    const port = prev.find(p => p.pid === pid);
                    if (port) {
                        generateAlert('WARNING', port, `Process ${port.name} (PID: ${pid}) terminated by user`);
                    }
                    return prev.filter(p => p.pid !== pid);
                });
            } else {
                console.error('Failed to kill process:', result.error);
                // Could generate an error alert here
            }
        } catch (error) {
            console.error('Error killing process:', error);
        }
    }, [generateAlert]);

    const toggleFavorite = useCallback((port) => {
        setPorts(prev => prev.map(p =>
            p.port === port ? { ...p, isFavorite: !p.isFavorite } : p
        ));
    }, []);

    const updateSettings = useCallback((newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    }, []);

    return {
        ports,
        globalStats,
        alerts,
        settings,
        watchlist,
        actions: {
            killProcess,
            toggleFavorite,
            generateAlert,
            dismissAlert: (id) => setAlerts(prev => prev.filter(a => a.id !== id)),
            clearAllAlerts: () => setAlerts([]),
            updateSettings,
        },
    };
};
