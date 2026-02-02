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

async function dispPromise<T>(promise: Promise<T>, message: string, errorMessage: string): Promise<T> {
	const id = toast.loading(message, toastProperties);
	try {
		const result = await promise;
		toast.dismiss(id);
		return result;
	} catch (err) {
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