const DeezerPublicApi = require("deezer-public-api");
import logger from "../../../utils/logger";
import withCache from "../../../utils/cache";

const namespace = "deezer";

let deezerApi = new DeezerPublicApi();
let lastRefreshed = Date.now();

async function refreshApi() {
	const timeout = 60 * 60 * 1000 * 6;
	if (Date.now() - lastRefreshed > timeout) {
		deezerApi = new DeezerPublicApi();
		lastRefreshed = Date.now();
		logger.debug("Deezer API refreshed");
	}
}

async function getTrackByISRC(isrc) {
	await refreshApi();
	try {
		const data = await deezerApi.track(`isrc:${isrc}`);
		if (data.title) {
			return data;
		} else {
			return null;
		}
	} catch (error) {
		logger.error("Error fetching track by ISRC:", error);
		throw error;
	}
}

async function getAlbumByUPC(upc) {
	await refreshApi();
	try {
		const data = await deezerApi.album(`upc:${upc.replace(/^0+/, "")}`);
		if (data.title) {
			return data;
		} else {
			return null;
		}
	} catch (error) {
		logger.error("Error fetching album by UPC:", error);
		throw error;
	}
}

async function searchByArtistName(query) {
	await refreshApi();
	try {
		const data = await deezerApi.search.artist(query);
		if (data.data && data.data.length > 0) {
            return data;
        } else {
            return null;
        }
	} catch (error) {
		logger.error("Error searching for artist:", error);
		throw error;
	}
}

async function getAlbumById(deezerId) {
	await refreshApi();
	try {
		const data = await deezerApi.album(deezerId);
		if (data.title) {
			return data;
		} else {
			return null;
		}
	} catch (error) {
		logger.error("Error fetching album by ID:", error);
		throw error;
	}
}

async function getTrackById(deezerId) {
	await refreshApi();
	try {
		const data = await deezerApi.track(deezerId);
		if (data.title) {
			return data;
		} else {
			return null;
		}
	} catch (error) {
		logger.error("Error fetching track by ID:", error);
		throw error;
	}
}

function getTrackISRCs(track) {
	if (!track) return null;
	let isrcs = track?.isrc ? [track.isrc] : [];
	return isrcs;
}

function getAlbumUPCs(album) {
	if (!album) return null;
	let upcs = album?.upc ? [album.upc] : [];
	return upcs;
}

function formatArtistSearchData(rawData) {
	return rawData.data;
}

function formatArtistObject(rawObject) {
	let imageUrl = rawObject.picture_big;
	if (imageUrl.includes("/artist//")) {
		imageUrl = rawObject.picture;
	}
	return {
		name: rawObject.name,
		url: getArtistUrl(rawObject),
		imageUrl: imageUrl || "",
		info: `${rawObject.nb_album} albums`,
		followers: `${rawObject.nb_fan} fans`,
		id: rawObject.id,
		type: namespace,
	};
}

function getArtistUrl(artist) {
	return artist.link || `https://www.deezer.com/artist/${artist.id}`;
}

function parseUrl(url) {
	const regex = /(?:www\.)?deezer\.com\/(artist|track|album)\/(\d+)/;
	const match = url.match(regex);
	if (match) {
		return {
			type: match[1],
			id: match[2],
		};
	}
	return null;
}

const deezer = {
	namespace,
	getTrackByISRC: withCache(getTrackByISRC, { ttl: 60 * 30, namespace: namespace }),
	getAlbumByUPC: withCache(getAlbumByUPC, { ttl: 60 * 30, namespace: namespace }),
    searchByArtistName: withCache(searchByArtistName, { ttl: 60 * 30,  namespace: namespace }),
	getAlbumById: withCache(getAlbumById, { ttl: 60 * 30, namespace: namespace }),
	getTrackById: withCache(getTrackById, { ttl: 60 * 30, namespace: namespace }),
	formatArtistSearchData,
    formatArtistObject,
    getArtistUrl,
	getTrackISRCs,
	getAlbumUPCs,
	parseUrl
};

export default deezer;
