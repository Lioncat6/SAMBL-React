import { MusicBrainzApi, CoverArtArchiveApi } from "musicbrainz-api";
import logger from "../../../utils/logger";
import withCache from "../../../utils/cache";
import ErrorHandler from "../../../utils/errorHandler";
const namespace = "musicbrainz";

const err = new ErrorHandler(namespace);

const coverArtArchiveApiClient = new CoverArtArchiveApi();
const mbApi = new MusicBrainzApi({
	appName: process.env.REACT_APP_NAME,
	appVersion: process.env.REACT_APP_VERSION,
	appContactInfo: process.env.CONTACT_INFO,
});

function checkError(data) {
	if (data.error) {
		throw new Error(data.error);
	}
}

function validateMBID(mbid) {
	const mbidPattern = /.*[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}.*/i;
	return mbidPattern.test(mbid);
}

async function getIdBySpotifyId(spotifyId) {
	try {
		const data = await mbApi.lookupUrl(`https://open.spotify.com/artist/${spotifyId}`, ["artist-rels"]);
		if (!data.relations || data.relations?.length == 0) {
			return null; // No artist found
		}
		return data.relations[0].artist.id;
	} catch (error) {
		err.handleError("Failed to fetch artist data", error);
	}
}

async function getArtistByUrl(url) {
	try {
		const data = await mbApi.lookupUrl(url, ["artist-rels"]);
		if (!data.relations || data.relations?.length == 0) {
			return null; // No artist found
		}
		return data.relations[0].artist;
	} catch (error) {
		err.handleError("Failed to fetch artist data", error);
	}
}
async function getIdsBySpotifyUrls(spotifyUrls) {
	try {
		const data = await mbApi.lookupUrl(spotifyUrls, ["artist-rels"]);
		if (data.count === 0) {
			return null; // No artist found
		}
		let mbids = {};
		for (let url of data.urls) {
			if (url.relations?.length > 0) {
				mbids[url.resource] = url.relations[0].artist.id;
			}
		}
		console.log(mbids)
		return mbids;
	} catch (error) {
		err.handleError("Failed to get ids", error);
	}
}

async function getAlbumsBySourceUrls(sourceUrls, inc = ["release-rels"]) {
	try {
		const data = await mbApi.lookupUrl(sourceUrls, inc);
		if (data.count === 0) {
			return null; // No albums found
		}
		return data;
	} catch (error) {
		err.handleError("Failed to fetch albums by Source URLs", error);
	}
}

async function getArtistAlbums(mbid, offset = 0, limit = 100, inc = ["url-rels", "recordings", "isrcs"]) {
	try {
		// const data = await mbApi.browse('release', {artist: mbid, limit: limit, offset: offset});
		const data = await mbApi.browse("release", { artist: mbid, limit: limit, offset: offset }, inc);
		checkError(data);
		return data;
	} catch (error) {
		err.handleError("Failed to fetch artist albums", error);
	}
}

async function getArtistFeaturedAlbums(mbid, offset = 0, limit = 100, inc = ["url-rels", "recordings", "isrcs"]) {
	try {
		// const data = await mbApi.browse('release', {track_artist: mbid, limit: limit, offset: offset});
		const data = await mbApi.browse("release", { track_artist: mbid, limit: limit, offset: offset }, inc);
		checkError(data);
		return data;
	} catch (error) {
		err.handleError("Failed to fetch artist featured albums", error);
	}
}

async function getAlbumByUPC(upc) {
	try {
		const data = await mbApi.search("release", { query: `barcode:${upc}`, inc: ["artist-rels"], limit: 20 });
		checkError(data);
		return data;
	} catch (error) {
		err.handleError("Failed to fetch album", error);
	}
}

async function getTrackByISRC(isrc) {
	try {
		const data = await mbApi.search("recording", { query: `isrc:${isrc}`, inc: ["artist-rels"], limit: 20 });
		checkError(data);
		return data;
	} catch (error) {
		err.handleError("Failed to fetch album", error);
	}
}

async function getCoverByMBID(mbid) {
	try {
		const coverInfo = await coverArtArchiveApiClient.getReleaseCovers(mbid);
		return coverInfo;
	} catch (error) {
		err.handleError("Failed to fetch cover", error);
	}
}

