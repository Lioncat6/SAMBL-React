import { useRouter } from "next/router";
import { toast, Flip } from "react-toastify";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useExport } from "./ExportProvider";

export function useExportData() {
    const router = useRouter();

    const { exportProviderData } = useExport(); 

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
            console.log(exportProviderData);
            return exportProviderData
        } else {
            toast.warn("Data export is not avaliable on this page", toastProperties);
            return null;
        }
    };

    return exportData;
}