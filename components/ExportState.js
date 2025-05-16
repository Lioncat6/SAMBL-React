import React, { createContext, useContext, useState, useEffect } from "react";

const ExportContext = createContext();

export function ExportState({ children }) {
    const [exportState, setExportState] = useState(false);
    const [allItems, setAllItems] = useState([]);
    return (
        <ExportContext.Provider value={{ exportState, setExportState, allItems, setAllItems }}>
            {children}
        </ExportContext.Provider>
    );
}

export function useExport() {
    return useContext(ExportContext);
}