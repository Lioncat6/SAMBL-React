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
function capitalizeFirstLetter(text: string | number): string {
	if (typeof text !== "string") text = String(text);
	return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
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
function formatDurationMS(duration:string): number | null {
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
function removeLeadingZeros(code: number|string): number {
	const num = Number(code)
	return num;
}

/**
 * Utility object for text formatting.
 *
 */
const text = {
	normalizeText,
	nt: normalizeText,
	capitalizeFirstLetter,
	capitalizeFirst: capitalizeFirstLetter,
	cf: capitalizeFirstLetter,
	formatMS,
	fm: formatMS,
	formatDate,
	fd: formatDate,
	formatSeconds,
	fs: formatSeconds,
	formatDuration,
	fdur: formatDuration,
	formatDurationMS,
	fdm: formatDurationMS,
	removeLeadingZeros,
	rmz: removeLeadingZeros
};

export default text;
