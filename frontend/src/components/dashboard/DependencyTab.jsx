import React, { useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, Handle, Position, MarkerType, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import { List, Network as NetworkIcon } from 'lucide-react';

// Custom Node for our services
const ServiceNode = ({ data }) => {
    const categoryColors = {
        frontend: 'bg-cyan-900/50 border-cyan-500/50',
        backend: 'bg-purple-900/50 border-purple-500/50',
        database: 'bg-indigo-900/50 border-indigo-500/50',
        cache: 'bg-green-900/50 border-green-500/50',
    };

    const categoryDotColors = {
        frontend: 'bg-cyan-400',
        backend: 'bg-purple-400',
        database: 'bg-indigo-400',
        cache: 'bg-green-400',
    };

    return (
        <div className={`px-4 py-3 rounded-lg border shadow-lg w-48 transition-all ${categoryColors[data.category] || 'bg-gray-800/80 border-gray-500/50'
            }`}>
            <Handle type="target" position={Position.Top} className="!bg-gray-400" />

            <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${categoryDotColors[data.category] || 'bg-gray-400'} animate-pulse`} />
                <span className="text-xs font-bold text-gray-300 uppercase">{data.type}</span>
            </div>

            <div className="font-bold text-white text-sm truncate">{data.label}</div>
            <div className="text-[10px] text-gray-400 font-mono mt-1">:{data.port}</div>

            <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />

            {/* Traffic Dot Animation */}
            <div className="absolute -right-1 -top-1">
                <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
            </div>
        </div>
    );
};

const nodeTypes = { service: ServiceNode };

export const DependencyTab = ({ ports }) => {
    const [viewMode, setViewMode] = useState('graph'); // 'graph' or 'list'

    // Generate Graph Data
    const { nodes, edges } = useMemo(() => {
        const generatedNodes = [];
        const generatedEdges = [];

        // Define hierarchy levels
        const frontend = ports.filter(p => p.category === 'frontend');
        const backend = ports.filter(p => p.category === 'backend');
        const database = ports.filter(p => p.category === 'database');
        const cache = ports.filter(p => p.category === 'cache');

        // Frontends (Top)
        frontend.forEach((p, i) => {
            generatedNodes.push({
                id: p.port.toString(),
                type: 'service',
                position: { x: 300 * i + 100, y: 50 },
                data: { label: p.name, port: p.port, type: p.type, category: p.category }
            });
        });

        // Backends (Middle)
        backend.forEach((p, i) => {
            generatedNodes.push({
                id: p.port.toString(),
                type: 'service',
                position: { x: 250 * i + 150, y: 250 },
                data: { label: p.name, port: p.port, type: p.type, category: p.category }
            });

            // Connect to frontends
            frontend.forEach(fe => {
                generatedEdges.push({
                    id: `e-${fe.port}-${p.port}`,
                    source: fe.port.toString(),
                    target: p.port.toString(),
                    animated: true,
                    style: { stroke: '#06b6d4', strokeWidth: 2 },
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#06b6d4' },
                    label: 'HTTP',
                    labelStyle: { fill: '#06b6d4', fontSize: 10 },
                    labelBgStyle: { fill: '#1f2937' },
                });
            });
        });

        // Databases (Bottom Left)
        database.forEach((p, i) => {
            generatedNodes.push({
                id: p.port.toString(),
                type: 'service',
                position: { x: 200 * i + 50, y: 450 },
                data: { label: p.name, port: p.port, type: p.type, category: p.category }
            });

            // Connect to backends
            if (backend.length > 0) {
                const parent = backend[i % backend.length];
                generatedEdges.push({
                    id: `e-${parent.port}-${p.port}`,
                    source: parent.port.toString(),
                    target: p.port.toString(),
                    animated: true,
                    style: { stroke: '#6366f1', strokeWidth: 2 },
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
                    label: 'DB',
                    labelStyle: { fill: '#6366f1', fontSize: 10 },
                    labelBgStyle: { fill: '#1f2937' },
                });
            }
        });

        // Cache (Bottom Right)
        cache.forEach((p, i) => {
            generatedNodes.push({
                id: p.port.toString(),
                type: 'service',
                position: { x: 200 * i + 500, y: 450 },
                data: { label: p.name, port: p.port, type: p.type, category: p.category }
            });

            // Connect to backends
            if (backend.length > 0) {
                backend.forEach(be => {
                    generatedEdges.push({
                        id: `e-${be.port}-${p.port}`,
                        source: be.port.toString(),
                        target: p.port.toString(),
                        animated: true,
                        style: { stroke: '#a855f7', strokeWidth: 2 },
                        markerEnd: { type: MarkerType.ArrowClosed, color: '#a855f7' },
                        label: 'Cache',
                        labelStyle: { fill: '#a855f7', fontSize: 10 },
                        labelBgStyle: { fill: '#1f2937' },
                    });
                });
            }
        });

        return { nodes: generatedNodes, edges: generatedEdges };
    }, [ports]);

    // Generate dependency list
    const dependencyList = useMemo(() => {
        const list = [];
        ports.forEach(port => {
            if (port.dependencies && port.dependencies.length > 0) {
                port.dependencies.forEach(depPort => {
                    const depProcess = ports.find(p => p.port === depPort);
                    if (depProcess) {
                        list.push({
                            source: port,
                            target: depProcess,
                            type: depProcess.category === 'database' ? 'Database' :
                                depProcess.category === 'cache' ? 'Cache' : 'HTTP'
                        });
                    }
                });
            }
        });
        return list;
    }, [ports]);

    return (
        <div className="space-y-4">
            {/* View Mode Toggle */}
            <div className="flex items-center justify-between bg-gray-900/50 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                <div className="text-sm text-gray-400">
                    {viewMode === 'graph' ? 'Network Graph View' : 'Dependency List View'}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('graph')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'graph'
                                ? 'bg-cyan-500 text-black'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        <NetworkIcon size={14} />
                        Graph
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'list'
                                ? 'bg-cyan-500 text-black'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        <List size={14} />
                        List
                    </button>
                </div>
            </div>

            {/* Graph View */}
            {viewMode === 'graph' && (
                <div className="h-[600px] bg-gray-900/40 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md relative">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        fitView
                        className="bg-gray-900/50"
                    >
                        <Background color="#333" gap={20} />
                        <Controls className="!bg-gray-800 !border-white/10 !fill-white" />
                        <MiniMap
                            className="!bg-gray-800 !border-white/10"
                            nodeColor={(node) => {
                                const colors = {
                                    frontend: '#06b6d4',
                                    backend: '#a855f7',
                                    database: '#6366f1',
                                    cache: '#10b981',
                                };
                                return colors[node.data.category] || '#6b7280';
                            }}
                        />
                    </ReactFlow>

                    {/* Legend */}
                    <div className="absolute bottom-4 left-4 bg-black/60 p-3 rounded-lg border border-white/10 backdrop-blur text-xs text-gray-400 space-y-1">
                        <div className="font-bold text-white mb-2">Connection Types</div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-0.5 bg-cyan-500"></div> HTTP/API Traffic
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-0.5 bg-indigo-500"></div> Database Connection
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-0.5 bg-purple-500"></div> Cache Connection
                        </div>
                    </div>
                </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
                <div className="bg-gray-900/40 border border-white/10 rounded-xl p-6 backdrop-blur-md">
                    <h3 className="text-lg font-bold text-white mb-4">Dependency Chain</h3>
                    {dependencyList.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <NetworkIcon className="mx-auto mb-3 opacity-20" size={48} />
                            No dependencies detected
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {dependencyList.map((dep, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-4 p-4 bg-gray-800/40 border border-white/5 rounded-lg hover:border-white/10 transition-colors"
                                >
                                    {/* Source */}
                                    <div className="flex-1">
                                        <div className="font-mono text-cyan-400 font-bold">{dep.source.port}</div>
                                        <div className="text-sm text-gray-300">{dep.source.name}</div>
                                        <div className="text-xs text-gray-500 capitalize">{dep.source.category}</div>
                                    </div>

                                    {/* Arrow */}
                                    <div className="flex items-center gap-2">
                                        <div className={`w-12 h-0.5 ${dep.type === 'Database' ? 'bg-indigo-500' :
                                                dep.type === 'Cache' ? 'bg-purple-500' : 'bg-cyan-500'
                                            }`}></div>
                                        <div className={`text-[10px] px-2 py-0.5 rounded border ${dep.type === 'Database' ? 'bg-indigo-900/20 text-indigo-400 border-indigo-500/30' :
                                                dep.type === 'Cache' ? 'bg-purple-900/20 text-purple-400 border-purple-500/30' :
                                                    'bg-cyan-900/20 text-cyan-400 border-cyan-500/30'
                                            }`}>
                                            {dep.type}
                                        </div>
                                        <div className={`w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent ${dep.type === 'Database' ? 'border-l-4 border-l-indigo-500' :
                                                dep.type === 'Cache' ? 'border-l-4 border-l-purple-500' : 'border-l-4 border-l-cyan-500'
                                            }`}></div>
                                    </div>

                                    {/* Target */}
                                    <div className="flex-1 text-right">
                                        <div className="font-mono text-cyan-400 font-bold">{dep.target.port}</div>
                                        <div className="text-sm text-gray-300">{dep.target.name}</div>
                                        <div className="text-xs text-gray-500 capitalize">{dep.target.category}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
