import { useRouter } from "next/router";
import { toast, Flip } from "react-toastify";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useExport } from "./ExportState";

export function useExportData() {
    const router = useRouter();

    const { exportState, setExportState } = useExport();

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
    const exportData = () => {
        console.log("Exporting data...");
        if (router.pathname == "/artist") {
            if (!exportState) { // because it hasn't been flipped yet and even it it was, it wouldn't have updated here yet cause that's how useState works :3
                toast.info("Select items to export...", toastProperties)
            } else {
                toast.warn("Export cancelled...", toastProperties)
            }
            setExportState(!exportState);
        } else {
            toast.warn("Data export is not avaliable on this page", toastProperties);
            return null;
        }
    };

    return exportData;
}