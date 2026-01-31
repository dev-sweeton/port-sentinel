#!/bin/bash

# Start PortSentinel Host Agent
# This script starts the host agent that monitors native host processes

echo "Starting PortSentinel Host Agent..."
echo "Platform: $(uname -s)"

# Check if node_modules exists
if [ ! -d "host-agent/node_modules" ]; then
    echo "Installing dependencies..."
    cd host-agent && npm install && cd ..
fi

# Start the agent
echo "Starting agent on http://127.0.0.1:3002"
node host-agent/agent.js
