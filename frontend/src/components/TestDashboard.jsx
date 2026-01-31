import React from 'react';

// Simple test component to verify rendering
export const TestDashboard = () => {
    return (
        <div style={{
            background: 'black',
            color: 'white',
            padding: '50px',
            textAlign: 'center',
            minHeight: '100vh'
        }}>
            <h1 style={{ fontSize: '48px', color: '#06b6d4' }}>
                ✅ NEW DASHBOARD LOADED SUCCESSFULLY
            </h1>
            <p style={{ fontSize: '24px', marginTop: '20px' }}>
                If you see this message, the new code is working!
            </p>
            <div style={{
                marginTop: '40px',
                padding: '20px',
                background: '#1a1a1a',
                borderRadius: '10px',
                border: '2px solid #06b6d4'
            }}>
                <p>This is the NEW Dashboard component</p>
                <p>The old interface had a "PORT SENTINEL" header with green cyber theme</p>
                <p>This new interface should have:</p>
                <ul style={{ textAlign: 'left', maxWidth: '600px', margin: '20px auto' }}>
                    <li>Black background (not dark green)</li>
                    <li>"SIMULATION MODE" badge in cyan</li>
                    <li>4 stat cards showing Active Ports, Traffic, CPU, Alerts</li>
                    <li>Tabs: Live Monitor, Network Graph, Security Alerts</li>
                    <li>Sparkline charts in the table</li>
                </ul>
            </div>
        </div>
    );
};
