import { toast, Flip, ToastOptions } from "react-toastify";

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

function error(message: string): void {
	toast.error(message, toastProperties);
}

function warn(message: string): void {
	toast.warn(message, toastProperties);
}

function info(message: string): void {
	toast.info(message, toastProperties);
}

/**
 * Custom react-toastify wrapper
 *
 */
const toasts = {
	error,
	info,
	warn
};

export default toasts