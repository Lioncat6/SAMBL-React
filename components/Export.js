import { useRouter } from "next/router";
import { toast, Flip } from "react-toastify";



function exportData() {
    console.log("Exporting data...");
    const router = useRouter();
    if (router.pathname == "/artist") {

    } else {
        toast.error("This feature is not available on this page.", {
            position: "top-left",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "dark",
            transition: Flip,
        });
    }
}

export default exportData;