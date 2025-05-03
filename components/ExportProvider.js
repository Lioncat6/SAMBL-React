import React, { createContext, useContext, useState, useEffect } from "react";

const ExportContext = createContext();

export function ExportProvider({ children }) {
    const [exportProviderData, setExportData] = useState([]);
    return (
        <ExportContext.Provider value={{ exportProviderData, setExportData }}>
            {children}
        </ExportContext.Provider>
    );
}

export function useExport() {
    return useContext(ExportContext);
}