async function serachForAlbumByArtistAndTitle(mbid, title) {
	try {
		const data = await mbApi.search("release", { query: `arid:${mbid} AND release:${title}`, inc: ["artist-rels"], limit: 20 });
		checkError(data);
		return data;
	} catch (error) {
		err.handleError("Failed to search for album by artist and title", error);
	}
}

async function getAlbumByMBID(mbid, inc = ["artist-rels", "recordings", "isrcs"]) {
	try {
		const data = await mbApi.lookup("release", mbid, inc);
		checkError(data);
		return data;
	} catch (error) {
		err.handleError("Failed to fetch album by MBID", error);
	}
}

async function getArtistFeaturedReleaseCount(mbid) {
	try {
		const data = await mbApi.browse("release", { track_artist: mbid, limit: 1 });
		checkError(data);
		if (!data["release-count"]) {
			return null;
		}
		return data["release-count"];
	} catch (error) {
		err.handleError("Failed to fetch artist featured release count", error);
	}
}

async function getArtistReleaseCount(mbid) {
	try {
		const data = await mbApi.browse("release", { artist: mbid, limit: 1 });
		checkError(data);
		if (data["release-count"] == undefined || data["release-count"] == null) {
			return null;
		}
		return data["release-count"];
	} catch (error) {
		err.handleError("Failed to fetch artist release count", error);
	}
}

async function getTrackById(mbid) {
	try {
		const data = await mbApi.lookup("recording", mbid, ["artist-rels", "isrcs", "url-rels"]);
		checkError(data);
		return data;
	} catch (error) {
		err.handleError("Failed to fetch track by ID", error);
	}
}

function getTrackISRCs(track) {
	if (!track) return null;
	let isrcs = track?.isrcs || [];
	return isrcs;
}

function getAlbumUPCs(album) {
	if (!album) return null;
	let upcs = album?.barcode? [album.barcode] : [];
	return upcs;
}

function parseUrl(url) {
	const regex = /musicbrainz\.org\/([a-z\-]+)\/([0-9a-fA-F\-]{36})/;
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
	return `https://musicbrainz.org/${type}/${id}`;
}

const musicbrainz = {
	namespace,
	getIdBySpotifyId: withCache(getIdBySpotifyId, { ttl: 60 * 15, namespace: namespace }),
	getIdsBySpotifyUrls: withCache(getIdsBySpotifyUrls, { ttl: 60 * 15, namespace: namespace }),
	getArtistAlbums: withCache(getArtistAlbums, { ttl: 60 * 15, namespace: namespace }),
	getArtistFeaturedAlbums: withCache(getArtistFeaturedAlbums, { ttl: 60 * 15, namespace: namespace }),
	getAlbumByUPC: withCache(getAlbumByUPC, { ttl: 60 * 15, namespace: namespace }),
	getAlbumByMBID: withCache(getAlbumByMBID, { ttl: 60 * 15, namespace: namespace }),
	getTrackByISRC: withCache(getTrackByISRC, { ttl: 60 * 15, namespace: namespace }),
	getCoverByMBID: withCache(getCoverByMBID, { ttl: 60 * 15, namespace: namespace }),
	getAlbumsBySourceUrls: withCache(getAlbumsBySourceUrls, { ttl: 60 * 15, namespace: namespace }),
	serachForAlbumByArtistAndTitle: withCache(serachForAlbumByArtistAndTitle, { ttl: 60 * 15, namespace: namespace }),
	getArtistFeaturedReleaseCount: withCache(getArtistFeaturedReleaseCount, { ttl: 60 * 60, namespace: namespace }),
	getArtistReleaseCount: withCache(getArtistReleaseCount, { ttl: 60 * 60, namespace: namespace }),
	getTrackById: withCache(getTrackById, { ttl: 60 * 15, namespace: namespace }),
	getAlbumById: withCache(getAlbumByMBID, { ttl: 60 * 15, namespace: namespace }),
	getArtistByUrl: withCache(getArtistByUrl, { ttl: 60 * 15, namespace: namespace }),
	parseUrl,
	createUrl,
	validateMBID,
	getTrackISRCs,
	getAlbumUPCs
};

export default musicbrainz;
