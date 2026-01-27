@echo off
REM Start PortSentinel Host Agent
REM This script starts the host agent that monitors native host processes

echo Starting PortSentinel Host Agent...

REM Check if node_modules exists
if not exist "host-agent\node_modules" (
    echo Installing dependencies...
    cd host-agent
    call npm install
    cd ..
)

REM Start the agent
echo Starting agent on http://127.0.0.1:3002
node host-agent\agent.js
