import { createContext, useContext, useState, useEffect } from "react";

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState({
        showHarmony: true,
        showATisket: true,
        showExport: false,
        listVirtualization: true
    });

    useEffect(() => {
        // Load settings from localStorage on mount
        const savedConfig = JSON.parse(localStorage.getItem("samblConfig")) || {};
        setSettings({
            showHarmony: savedConfig.showHarmony !== undefined ? savedConfig.showHarmony : true,
            showATisket: savedConfig.showATisket !== undefined ? savedConfig.showATisket : true,
            showExport: savedConfig.showExport !== undefined ? savedConfig.showExport : false,
            listVirtualization: savedConfig.listVirtualization !== undefined ? savedConfig.listVirtualization : true,
        });
    }, []);

    const updateSettings = (newSettings) => {
        setSettings(newSettings);
        localStorage.setItem("samblConfig", JSON.stringify(newSettings));
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}