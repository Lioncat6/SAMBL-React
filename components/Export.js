import { useRouter } from "next/router";
import { toast, Flip } from "react-toastify";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useExport } from "./ExportState";

export function useExportData() {
    const router = useRouter();

    const { exportState, setExportState, allItems } = useExport();

    let toastProperties = {
        position: "top-left",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        transition: Flip,
    }
    const exportItems = () => {
        if (router.pathname == "/artist") {
            setExportState(!exportState);
            if (!exportState){
                toast.info("Revealing export buttons...", toastProperties)
            } else {
                toast.info("Hiding export buttons...", toastProperties)
            }
        } else {
            toast.warn("Individual data export is not avaliable on this page", toastProperties);
            return null;
        }
    };

    const exportAllItems = () => {
        if (router.pathname == "/artist") {
            navigator.clipboard.writeText(JSON.stringify(allItems));
            toast.info("Copied all items to clipboard", toastProperties)
        } else {
            toast.warn("Full data export is not avaliable on this page", toastProperties);
            return null;
        }
    }

    return {exportItems, exportAllItems};
}