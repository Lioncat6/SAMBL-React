import { useRouter } from "next/router";
import { toast, Flip } from "react-toastify";

export function useExportData() {
    const router = useRouter();
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
            toast.info("Select items to export", {
                ...toastProperties,
                autoClose: false,
                draggable: false,
            });
        } else {
            toast.warn("Data export is not avaliable on this page", toastProperties);
        }
    };

    return exportData;
}