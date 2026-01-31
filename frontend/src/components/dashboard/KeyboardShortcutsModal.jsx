import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ShortcutRow = ({ keys, description }) => (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
        <span className="text-sm text-gray-300">{description}</span>
        <div className="flex items-center gap-2">
            {keys.map((key, i) => (
                <React.Fragment key={i}>
                    <kbd className="px-3 py-1.5 bg-gray-800 border border-white/20 rounded-lg text-xs font-mono text-white shadow-lg">
                        {key}
                    </kbd>
                    {i < keys.length - 1 && <span className="text-gray-500">+</span>}
                </React.Fragment>
            ))}
        </div>
    </div>
);

export const KeyboardShortcutsModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const shortcuts = [
        { keys: ['?'], description: 'Show/hide keyboard shortcuts' },
        { keys: ['/'], description: 'Focus search bar' },
        { keys: ['r'], description: 'Refresh data manually' },
        { keys: ['e'], description: 'Export data to JSON' },
        { keys: ['Esc'], description: 'Close modals/dialogs' },
        { keys: ['1'], description: 'Switch to Overview tab' },
        { keys: ['2'], description: 'Switch to Alerts tab' },
        { keys: ['s'], description: 'Toggle sound notifications' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-gray-900 border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-b border-white/10 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Keyboard className="text-purple-400" size={24} />
                                <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Shortcuts List */}
                        <div className="p-6">
                            <div className="space-y-1">
                                {shortcuts.map((shortcut, index) => (
                                    <ShortcutRow
                                        key={index}
                                        keys={shortcut.keys}
                                        description={shortcut.description}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-black/40 border-t border-white/10 p-4 text-center text-xs text-gray-500">
                            Press <kbd className="px-2 py-1 bg-gray-800 border border-white/20 rounded text-white">?</kbd> anytime to toggle this help
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
