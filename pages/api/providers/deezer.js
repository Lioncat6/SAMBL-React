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

function formatArtistObject(artist) {
	let imageUrl = artist.picture_big;
	if (imageUrl.includes("/artist//")) {
		imageUrl = artist.picture;
	}
	return {
		name: artist.name,
		url: getArtistUrl(artist),
		imageUrl: imageUrl || "",
		relevance: `${artist.nb_fan} fans`,
		info: `${artist.nb_album} albums`,
		genres: null,
		followers: artist.nb_fan,
		popularity: null,
		id: artist.id,
		provider: namespace,
	};
}

function formatAlbumArtistObject(artist) {
	return {
		name: artist.name,
		url: artist.link,
		imageUrl: artist.picture_xl || "",
		imageUrlSmall: artist.picture_medium || "",
		id: artist.id,
		provider: namespace,
	};
}

async function getArtistAlbumsInternal(artistId) {
	try {
		let artistAlbumData = await deezerApi.artist.albums(artistId, 9999, 0);
		return artistAlbumData;
	} catch {
		return null;
	}
}

async function getArtistAlbums(artistId, offset, limit) {
	try {
		let artistAlbumData = await deezer.getArtistAlbumsInternal(artistId);
		let artistAlbumMap = Object.fromEntries(artistAlbumData.data.map(album => [album.id, album]));
		let artistName = (await deezer.getArtistById(artistId)).name;
		let searchAlbumData = await deezerApi.search.album(`artist:"${artistName}"`, null, 9999, offset);

		searchAlbumData.data.forEach(album => {
			let artistAlbum = artistAlbumMap[album.id];
			if (!artistAlbum) {
				searchAlbumData.data = searchAlbumData.data.filter(a => a.id !== album.id);
				return;
			}
			if (artistAlbum) {
				album.release_date = artistAlbum.release_date;
				album.fans = artistAlbum.fans;
			}
		});
		return searchAlbumData;
	} catch (error) {
		err.handleError("Error fetching artist albums:", error);
	}
}

function formatAlbumGetData(rawData) {
	const nextIntRegex = /index=(\d+)/;
	return {
		count: rawData.total,
		current: !(rawData.prev) ? 0 : rawData.prev.match(nextIntRegex) ? parseInt(rawData.prev.match(nextIntRegex)[1]) + rawData.data.length : 0,
		next: rawData.next ? rawData.next.match(nextIntRegex)[1] : null,
		albums: rawData.data,
	};
}

function formatAlbumObject(album) {
	return {
		provider: namespace,
		id: album.id,
		name: album.title,
		url: album.link,
		imageUrl: album.cover_xl || "",
		imageUrlSmall: album.cover_medium || "",
		albumArtists: album.artist ? [formatAlbumArtistObject(album.artist)] : [],
		artistNames: album.artist ? album.artist.name : "",
		releaseDate: album.release_date,
		trackCount: album.nb_tracks,
		albumType: album.record_type,
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
	getArtistAlbums: withCache(getArtistAlbums, { ttl: 60 * 30, namespace: namespace }),
	getArtistAlbumsInternal: withCache(getArtistAlbumsInternal, { ttl: 60 * 30, namespace: namespace }),
	formatArtistSearchData,
	formatArtistLookupData,
    formatArtistObject,
	formatAlbumArtistObject,
	formatAlbumGetData,
	formatAlbumObject,
    getArtistUrl,
	getTrackISRCs,
	getAlbumUPCs,
	parseUrl,
	createUrl
};

export default deezer;
