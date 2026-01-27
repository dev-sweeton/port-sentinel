const { exec } = require('child_process');
const express = require('express');
const cors = require('cors');
const { promisify } = require('util');
const os = require('os');

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// In-memory store for recently killed processes (Phoenix feature)
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

// Platform detection
const platform = os.platform();

/**
 * Get Docker container information for port mapping
 * Returns a map of port -> container name
 */
async function getDockerContainerInfo() {
    try {
        // Get all running container IDs
        const { stdout: psStdout } = await execAsync('docker ps -q');
        if (!psStdout.trim()) return new Map();

        const containerIds = psStdout.trim().split('\n').join(' ');

        // Inspect all containers to get Name, ExposedPorts, and NetworkSettings.Ports
        const { stdout: inspectStdout } = await execAsync(`docker inspect --format '{{.Name}}|{{.Config.ExposedPorts}}|{{.NetworkSettings.Ports}}' ${containerIds}`);

        const portMap = new Map();
        const lines = inspectStdout.trim().split('\n');

        for (const line of lines) {
            if (!line) continue;
            const [nameRaw, exposedPortsRaw, networkPortsRaw] = line.split('|');
            const containerName = nameRaw.replace(/^\//, ''); // Remove leading slash

            // Strategy 1: Explicit Host Port Mappings (NetworkSettings.Ports)
            if (networkPortsRaw && networkPortsRaw !== 'map[]') {
                const hostPortMatches = networkPortsRaw.matchAll(/\{[\d\.]+\s+(\d+)\}/g);
                for (const match of hostPortMatches) {
                    const hostPort = parseInt(match[1]);
                    if (!isNaN(hostPort)) {
                        portMap.set(hostPort, containerName);
                    }
                }
            }

            // Strategy 2: Fallback to Exposed Ports (Config.ExposedPorts)
            if (exposedPortsRaw && exposedPortsRaw !== 'map[]') {
                const exposedMatches = exposedPortsRaw.matchAll(/(\d+)\/(tcp|udp)/g);
                for (const match of exposedMatches) {
                    const port = parseInt(match[1]);
                    // Only map if not already mapped
                    if (!isNaN(port) && !portMap.has(port)) {
                        portMap.set(port, containerName);
                    }
                }
            }
        }

        return portMap;
    } catch (error) {
        // Docker might not be installed or running
        return new Map();
    }
}

/**
 * Get list of processes listening on ports
 */
async function getProcessList() {
    try {
        let command;

        if (platform === 'darwin' || platform === 'linux') {
            // macOS and Linux: use lsof
            command = 'lsof -i -P -n | grep LISTEN';
        } else if (platform === 'win32') {
            // Windows: use netstat
            command = 'netstat -ano | findstr LISTENING';
        } else {
            throw new Error(`Unsupported platform: ${platform}`);
        }

        const { stdout } = await execAsync(command);
        const processes = parseProcessOutput(stdout);

        // Get Docker container info for enrichment
        const dockerMap = await getDockerContainerInfo();

        // Common process names that act as Docker proxies or are related to Docker runtime on various OSes
        const dockerProxyNames = ['docker-pr', 'com.docker.backend', 'vpnkit', 'ssh', 'limactl', 'com.docker.vpnkit'];

        // Enrich Docker proxy processes with container names
        const enrichedProcesses = processes.map(proc => {
            const procName = (proc.name || '').toLowerCase();
            const isDockerProxy = dockerProxyNames.some(dName => procName.includes(dName));

            if (isDockerProxy) {
                const containerName = dockerMap.get(proc.port);
                if (containerName) {
                    return {
                        ...proc,
                        name: `docker:${containerName}`,
                        commandPath: `Docker Container: ${containerName}`
                    };
                }
            }
            return proc;
        });

        return enrichedProcesses;
    } catch (error) {
        console.error('Error fetching process list:', error);
        return [];
    }
}

/**
 * Parse lsof or netstat output into structured data
 */
function parseProcessOutput(output) {
    const lines = output.trim().split('\n');
    const processes = [];
    const seen = new Set();

    for (const line of lines) {
        try {
            let process;

            if (platform === 'darwin' || platform === 'linux') {
                // Parse lsof output
                // Format: COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME
                const parts = line.trim().split(/\s+/);
                if (parts.length < 9) continue;

                const name = parts[0];
                const pid = parseInt(parts[1]);
                const address = parts[8]; // e.g., *:3001 or 127.0.0.1:5000

                // Extract port
                const portMatch = address.match(/:(\d+)$/);
                if (!portMatch) continue;
                const port = parseInt(portMatch[1]);

                // Determine protocol (TCP/UDP)
                const protocol = parts[7] === 'TCP' || parts[7] === 'TCP6' ? 'TCP' :
                    parts[7] === 'UDP' || parts[7] === 'UDP6' ? 'UDP' : 'TCP';

                process = {
                    pid,
                    port,
                    name,
                    protocol,
                    commandPath: name,
                    cwd: null
                };
            } else if (platform === 'win32') {
                // Parse netstat output
                // Format: TCP 0.0.0.0:3001 0.0.0.0:0 LISTENING 12345
                const parts = line.trim().split(/\s+/);
                if (parts.length < 5) continue;

                const protocol = parts[0];
                const address = parts[1];
                const pid = parseInt(parts[4]);

                // Extract port
                const portMatch = address.match(/:(\d+)$/);
                if (!portMatch) continue;
                const port = parseInt(portMatch[1]);

                process = {
                    pid,
                    port,
                    name: `PID-${pid}`, // Will be enriched later if needed
                    protocol,
                    commandPath: null,
                    cwd: null
                };
            }

            // Deduplicate by port-pid combination
            const key = `${process.port}-${process.pid}`;
            if (!seen.has(key)) {
                seen.add(key);
                processes.push(process);
            }
        } catch (e) {
            // Skip malformed lines
            continue;
        }
    }

    return processes;
}

/**
 * Kill a process by PID
 */
async function killProcess(pid) {
    try {
        let command;

        if (platform === 'win32') {
            command = `taskkill /F /PID ${pid}`;
        } else {
            command = `kill -9 ${pid}`;
        }

        await execAsync(command);
        return { success: true };
    } catch (error) {
        throw new Error(`Failed to kill process ${pid}: ${error.message}`);
    }
}

/**
 * Archive process details before killing
 */
async function archiveProcess(pid) {
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
}

// Safety guard middleware
const safetyGuard = (req, res, next) => {
    const { pid } = req.body;
    const criticalPids = [0, 1, 4];

    if (criticalPids.includes(parseInt(pid))) {
        return res.status(403).json({ error: 'Forbidden: Cannot kill system critical process.' });
    }
    next();
};

// API Endpoints
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

    // Archive all viable processes first
    await Promise.all(pids.map(pid => archiveProcess(pid)));

    for (const pid of pids) {
        const parsedPid = parseInt(pid);

        // Suicide Prevention
        if (parsedPid === currentPid) {
            results.skipped.push({ pid: parsedPid, reason: 'Host Agent (Suicide Prevention)' });
            continue;
        }

        // System Guard
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

app.get('/health', (req, res) => {
    res.json({ status: 'ok', platform, pid: process.pid });
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(`PortSentinel Host Agent running at http://127.0.0.1:${PORT}`);
    console.log(`Platform: ${platform}`);
    console.log(`Monitoring host processes on the actual machine`);
});
