const DeezerPublicApi = require("deezer-public-api");
import logger from "../../../utils/logger";
import withCache from "../../../utils/cache";
import ErrorHandler from "../../../utils/errorHandler";
const namespace = "deezer";

const err = new ErrorHandler(namespace);

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
		err.handleError("Error fetching track by ISRC:", error);
		
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
		err.handleError("Error fetching album by UPC:", error);
		
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
		err.handleError("Error searching for artist:", error);
		
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
		err.handleError("Error fetching album by ID:", error);
		
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
		err.handleError("Error fetching track by ID:", error);
		
	}
}

async function getArtistById(deezerId) {
	await refreshApi();
	try {
		const data = await deezerApi.artist(deezerId);
		if (data.name) {
			return data;
		} else {
			return null;
		}
	} catch (error) {
		err.handleError("Error fetching artist by ID:", error);
		
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

function formatArtistLookupData(rawData) {
	return rawData;
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
		relevance: `${rawObject.nb_fan} fans`,
		info: `${rawObject.nb_album} albums`,
		genres: null,
		followers: rawObject.nb_fan,
		popularity: null,
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

function createUrl(type, id) {
	return `https://www.deezer.com/${type}/${id}`;
}

const deezer = {
	namespace,
	getTrackByISRC: withCache(getTrackByISRC, { ttl: 60 * 30, namespace: namespace }),
	getAlbumByUPC: withCache(getAlbumByUPC, { ttl: 60 * 30, namespace: namespace }),
    searchByArtistName: withCache(searchByArtistName, { ttl: 60 * 30,  namespace: namespace }),
	getAlbumById: withCache(getAlbumById, { ttl: 60 * 30, namespace: namespace }),
	getTrackById: withCache(getTrackById, { ttl: 60 * 30, namespace: namespace }),
	getArtistById: withCache(getArtistById, { ttl: 60 * 30, namespace: namespace }),
	formatArtistSearchData,
	formatArtistLookupData,
    formatArtistObject,
    getArtistUrl,
	getTrackISRCs,
	getAlbumUPCs,
	parseUrl,
	createUrl
};

export default deezer;
