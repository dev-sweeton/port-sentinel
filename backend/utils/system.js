const { exec } = require('child_process');
const os = require('os');
const util = require('util');

const execPromise = util.promisify(exec);

const getSystemCommands = () => {
    const platform = os.platform();

    if (platform === 'win32') {
        return {
            scan: 'netstat -ano | findstr LISTENING',
            kill: (pid) => `taskkill /F /PID ${pid}`,
            platform: 'win32'
        };
    } else {
        // macOS (darwin) and Linux use lsof
        // -i: select internet files
        // -P: no port names (use numbers)
        // -n: no host names (use numeric addrs)
        return {
            scan: 'lsof -i -P -n | grep LISTEN',
            kill: (pid) => `kill -9 ${pid}`,
            platform: 'unix'
        };
    }
};

const parseOutput = (stdout, platform) => {
    const lines = stdout.trim().split('\n');
    const processes = [];
    const seen = new Set();

    if (platform === 'win32') {
        // Windows netstat format:
        //   Proto  Local Address          Foreign Address        State           PID
        //   TCP    0.0.0.0:135            0.0.0.0:0              LISTENING       984
        for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length < 5) continue;

            const proto = parts[0];
            const localAddrFull = parts[1]; // 0.0.0.0:135
            const pid = parseInt(parts[4]);

            // Extract port and IP
            const lastColonIndex = localAddrFull.lastIndexOf(':');
            const port = parseInt(localAddrFull.substring(lastColonIndex + 1));
            const localAddress = localAddrFull.substring(0, lastColonIndex);

            if (!port || !pid) continue;

            const key = `${pid}-${port}`;
            if (seen.has(key)) continue;

            seen.add(key);
            processes.push({
                pid,
                name: 'System/Unknown',
                proto,
                port,
                localAddress
            });
        }
    } else {
        // macOS/Linux lsof format:
        // COMMAND   PID     USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
        // node     1234  sweeton   23u  IPv6 0x...      0t0  TCP *:3000 (LISTEN)
        for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length < 9) continue;

            const command = parts[0];
            const pid = parseInt(parts[1]);
            const proto = parts[7];
            const addressParams = parts.slice(8).join(''); // *:3000(LISTEN)

            // Extract port and IP
            // addressParams often looks like *:3000(LISTEN) or 127.0.0.1:3000(LISTEN)
            const cleanAddr = addressParams.replace(/\(.*\)/, '');
            const lastColonIndex = cleanAddr.lastIndexOf(':');
            const port = parseInt(cleanAddr.substring(lastColonIndex + 1));

            if (!port || !pid) continue;

            // IP is everything before the last colon. '*' means 0.0.0.0 (all interfaces)
            let localAddress = cleanAddr.substring(0, lastColonIndex);
            if (localAddress === '*') localAddress = '0.0.0.0';

            const key = `${pid}-${port}`;
            if (seen.has(key)) continue;

            seen.add(key);
            processes.push({
                pid,
                name: command,
                proto: proto.includes('TCP') ? 'TCP' : (proto.includes('UDP') ? 'UDP' : proto),
                port,
                localAddress
            });
        }
    }

    return processes.sort((a, b) => a.port - b.port);
};

const getProcessDetailed = async (pid, platform) => {
    try {
        let command = '';
        let cwdCommand = '';

        if (platform === 'win32') {
            command = `wmic process where processid=${pid} get commandline /value`;
            // Windows CWD is hard to get without external tools. We'll skip it for now.
        } else {
            command = `ps -p ${pid} -o args=`;
            cwdCommand = `pwdx ${pid}`;
        }

        // Fetch Command Path
        const { stdout: cmdStdout } = await execPromise(command);
        let cmdPath = cmdStdout.trim();

        if (platform === 'win32') {
            const lines = cmdPath.split('\n');
            const cmdLine = lines.find(l => l.toLowerCase().startsWith('commandline='));
            if (cmdLine) {
                cmdPath = cmdLine.substring('commandline='.length).trim();
            }
        }

        // Fetch CWD (Unix only)
        let cwd = null;
        if (cwdCommand) {
            try {
                const { stdout: cwdStdout } = await execPromise(cwdCommand);
                // pwdx output: "1234: /path/to/cwd"
                const parts = cwdStdout.trim().split(': ');
                if (parts.length === 2) {
                    cwd = parts[1].trim();
                }
            } catch (e) {
                // Ignore CWD errors (permission often denied)
            }
        }

        return { commandPath: cmdPath || 'N/A', cwd };
    } catch (error) {
        return { commandPath: 'N/A', cwd: null };
    }
};

