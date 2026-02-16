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

/**
 * Toasts error Wrapper
 * @param message Message to display in toast
 * @param error Full error object to log to console
 */
function error(message: string, error?: any): void {
	console.error(message);
	if (error) console.error(error)
	toast.error(message, toastProperties);
}

/**
 * Toasts warn Wrapper
 * @param message Message to display in toast
 * @param warn Full warn object to log to console
 */
function warn(message: string, warn?: any): void {
	console.warn(message)
	if (warn) console.warn(warn)
	toast.warn(message, toastProperties);
}

/**
 * Toasts info Wrapper
 * @param message Message to display in toast
 * @param info Full info object to log to console
 */
function info(message: string, info?: any): void {
	console.info(message)
	if (info) console.info(info)
	toast.info(message, toastProperties);
}

async function dispPromise<T>(promise: Promise<T>, message: string, errorMessage: string): Promise<T> {
	console.info(message);
	const id = toast.loading(message, toastProperties);
	try {
		const result = await promise;
		toast.dismiss(id);
		return result;
	} catch (err) {
		console.error(errorMessage);
		toast.update(id, {
			render: errorMessage,
			type: "error",
			isLoading: false,
			...toastProperties,
		});
		throw err; 
	}
}

/**
 * Custom react-toastify wrapper
 *
 */
const toasts = {
	error,
	info,
	warn,
	dispPromise
};

export default toasts