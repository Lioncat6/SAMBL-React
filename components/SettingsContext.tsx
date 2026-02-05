import { createContext, useContext, useState, useEffect } from "react";
import seeders from "../lib/seeders/seeders";
import { SAMBLSettings } from "../types/component-types";

const defaultSettings: SAMBLSettings = {
    enabledSeeders: seeders.getDefaultSeederNamespaces(),
    showExport: false,
    listVirtualization: true,
    quickFetchThreshold: 500,
    currentProvider: "spotify"
};

export interface SAMBLSettingsContext {
    settings: SAMBLSettings;
    updateSettings: (newSettings: Partial<SAMBLSettings>) => void;
    loading: boolean;
}

const SettingsContext = createContext<SAMBLSettingsContext | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<SAMBLSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedConfig = JSON.parse(localStorage.getItem("samblConfig") || "{}");
        const newSettings: SAMBLSettings = { ...defaultSettings, ...savedConfig };
        setSettings(newSettings);
        setLoading(false);
    }, []);

    const updateSettings = (newSettings: Partial<SAMBLSettings>) => {
        setSettings(prevSettings => {
            const extractedSettings: SAMBLSettings = { ...prevSettings, ...newSettings };
            localStorage.setItem("samblConfig", JSON.stringify(extractedSettings));
            return extractedSettings;
        });
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}
