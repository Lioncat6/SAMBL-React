import { createContext, useContext, useState, useEffect } from "react";
import seeders from "../lib/seeders/seeders";
const SettingsContext = createContext();

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedConfig = JSON.parse(localStorage.getItem("samblConfig")) || {};
        setSettings({
            enabledSeeders: savedConfig.enabledSeeders !== undefined ? savedConfig.enabledSeeders: seeders.getDefaultSeederNamespaces(),
            showExport: savedConfig.showExport !== undefined ? savedConfig.showExport : false,
            listVirtualization: savedConfig.listVirtualization !== undefined ? savedConfig.listVirtualization : true,
            quickFetchThreshold: savedConfig.quickFetchThreshold !== undefined ? savedConfig.quickFetchThreshold : 500,
            currentProvider: savedConfig.currentProvider !== undefined ? savedConfig.currentProvider : "spotify"
        });
        setLoading(false);
    }, []);

    const updateSettings = (newSettings) => {
        const extractedSettings = {
            enabledSeeders: newSettings.enabledSeeders !== undefined ? newSettings.enabledSeeders : settings.enabledSeeders,
            showExport: newSettings.showExport !== undefined ? newSettings.showExport : settings.showExport,
            listVirtualization: newSettings.listVirtualization !== undefined ? newSettings.listVirtualization : settings.listVirtualization,
            quickFetchThreshold: newSettings.quickFetchThreshold !== undefined ? newSettings.quickFetchThreshold : settings.quickFetchThreshold,
            currentProvider: newSettings.currentProvider !== undefined ? newSettings.currentProvider : settings.currentProvider
        }
        setSettings(extractedSettings);
        localStorage.setItem("samblConfig", JSON.stringify(extractedSettings));
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
