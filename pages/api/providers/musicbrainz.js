import { MusicBrainzApi, CoverArtArchiveApi } from "musicbrainz-api";
import logger from "../../../utils/logger";
import withCache from "../../../utils/cache";

const namespace = "musicbrainz";

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
		logger.error("Failed to fetch artist data", error);
		throw new Error("Failed to fetch artist data");
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
			mbids[url.resource] = url.relations[0].artist.id;
		}
		return mbids;
	} catch (error) {
		logger.error("Failed to get ids", error);
		throw new Error(error.message);
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
		logger.error("Failed to fetch albums by Source URLs", error);
		throw new Error(error.message);
	}
}

async function getArtistAlbums(mbid, offset = 0, limit = 100, inc = ["url-rels", "recordings", "isrcs"]) {
	try {
		// const data = await mbApi.browse('release', {artist: mbid, limit: limit, offset: offset});
		const data = await mbApi.browse("release", { artist: mbid, limit: limit, offset: offset }, inc);
		checkError(data);
		return data;
	} catch (error) {
		logger.error("Failed to fetch artist albums", error);
		throw new Error(error.message);
	}
}

async function getArtistFeaturedAlbums(mbid, offset = 0, limit = 100, inc = ["url-rels", "recordings", "isrcs"]) {
	try {
		// const data = await mbApi.browse('release', {track_artist: mbid, limit: limit, offset: offset});
		const data = await mbApi.browse("release", { track_artist: mbid, limit: limit, offset: offset }, inc);
		checkError(data);
		return data;
	} catch (error) {
		logger.error("Failed to fetch artist featured albums", error);
		throw new Error(error.message);
	}
}

async function getAlbumByUPC(upc) {
	try {
		const data = await mbApi.search("release", { query: `barcode:${upc}`, inc: ["artist-rels"],  limit: 20 });
		checkError(data);
		return data;
	} catch (error) {
		logger.error("Failed to fetch album", error);
		throw new Error(error.message);
	}
}

async function getTrackByISRC(isrc) {
	try {
		const data = await mbApi.search("recording", { query: `isrc:${isrc}`, inc: ["artist-rels"],  limit: 20 });
		checkError(data);
		return data;
	} catch (error) {
		logger.error("Failed to fetch album", error);
		throw new Error(error.message);
	}
}

async function getCoverByMBID(mbid) {
	try {
		const coverInfo = await coverArtArchiveApiClient.getReleaseCovers(mbid);
		return coverInfo;
	} catch (error) {
		logger.error("Failed to fetch cover", error);
		throw new Error(error.message);
	}
}

async function serachForAlbumByArtistAndTitle(mbid, title) {
	try {
		const data = await mbApi.search("release", { query: `arid:${mbid} AND release:${title}`, inc: ["artist-rels"],  limit: 20 });
		checkError(data);
		return data;
	} catch (error) {
		logger.error("Failed to search for album by artist and title", error);
		throw new Error(error.message);
	}
}

async function getAlbumByMBID(mbid, inc = ["artist-rels", "recordings", "isrcs"]) {
	try {
		const data = await mbApi.lookup("release", mbid, inc);
		checkError(data);
		return data;
	} catch (error) {
		logger.error("Failed to fetch album by MBID", error);
		throw new Error(error.message);
	}
}

const musicbrainz = {
	getIdBySpotifyId: withCache(getIdBySpotifyId, { ttl: 60 * 5,  namespace: namespace }),
	getIdsBySpotifyUrls: withCache(getIdsBySpotifyUrls, { ttl: 60 * 5,  namespace: namespace }),
	getArtistAlbums: withCache(getArtistAlbums, { ttl: 60 * 5,  namespace: namespace }),
	getArtistFeaturedAlbums: withCache(getArtistFeaturedAlbums, { ttl: 60 * 5,  namespace: namespace }),
	getAlbumByUPC: withCache(getAlbumByUPC, { ttl: 60 * 5,  namespace: namespace }),
	getAlbumByMBID: withCache(getAlbumByMBID, { ttl: 60 * 5,  namespace: namespace }),
	getTrackByISRC: withCache(getTrackByISRC, { ttl: 60 * 5,  namespace: namespace }),
	getCoverByMBID: withCache(getCoverByMBID, { ttl: 60 * 5,  namespace: namespace }),
	validateMBID,
	getAlbumsBySourceUrls: withCache(getAlbumsBySourceUrls, { ttl: 60 * 5,  namespace: namespace }),
	serachForAlbumByArtistAndTitle: withCache(serachForAlbumByArtistAndTitle, { ttl: 60 * 5,  namespace: namespace }),
};

export default musicbrainz;
