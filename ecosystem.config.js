module.exports = {
    apps: [
        {
            name: 'host-agent',
            script: './host-agent/agent.js',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '200M',
            env: {
                PORT: 3002
            }
        },
        {
            name: 'backend',
            script: './backend/server.js',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
            env: {
                NODE_ENV: 'production',
                PORT: 3001,
                HOST_AGENT_URL: 'http://localhost:3002'
            }
        }
    ]
};
