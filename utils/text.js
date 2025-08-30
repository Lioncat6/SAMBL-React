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
 * Format milliseconds into a human-readable string
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
	fd: formatDate
};

export default text;