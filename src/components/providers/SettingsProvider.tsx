"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface UserSettings {
    nextGenEffects: boolean;
    receiveNotifications: boolean;
}

interface SettingsContextType {
    settings: UserSettings;
    updateSettings: (newSettings: Partial<UserSettings>) => void;
}

const defaultSettings: UserSettings = {
    nextGenEffects: true,
    receiveNotifications: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<UserSettings>(defaultSettings);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const storedSettings = localStorage.getItem("excalibur_settings");
        if (storedSettings) {
            try {
                let parsedSettings;
                try {
                    parsedSettings = JSON.parse(storedSettings);
                } catch {
                    // Fallback to decode base64 from older versions
                    parsedSettings = JSON.parse(atob(storedSettings));
                    localStorage.setItem("excalibur_settings", JSON.stringify({ ...defaultSettings, ...parsedSettings }));
                }
                setSettings({ ...defaultSettings, ...parsedSettings });
            } catch (e) {
                console.error("Failed to parse settings", e);
                localStorage.removeItem("excalibur_settings"); // clear corrupted data
            }
        }
        setIsLoaded(true);
    }, []);

    const updateSettings = (newSettings: Partial<UserSettings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        localStorage.setItem("excalibur_settings", JSON.stringify(updated));
    };

    // Prevent hydration mismatch by optionally not rendering until loaded, or just returning default internally.
    // For standard contexts, we can just render the children immediately.
    
    return (
        <SettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
}
