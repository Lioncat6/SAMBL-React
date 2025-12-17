import { toast, Flip, ToastOptions } from "react-toastify";

export default function dispError(message: string): void {
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
	toast.error(message, toastProperties);
}