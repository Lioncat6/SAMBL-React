"use client";

import { toast, Flip, ToastOptions } from "react-toastify";
import { usePathname } from "next/navigation";
import { useExport } from "./ExportState";
import text from "../utils/text";
import toasts from "../utils/toasts";

export function useExportData() {
    const router = usePathname();

    let export_context = useExport();
    if (export_context === undefined) {
        throw new Error("The export context wasn't defined before being used");
    }
    const { exportState, setExportState, allItems } = export_context;

    const exportItems = () => {
        if (router === "/artist" || router === "/find") {
            setExportState(!exportState);
            if (!exportState) {
                toasts.info("Revealing export buttons...");
            } else {
                toasts.info("Hiding export buttons...");
            }
        } else {
            toasts.warn("Individual data export is not avaliable on this page");
            return null;
        }
    };

    const exportAllItems = () => {
        if (router === "/artist" || router === "/find") {
            text.copy(JSON.stringify(allItems), true);
        } else {
            toasts.warn("Full data export is not avaliable on this page")
            return null;
        }
    };

    return { exportItems, exportAllItems };
}
