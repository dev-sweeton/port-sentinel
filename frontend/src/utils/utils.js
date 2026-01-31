// Utility functions for PortSentinel

/**
 * Format bytes to human-readable format
 */
export const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Format milliseconds to readable duration
 */
export const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
};

/**
 * Generate realistic mock IP addresses
 */
export const generateMockIP = () => {
    const types = [
        () => `127.0.0.${Math.floor(Math.random() * 255)}`, // Localhost
        () => `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, // Private
        () => `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, // Private
        () => `172.16.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, // Private
    ];

    return types[Math.floor(Math.random() * types.length)]();
};

/**
 * Get random connection state
 */
export const getConnectionState = () => {
    const states = ['ESTABLISHED', 'LISTENING', 'TIME_WAIT', 'CLOSE_WAIT', 'SYN_SENT'];
    const weights = [0.6, 0.2, 0.1, 0.05, 0.05]; // Probability weights

    const random = Math.random();
    let cumulative = 0;

    for (let i = 0; i < states.length; i++) {
        cumulative += weights[i];
        if (random < cumulative) {
            return states[i];
        }
    }

    return states[0];
};

/**
 * Export data to JSON file
 */
export const exportToJSON = (data, filename = 'portsentinel-export.json') => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Debounce function
 */
export const debounce = (fn, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};

/**
 * Format number with fixed decimals
 */
export const formatNumber = (num, decimals = 1) => {
    return num.toFixed(decimals);
};

/**
 * Generate random port in range
 */
export const randomInRange = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Check if port is suspicious
 */
export const isSuspiciousPort = (port) => {
    const suspiciousPorts = [4444, 6666, 31337, 12345, 1337, 8888];
    return suspiciousPorts.includes(port);
};

/**
 * Get time ago string
 */
export const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
};
