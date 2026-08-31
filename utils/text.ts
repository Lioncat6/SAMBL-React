import { AlbumIssues } from "../lib/issues";
import { AlbumStatus } from "../types/aggregated-types";
import toasts from "./toasts";

/**
 * Uppercases text and removes special characters for various languages
 *
 * @param {string} text The text to normalize.
 */
function normalizeText(text: string | number): string {
	if (typeof text !== "string") text = String(text);
	let normalizedText = text.toUpperCase().replace(/\s/g, "");
	let textRemovedChars = normalizedText.replace(/["'’!?.,:;(){}\[\]<>\/\\|_\-+=*&^%$#@~`“”«»„“”¿¡]/g, "");
	if (textRemovedChars == "") {
		textRemovedChars = normalizedText;
	}
	return textRemovedChars;
}

/**
 * Capitalizes the first letter of a string
 *
 * @param {string} text The text to capitalize.
 */
function capitalizeFirstLetter(text: string | number, enforeceLowercase = true): string {
	if (typeof text !== "string") text = String(text);
	return text.charAt(0).toUpperCase() + (enforeceLowercase ? text.slice(1).toLowerCase() : text.slice(1));
}

/**
 * Format milliseconds into MM:SS
 *
 * @param {number} ms The milliseconds to format.
 */
function formatMS(ms: number | string): string {
	if (typeof ms !== "number") ms = Number(ms);
	const minutes = Math.floor(ms / 60000);
	const seconds = Math.floor((ms % 60000) / 1000);
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Format seconds into MM:SS
 *
 * @param {number} seconds The seconds to format.
 */
function formatSeconds(seconds: number | string): string {
	if (typeof seconds !== "number") seconds = Number(seconds);
	const minutes = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format any date string to YYYY-MM-DD
 *
 * @param {string} dateStr The date string to format.
 */
function formatDate(dateStr: string): string | null {
	const date = new Date(dateStr);
	if (isNaN(date.getTime())) return null;
	const mm = String(date.getMonth() + 1).padStart(2, "0");
	const dd = String(date.getDate()).padStart(2, "0");
	const yyyy = date.getFullYear();
	return `${yyyy}-${mm}-${dd}`;
}

/**
 * Gets the time in milliseconds since the Unix epoch for a given date string.
 *
 * @param {string | null} dateStr The date string to convert.
 * @returns {number} The time in milliseconds since the Unix epoch.
 */
function getIntTime(dateStr: string | null): number {
	const date = new Date(dateStr || "");
	return isNaN(date.getTime()) ? 0 : date.getTime();
}

/**
 * Compares two dates and returns a value indicating their relative order.
 * @param date1 a
 * @param date2 b
 * @returns {number} The result of the date comparison.
 */
function compareDates(date1: string, date2: string, ascending: boolean = false): number {
	const intTime1 = getIntTime(date1);
	const intTime2 = getIntTime(date2);
	return ascending ? intTime1 - intTime2 : intTime2 - intTime1;
}

/**
 * Handles ISO 8601 duration strings like "PT4M8S".
 *
 * @param {string} duration The ISO 8601 duration string to format.
 * @returns {string} The formatted duration string.
 */
function formatDuration(duration: string): string {
	const match = /^PT(?:(\d+)M)?(?:(\d+)S)?$/.exec(duration);
	if (!match) return duration;
	const minutes = parseInt(match[1] || "0", 10);
	const seconds = parseInt(match[2] || "0", 10);
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Handles ISO 8601 duration strings like "PT4M8S".
 *
 * @param {string} duration The ISO 8601 duration string to format.
 * @returns {number} The raw ms value.
 */
function formatDurationMS(duration: string): number | null {
	const match = /^PT(?:(\d+)M)?(?:(\d+)S)?$/.exec(duration);
	if (!match) return null;
	const minutes = parseInt(match[1] || "0", 10);
	const seconds = parseInt(match[2] || "0", 10);
	return (minutes * 60000) + (seconds * 1000);
}

/**
 * Removes leading zeros on UPC or similar codes
 * 
 * @param {string | number} code input code
 * @returns {number}
 */
function removeLeadingZeros(code: number | string): number {
	const num = Number(code)
	return num;
}


/**
 * Handles copying text to clipboard
 * @param text Text to copy
 * @param all Toggle 'all properties' vs 'property' message
 */
function handleCopy(text: string, all: boolean = false): void {
	if (!navigator.clipboard?.writeText) {
		try {
			const tempInput = document.createElement("input");
			tempInput.value = text;
			document.body.appendChild(tempInput);
			tempInput.select();
			tempInput.setSelectionRange(0, tempInput.value.length - 1);
			document.execCommand('copy');
			tempInput.remove();
			toasts.info(`Copied ${all ? "All Properties" : "Property"} to Clipboard`);
		} catch (err) {
			console.error("Clipboard API not supported. Try using https or a different browser.");
			toasts.error("Unable to copy to clipboard!");
		}

		return;
	}
	if (text.length > 0) {
		navigator.clipboard.writeText(text);
		toasts.info(`Copied ${all ? "All Properties" : "Property"} to Clipboard`);
	}
}

/**
 * Trims ending slashes (/) from URLs
 * @param url URL to trim
 * @returns Trimmed URL
 */
function trimUrl(url: string): string {
	return url.replace(/\/+$/, "");
}

function getColorEmoji(color: AlbumStatus, circle = false) {
	const emojis: Record<AlbumStatus, string> = {
		"red": "🔴",
		"blue": "🔵",
		"orange": "🟠",
		"green": "🟢"
	}
	const squareEmojis: Record<AlbumStatus, string> = {
		"red": "🟥",
		"blue": "🟦",
		"orange": "🟧",
		"green": "🟩"
	}
	return circle ? emojis[color] : squareEmojis[color];
}

/**
 * Formats arrays of data into strings seperated by ' • '; Automatically removes null data
 * @param info Info array
 * @returns Formatted info string
 */
function infoToString(info: (string | null | undefined)[]) {
	const string = info.filter((s) => s != null && s != undefined && s.length > 0).join(" • ");
	return string.length > 0 ? string : null;
}

/**
 * Pads barcodes to 13 digits with leading zeros
 * @param barcode Barcode to pad
 * @returns Padded barcode
 */
function padBarcode(barcode: string): string {
	return String(text.removeLeadingZeros(barcode)).padStart(13, "0")
}

/**
 * Truncates numbers to 2 decimal places
 * @param number Number  to truncate
 * @returns Truncated number
 */
function truncateToTwo(number: number): number {
	return Number(number.toFixed(2).replace(".00", ""))
}

/**
 * Formats MS duration to a human readable format
 * @param duration MS
 */
function displayDuration(duration: number | null | undefined): string {
	if (duration == null || duration == undefined) return "-:--";
	const minutes = Math.floor(duration / 60000);
	const seconds = Math.floor((duration % 60000) / 1000);
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Formats typical duration strings like "1:11:23" or "9:25" into ms
 * @param duration duration string
 * @returns ms
 */
function parseDuration(duration: string): number {
	const segments = duration.split(":");
	let ms = 0;
	if (segments.length == 2) {
		ms += Number(segments[0]) * 60 * 1000;
		ms += Number(segments[1]) * 1000;
	} else if (segments.length == 1) {
		ms += Number(segments[1]) * 1000;
	}
	return ms;
}

// Mostly canibalized from https://github.com/kellnerd/harmony/blob/main/utils/gtin.ts
/**
 * 
 * @param upc UPC / GTIN / Barcode to check validity of
 * @returns True if valid
 */
function validateUPC(upc: string | number): boolean {
	const gtinFormat = /^\d+$/;
	const gtinLengths = [8, 12, 13, 14];
	/** Calculates the checksum of the given (numeric) GTIN string, regardless of its length. */
	function checksum(gtin: string) {
		const length = gtin.length;

		return gtin.split('')
			.map((digit) => Number(digit))
			// checksum factors alternate between 1 and 3, starting with 1 for the last digit
			.reduce((checksum, digit, index) => (checksum + digit * ((length - index) % 2 ? 1 : 3)), 0);
	}
	/** Asserts that the given GTIN has an accepted format/length and a valid check digit. */
	function ensureValidGTIN(gtin: string | number): void {
		gtin = gtin.toString();

		if (!gtin.length) {
			throw new TypeError('GTIN is empty');
		}

		if (!gtinFormat.test(gtin)) {
			throw new TypeError(`GTIN '${gtin}' contains invalid non-numeric characters`);
		}

		if (!gtinLengths.includes(gtin.length)) {
			throw new TypeError(`GTIN '${gtin}' has an invalid length`);
		}

		// the checksum of the whole code (including the check digit) has to be a multiple of 10
		if (checksum(gtin) % 10 !== 0) {
			throw new TypeError(`Checksum of GTIN '${gtin}' is invalid`);
		}
	}
	try {
		ensureValidGTIN(upc);
	} catch {
		return false;
	}
	return true;
}

/**
 * Utility object for text formatting.
 *
 */
const text = {
	normalizeText,
	capitalizeFirst: capitalizeFirstLetter,
	capitalizeFirstLetter,
	formatMS,
	formatDate,
	formatSeconds,
	formatDuration,
	formatDurationMS,
	removeLeadingZeros,
	copy: handleCopy,
	handleCopy,
	trimUrl,
	getColorEmoji,
	infoToString,
	padBarcode,
	truncateToTwo,
	displayDuration,
	parseDuration,
	compareDates,
	getIntTime,
	validateUPC
};

export default text;
