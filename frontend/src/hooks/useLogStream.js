import { useState, useEffect, useRef, useCallback } from 'react';
import { timeAgo } from '../utils/utils';

// Pre-defined log message templates for improved realism
const LOG_TEMPLATES = {
    INFO: [
        "Received GET /api/users request",
        "Processing data batch #{{id}}",
        "Database connection pool active: 5 connections",
        "Health check passed: 200 OK",
        "Cache hit for key 'user_session_{{id}}'",
        "Worker thread started successfully",
        "Scheduled task 'cleanup_temp_files' completed",
        "API Gateway: Forwarding request to downstream service"
    ],
    WARN: [
        "Memory usage high: {{value}}%",
        "Response time degraded: {{value}}ms",
        "Rate limit approaching for client 192.168.1.{{id}}",
        "Deprecation warning: API v1 is deprecated",
        "Connection pool > 80% utilization",
        "Retry attempt 2/5 for job #{{id}}"
    ],
    ERROR: [
        "Failed to connect to database: Connection refused",
        "Unhandled exception in handler 'process_payment'",
        "Timeout waiting for upstream service (5000ms)",
        "Invalid payload received: Missing required field 'token'",
        "Disk space critical: Only 2GB remaining",
        "Process exited with code 1"
    ],
    DEBUG: [
        "Parsed config: { mode: 'hybrid', verbose: true }",
        "User state transition: ACTIVE -> IDLE",
        "Lock acquired for resource 'mutex_{{id}}'",
        "Payload size: {{value}} bytes",
        "Executing query: SELECT * FROM users WHERE id = {{id}}",
        "Rendering component 'Dashboard' (Render count: {{value}})"
    ]
};

export const useLogStream = (pid, processName, options = {}) => {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ info: 0, warn: 0, error: 0, debug: 0 });
    const [isConnected, setIsConnected] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const logsRef = useRef([]); // extensive logs store to prevent state thrashing
    const intervalRef = useRef(null);
    const maxLogs = options.maxLogs || 500;

    // Helper to generate a realistic log entry
    const generateLog = useCallback(() => {
        // Probabilities: 70% INFO, 20% DEBUG, 8% WARN, 2% ERROR
        const rand = Math.random();
        let level = 'INFO';
        if (rand > 0.98) level = 'ERROR';
        else if (rand > 0.90) level = 'WARN';
        else if (rand > 0.70) level = 'DEBUG';

        const templates = LOG_TEMPLATES[level];
        const template = templates[Math.floor(Math.random() * templates.length)];

        // Fill data placeholders
        const message = template
            .replace('{{id}}', Math.floor(Math.random() * 9999))
            .replace('{{value}}', Math.floor(Math.random() * 500));

        // Create log object
        return {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            level,
            message,
            pid,
            process: processName
        };
    }, [pid, processName]);

    // Stream effect
    useEffect(() => {
        if (!isConnected || isPaused) {
            clearInterval(intervalRef.current);
            return;
        }

        intervalRef.current = setInterval(() => {
            const newLog = generateLog();

            setLogs(currentLogs => {
                const updated = [...currentLogs, newLog];
                if (updated.length > maxLogs) updated.shift();
                return updated;
            });

            // Update stats
            setStats(prev => ({
                ...prev,
                [newLog.level.toLowerCase()]: prev[newLog.level.toLowerCase()] + 1
            }));

        }, Math.random() * 2000 + 500); // Random interval between 500ms and 2.5s

        return () => clearInterval(intervalRef.current);
    }, [isConnected, isPaused, generateLog, maxLogs]);

    const clearLogs = () => {
        setLogs([]);
        setStats({ info: 0, warn: 0, error: 0, debug: 0 });
    };

    return {
        logs,
        stats,
        isConnected,
        isPaused,
        togglePause: () => setIsPaused(p => !p),
        clearLogs,
        connectionStatus: isConnected ? 'Connected' : 'Disconnected'
    };
};
