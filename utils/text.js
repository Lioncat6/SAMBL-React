/**
 * Uppercases text and removes special characters for various languages
 *
 * @param {string} text The text to normalize.
 */
function normalizeText(text) {
	if (typeof text !== "string") text = String(text);
	let normalizedText = text.toUpperCase().replace(/\s/g, "");
	let textRemovedChars = normalizedText.replace(/['’!?.,:;(){}\[\]<>\/\\|_\-+=*&^%$#@~`“”«»„“”¿¡]/g, "");
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
function capitalizeFirstLetter(text) {
	if (typeof text !== "string") text = String(text);
	return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Format milliseconds into MM:SS
 *
 * @param {number} ms The milliseconds to format.
 */
function formatMS(ms) {
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
function formatSeconds(seconds) {
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
function formatDate(dateStr) {
	const date = new Date(dateStr);
	if (isNaN(date)) return null;
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
function formatDuration(duration) {
	const match = /^PT(?:(\d+)M)?(?:(\d+)S)?$/.exec(duration);
	if (!match) return duration;
	const minutes = parseInt(match[1] || "0", 10);
	const seconds = parseInt(match[2] || "0", 10);
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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
	fd: formatDuration
};

export default text;
