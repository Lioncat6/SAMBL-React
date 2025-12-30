import { createContext, useContext, useState, useEffect } from "react";

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedConfig = JSON.parse(localStorage.getItem("samblConfig")) || {};
        setSettings({
            showHarmony: savedConfig.showHarmony !== undefined ? savedConfig.showHarmony : true,
            showATisket: savedConfig.showATisket !== undefined ? savedConfig.showATisket : true,
            showMet: savedConfig.showMet !== undefined ? savedConfig.showMet : true,
            showExport: savedConfig.showExport !== undefined ? savedConfig.showExport : false,
            listVirtualization: savedConfig.listVirtualization !== undefined ? savedConfig.listVirtualization : true,
            quickFetchThreshold: savedConfig.quickFetchThreshold !== undefined ? savedConfig.quickFetchThreshold : 500,
            currentProvider: savedConfig.currentProvider !== undefined ? savedConfig.currentProvider : "spotify"
        });
        setLoading(false);
    }, []);

    const updateSettings = (newSettings) => {
        const extractedSettings = {
            showHarmony: newSettings.showHarmony !== undefined ? newSettings.showHarmony : settings.showHarmony,
            showATisket: newSettings.showATisket !== undefined ? newSettings.showATisket : settings.showATisket,
            showMet: newSettings.showMet !== undefined ? newSettings.showMet : settings.showMet,
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
