const { exec } = require('child_process');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getSystemCommands, getProcessList, killProcess } = require('./utils/system');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST_AGENT_URL = process.env.HOST_AGENT_URL; // e.g., http://host.docker.internal:3002

// Proxy mode: if HOST_AGENT_URL is set, proxy all /api/* requests to host agent
const PROXY_MODE = !!HOST_AGENT_URL;

// In-memory store for recently killed processes (Phoenix feature)
// Map<pid, { command, cwd, timestamp }>
const recentKills = new Map();

// Clean up recentKills every 60 seconds
setInterval(() => {
    const now = Date.now();
    for (const [pid, data] of recentKills) {
        if (now - data.timestamp > 60000) {
            recentKills.delete(pid);
        }
    }
}, 30000);

app.use(cors());
app.use(express.json());

// Proxy middleware for host agent mode
if (PROXY_MODE) {
    console.log(`[Proxy Mode] Forwarding /api/* requests to ${HOST_AGENT_URL}`);

    app.use('/api/*', async (req, res) => {
        try {
            const targetUrl = `${HOST_AGENT_URL}${req.originalUrl}`;
            const fetch = (await import('node-fetch')).default;

            const response = await fetch(targetUrl, {
                method: req.method,
                headers: { 'Content-Type': 'application/json' },
                body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
            });

            const data = await response.json();
            res.status(response.status).json(data);
        } catch (error) {
            console.error('[Proxy Error]', error);
            res.status(500).json({
                error: 'Failed to connect to host agent',
                details: error.message,
                hint: 'Make sure the host agent is running on your host machine'
            });
        }
    });
}

// Serve static files from the React app
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/dist')));
}

// Middleware to prevent killing system PIDs
const safetyGuard = (req, res, next) => {
    const { pid } = req.body;
    const criticalPids = [0, 1, 4];

    if (criticalPids.includes(parseInt(pid))) {
        return res.status(403).json({ error: 'Forbidden: Cannot kill system critical process.' });
    }
    next();
};

// Helper: Store process details before killing
const archiveProcess = async (pid) => {
    try {
        const processes = await getProcessList();
        const proc = processes.find(p => p.pid === parseInt(pid));
        if (proc && proc.commandPath && proc.commandPath !== 'N/A') {
            recentKills.set(parseInt(pid), {
                command: proc.commandPath,
                cwd: proc.cwd,
                timestamp: Date.now()
            });
            console.log(`[Phoenix] Archived PID ${pid}: ${proc.commandPath}`);
        }
    } catch (e) {
        console.error('Failed to archive process:', e);
    }
};

// Local API endpoints (only used when NOT in proxy mode)
if (!PROXY_MODE) {
    app.get('/api/processes', async (req, res) => {
        try {
            const processes = await getProcessList();
            res.json(processes);
        } catch (error) {
            console.error('Error fetching processes:', error);
            res.status(500).json({ error: 'Failed to fetch process list', details: error.message });
        }
    });

    app.post('/api/kill', safetyGuard, async (req, res) => {
        const { pid } = req.body;

        if (!pid) {
            return res.status(400).json({ error: 'PID is required' });
        }

        try {
            await archiveProcess(pid);
            const result = await killProcess(pid);
            res.json({ message: `Process ${pid} killed successfully`, result });
        } catch (error) {
            console.error(`Error killing process ${pid}:`, error);
            res.status(500).json({ error: `Failed to kill process ${pid}`, details: error.message });
        }
    });

    app.post('/api/kill-bulk', async (req, res) => {
        const { pids } = req.body;

        if (!Array.isArray(pids) || pids.length === 0) {
            return res.status(400).json({ error: 'Array of PIDs is required' });
        }

        const currentPid = process.pid;
        const results = { success: [], failed: [], skipped: [] };
        const criticalPids = [0, 1, 4];

        console.log(`[Bulk Kill] Request to kill: ${pids.join(', ')}`);

        await Promise.all(pids.map(pid => archiveProcess(pid)));

        for (const pid of pids) {
            const parsedPid = parseInt(pid);

            if (parsedPid === currentPid) {
                results.skipped.push({ pid: parsedPid, reason: 'PortSentinel Core (Suicide Prevention)' });
                continue;
            }

            if (criticalPids.includes(parsedPid)) {
                results.skipped.push({ pid: parsedPid, reason: 'System Critical Process' });
                continue;
            }

            try {
                await killProcess(parsedPid);
                results.success.push(parsedPid);
            } catch (error) {
                results.failed.push({ pid: parsedPid, error: error.message });
            }
        }

        res.json({
            message: `Processed ${pids.length} requests`,
            results
        });
    });

    app.post('/api/restart', async (req, res) => {
        const { pid } = req.body;
        const archived = recentKills.get(parseInt(pid));

        if (!archived) {
            return res.status(404).json({ error: 'Process archive not found or expired' });
        }

        console.log(`[Phoenix] Restarting: ${archived.command} (CWD: ${archived.cwd})`);

        try {
            const options = archived.cwd ? { cwd: archived.cwd } : {};
            const child = exec(archived.command, options);
            child.unref();

            res.json({ message: `Restart signal sent for ${archived.command}` });
        } catch (error) {
            res.status(500).json({ error: 'Failed to restart process', details: error.message });
        }
    });
}

app.post('/api/shutdown', (req, res) => {
    console.log('[System] Received shutdown request.');
    res.json({ message: 'Goodbye' });

    setTimeout(() => {
        console.log('[System] Shutting down...');
        process.exit(0);
    }, 500);
});

// The "catchall" handler
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    });
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`PortSentinel Backend running at http://0.0.0.0:${PORT}`);
    if (PROXY_MODE) {
        console.log(`[Proxy Mode] API requests will be forwarded to ${HOST_AGENT_URL}`);
    } else {
        console.log(`[Local Mode] Monitoring processes directly`);
    }
});
