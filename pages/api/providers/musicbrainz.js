import { MusicBrainzApi, CoverArtArchiveApi } from "musicbrainz-api";
import config from "../../../config";
import logger from "../../../utils/logger";

const { appName, appVersion, appContactInfo } = config();

const coverArtArchiveApiClient = new CoverArtArchiveApi();
const mbApi = new MusicBrainzApi({
	appName: appName,
	appVersion: appVersion,
	appContactInfo: appContactInfo,
});

async function getIdBySpotifyId(spotifyId) {
	try {
		const data = await mbApi.lookupUrl(`https://open.spotify.com/artist/${spotifyId}`, ["artist-rels"]);
		if (!data.relations || data.relations?.length == 0) {
			return null; // No artist found
		}
		return data.relations[0].artist.id;
	} catch (error) {
		console.error(error);
		throw new Error("Failed to fetch artist data");
	}
}

async function getIdsBySpotifyUrls(spotifyUrls) {
	try {
		const data = await mbApi.lookupUrl(spotifyUrls, ["artist-rels"]);
		// console.log(data)
		if (data.count === 0) {
			return null; // No artist found
		}
		let mbids = {};
		for (let url of data.urls) {
			mbids[url.resource] = url.relations[0].artist.id;
		}
		return mbids;
	} catch (error) {
		console.error(error);
		throw new Error("Failed to fetch artist data");
	}
}

async function getArtistAlbums(mbid, offset = 0, limit = 100) {
	try {
		// const data = await mbApi.browse('release', {artist: mbid, limit: limit, offset: offset});
		const data = await mbApi.browse("release", { artist: mbid, limit: limit, offset: offset }, ["url-rels", "recordings", "isrcs"]);
		// console.log(data)
		return data;
	} catch (error) {
		console.error(error);
		throw new Error("Failed to fetch artist albums");
	}
}

async function getArtistFeaturedAlbums(mbid, offset = 0, limit = 100) {
	try {
		// const data = await mbApi.browse('release', {track_artist: mbid, limit: limit, offset: offset});
		const data = await mbApi.browse("release", { track_artist: mbid, limit: limit, offset: offset }, ["url-rels", "recordings", "isrcs"]);

		return data;
	} catch (error) {
		console.error(error);
		throw new Error("Failed to fetch artist albums");
	}
}

async function getAlbumByUPC(upc) {
	try {
		const data = await mbApi.search("release", { query: `barcode:${upc}`, inc: ["artist-rels"] }, { limit: 20 });
		return data;
	} catch (error) {
		console.error(error);
		throw new Error("Failed to fetch album data");
	}
}

async function getTrackByISRC(isrc) {
	try {
		const data = await mbApi.search("recording", { query: `isrc:${isrc}`, inc: ["artist-rels"] }, { limit: 20 });
		return data;
	} catch (error) {
		console.error(error);
		throw new Error("Failed to fetch album data");
	}
}

async function getCoverByMBID(mbid) {
	try {
		const coverInfo = await coverArtArchiveApiClient.getReleaseCovers(mbid);
		return coverInfo;
	} catch (error) {
		console.error(error);
		throw new Error("Failed to fetch cover art data");
	}
}

const musicbrainz = {
	getIdBySpotifyId: getIdBySpotifyId,
	getIdsBySpotifyUrls: getIdsBySpotifyUrls,
	getArtistAlbums,
	getArtistFeaturedAlbums,
	getAlbumByUPC,
	getTrackByISRC,
	getCoverByMBID
};

export default musicbrainz;
