import { createContext, useContext, useState, useEffect } from "react";

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState({
        showHarmony: false,
        showATisket: false,
    });

    useEffect(() => {
        // Load settings from localStorage on mount
        const savedConfig = JSON.parse(localStorage.getItem("samblConfig")) || {};
        setSettings({
            showHarmony: savedConfig.showHarmony || false,
            showATisket: savedConfig.showATisket || false,
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