/**
 * Get Docker container information for port mapping
 * Returns a map of port -> container name
 */
const getDockerContainerInfo = async () => {
    try {
        // Get all running container IDs
        const { stdout: psStdout } = await execPromise('docker ps -q');
        if (!psStdout.trim()) return new Map();

        const containerIds = psStdout.trim().split('\n').join(' ');

        // Inspect all containers to get Name, ExposedPorts, and NetworkSettings.Ports
        // Format: Name|ExposedPorts|NetworkSettings.Ports
        // ExposedPorts looks like: map[3001/tcp:{} 3002/tcp:{}]
        // NetworkSettings.Ports looks like: map[3001/tcp:[{0.0.0.0 3001}]] or map[]
        const { stdout: inspectStdout } = await execPromise(`docker inspect --format '{{.Name}}|{{.Config.ExposedPorts}}|{{.NetworkSettings.Ports}}' ${containerIds}`);

        const portMap = new Map();
        const lines = inspectStdout.trim().split('\n');

        for (const line of lines) {
            if (!line) continue;
            const [nameRaw, exposedPortsRaw, networkPortsRaw] = line.split('|');
            const containerName = nameRaw.replace(/^\//, ''); // Remove leading slash

            // Strategy 1: Explicit Host Port Mappings (NetworkSettings.Ports)
            // Go template map format: map[80/tcp:[{0.0.0.0 8080}]]
            // We look for the HostPort
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
            // Use this if we haven't found a mapping for these ports yet.
            // Useful for Host Networking mode where explicit mapping is empty but port is in use.
            if (exposedPortsRaw && exposedPortsRaw !== 'map[]') {
                // Extract ports like "3001/tcp"
                const exposedMatches = exposedPortsRaw.matchAll(/(\d+)\/(tcp|udp)/g);
                for (const match of exposedMatches) {
                    const port = parseInt(match[1]);
                    // Only map if not already mapped (Explicit mapping takes precedence)
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
};

const getProcessList = async () => {
    const { scan, platform } = getSystemCommands();
    try {
        const { stdout } = await execPromise(scan);
        const basicList = parseOutput(stdout, platform);

        // Get Docker container info for enrichment
        const dockerMap = await getDockerContainerInfo();

        // Common process names that act as Docker proxies or are related to Docker runtime on various OSes
        const dockerProxyNames = ['docker-pr', 'com.docker.backend', 'vpnkit', 'ssh', 'limactl', 'com.docker.vpnkit'];

        // Deep Inspection: concurrently fetch details for valid PIDs
        const detailedList = await Promise.all(basicList.map(async (proc) => {
            const details = await getProcessDetailed(proc.pid, platform);
            let enrichedProc = { ...proc, ...details };

            // Enrich Docker proxy processes with container names
            const procName = (enrichedProc.name || '').toLowerCase();
            const isDockerProxy = dockerProxyNames.some(dName => procName.includes(dName));

            if (isDockerProxy) {
                const containerName = dockerMap.get(enrichedProc.port);
                if (containerName) {
                    enrichedProc.name = `docker:${containerName}`;
                    enrichedProc.commandPath = `Docker Container: ${containerName}`;
                }
            }

            return enrichedProc;
        }));

        return detailedList;
    } catch (error) {
        // If lsof returns exit code 1 (grep failed to find LISTEN), it means no ports open.
        // We should just return empty array if the error is just "no matches"
        if (error.code === 1 && error.stdout === '') {
            return [];
        }
        throw error;
    }
};

const killProcess = async (pid) => {
    const { kill } = getSystemCommands();
    const command = kill(pid);
    await execPromise(command);
    return true;
};

module.exports = {
    getSystemCommands,
    getProcessList,
    killProcess
};
