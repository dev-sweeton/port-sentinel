import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProcessTable from './components/ProcessTable';
import { Terminal, ShieldAlert, Power } from 'lucide-react';

const queryClient = new QueryClient();

function App() {
    const [toast, setToast] = useState(null);
    const [showShutdownModal, setShowShutdownModal] = useState(false);
    const [isOffline, setIsOffline] = useState(false);

    const showToast = (message, type = 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const handleShutdown = async () => {
        try {
            await fetch('/api/shutdown', { method: 'POST' });
            setIsOffline(true);
        } catch (error) {
            showToast('Failed to shutdown: ' + error.message);
            setShowShutdownModal(false);
        }
    };

    if (isOffline) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-cyber-dim font-mono">
                <Power size={64} className="text-cyber-secondary mb-4 animate-pulse opacity-50" />
                <h1 className="text-2xl font-bold tracking-widest text-cyber-text/50 uppercase">System Offline</h1>
                <p className="mt-2 text-sm">You can close this tab.</p>
            </div>
        );
    }

    return (
        <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-cyber-bg text-cyber-text p-8 relative overflow-hidden">
                {/* Background Grid Effect */}
                <div className="absolute inset-0 grid grid-cols-[40px_auto] opacity-5 pointer-events-none">
                    <div className="border-r border-cyber-primary/20"></div>
                    <div className="bg-[linear-gradient(0deg,transparent_24%,rgba(0,255,157,0.1)_25%,rgba(0,255,157,0.1)_26%,transparent_27%,transparent_74%,rgba(0,255,157,0.1)_75%,rgba(0,255,157,0.1)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(0,255,157,0.1)_25%,rgba(0,255,157,0.1)_26%,transparent_27%,transparent_74%,rgba(0,255,157,0.1)_75%,rgba(0,255,157,0.1)_76%,transparent_77%,transparent)] bg-[length:50px_50px]"></div>
                </div>

                {/* Toast Notification */}
                {toast && (
                    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded border ${toast.type === 'error' ? 'border-red-500 bg-red-900/90 text-red-100' : 'border-cyber-primary bg-cyber-surface text-cyber-primary'} shadow-[0_0_20px_rgba(0,0,0,0.5)] animate-bounce`}>
                        <div className="flex items-center gap-2">
                            <ShieldAlert size={20} />
                            <span className="font-bold">{toast.message}</span>
                        </div>
                    </div>
                )}

                {/* Shutdown Modal */}
                {showShutdownModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
                        <div className="bg-cyber-surface border border-cyber-secondary p-8 rounded-lg shadow-[0_0_50px_rgba(255,0,85,0.2)] max-w-sm w-full text-center">
                            <Power size={48} className="text-cyber-secondary mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-white mb-2">SHUTDOWN SYSTEM?</h2>
                            <p className="text-cyber-dim mb-6 text-sm">This will terminate the PortSentinel server and all monitoring.</p>
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => setShowShutdownModal(false)}
                                    className="px-4 py-2 rounded border border-cyber-dim text-cyber-dim hover:text-white hover:border-white transition-colors"
                                >
                                    CANCEL
                                </button>
                                <button
                                    onClick={handleShutdown}
                                    className="px-4 py-2 rounded bg-cyber-secondary text-white font-bold hover:shadow-[0_0_15px_rgba(255,0,85,0.6)] transition-all"
                                >
                                    CONFIRM OFF
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <header className="mb-8 border-b border-cyber-primary/30 pb-4 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                        <Terminal className="text-cyber-primary" size={32} />
                        <h1 className="text-3xl font-bold tracking-wider text-cyber-primary uppercase drop-shadow-[0_0_10px_rgba(0,255,157,0.5)]">
                            Port<span className="text-white">Sentinel</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-xs text-cyber-dim font-mono hidden sm:block">
                            SYS.ADMIN.ACCESS // GRANTED
                        </div>
                        <button
                            onClick={() => setShowShutdownModal(true)}
                            className="text-cyber-secondary hover:text-white hover:bg-cyber-secondary/20 p-2 rounded-full transition-colors"
                            title="Shutdown System"
                        >
                            <Power size={20} />
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="relative z-10">
                    <ProcessTable showToast={showToast} />
                </main>
            </div>
        </QueryClientProvider>
    );
}

export default App;
