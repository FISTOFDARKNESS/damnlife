"use client";

import React from "react";
import { useSettings } from "../providers/SettingsProvider";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { settings, updateSettings } = useSettings();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-dark-surface border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Application Settings</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Next-gen effects toggle */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-semibold text-white mb-1">Next-Gen Effects</h3>
                            <p className="text-sm text-gray-400">
                                Enable immersive 3D canvas and animations. Disable this to improve compiling time and device performance.
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.nextGenEffects}
                                onChange={(e) => updateSettings({ nextGenEffects: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500"></div>
                        </label>
                    </div>

                    {/* Notifications toggle */}
                    <div className="flex items-start justify-between pt-4 border-t border-white/5">
                        <div>
                            <h3 className="font-semibold text-white mb-1">Push Notifications</h3>
                            <p className="text-sm text-gray-400">
                                Receive alerts for new follows, verifications, and marketplace activity.
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.receiveNotifications}
                                onChange={(e) => updateSettings({ receiveNotifications: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500"></div>
                        </label>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-white/5 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg text-sm font-medium text-white border border-white/10 hover:bg-white/10 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
