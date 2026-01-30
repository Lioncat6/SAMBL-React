"use client";
import React, { createContext, useContext, useState } from "react";

export type ExportContextType = {
    exportState: boolean,
    setExportState: React.Dispatch<React.SetStateAction<boolean>>,
    allItems: never[];
    setAllItems: React.Dispatch<React.SetStateAction<never[]>>;
};

const ExportContext = createContext<ExportContextType | undefined>(undefined);

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