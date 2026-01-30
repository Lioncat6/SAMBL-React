"use client";

import { toast, Flip, ToastOptions } from "react-toastify";
import { usePathname } from "next/navigation";
import { useExport } from "./ExportState";

export function useExportData() {
    const router = usePathname();

    let export_context = useExport();
    if (export_context === undefined) {
        throw new Error("The export context wasn't defined before being used");
    }
    const { exportState, setExportState, allItems } = export_context;

    let toastProperties: ToastOptions = {
        position: "top-left",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        transition: Flip,
    };

    const exportItems = () => {
        if (router === "/artist" || router === "/find") {
            setExportState(!exportState);
            if (!exportState) {
                toast.info("Revealing export buttons...", toastProperties);
            } else {
                toast.info("Hiding export buttons...", toastProperties);
            }
        } else {
            toast.warn(
                "Individual data export is not avaliable on this page",
                toastProperties,
            );
            return null;
        }
    };

    const exportAllItems = () => {
        if (router === "/artist" || router === "/find") {
            navigator.clipboard.writeText(JSON.stringify(allItems));
            toast.info("Copied all items to clipboard", toastProperties);
        } else {
            toast.warn(
                "Full data export is not avaliable on this page",
                toastProperties,
            );
            return null;
        }
    };

    return { exportItems, exportAllItems };
}
