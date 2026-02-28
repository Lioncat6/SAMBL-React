import type { ArtistObject, AlbumObject, TrackObject, AlbumData, PartialArtistObject, FullProvider, RawAlbumData, Capabilities } from "../../types/provider-types";
import logger from "../../utils/logger";
import text from "../../utils/text";
import withCache from "../../utils/cache";
import ErrorHandler from "../../utils/errorHandler";
import DeezerPublicApi from "deezer-public-api";
import parsers from "../parsers/parsers";

const namespace = "deezer";

const err = new ErrorHandler(namespace);

const {parseUrl, createUrl}  = parsers.getParser(namespace); 

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

async function getTrackByISRC(isrc: number): Promise<TrackObject[] | null> {
	await refreshApi();
	try {
		const data = await deezerApi.track(`isrc:${isrc}`);
		if (data.title) {
			return [formatTrackObject(data)];
		} else {
			return null;
		}
	} catch (error) {
		err.handleError("Error fetching track by ISRC:", error);
		return null;
		
	}
}

async function getAlbumByUPC(upc: string): Promise<AlbumObject[] | null> {
	await refreshApi();
	try {
		const data = await deezerApi.album(`upc:${upc.replace(/^0+/, "")}`);
		if (data.title) {
			return [formatAlbumObject(data)];
		} else {
			return null;
		}
	} catch (error) {
		err.handleError("Error fetching album by UPC:", error);
		return null;
		
	}
}


async function searchByArtistName(query) {
	await refreshApi();
	try {
		const data = await deezerApi.search.artist(query);
		if (data.data) {
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

function formatArtistObject(artist): ArtistObject {
	let imageUrl = artist.picture_xl;
	let imageUrlSmall = artist.picture_medium;
	if (imageUrl.includes("/artist//")) {
		imageUrl = artist.picture;
	}
	if (imageUrlSmall.includes("/artist//")) {
		imageUrlSmall = artist.picture;
	}
	return {
		name: artist.name,
		url: getArtistUrl(artist),
		imageUrl: imageUrl || "",
		imageUrlSmall: imageUrlSmall || "",
		bannerUrl: null,
		relevance: `${artist.nb_fan} fans`,
		info: `${artist.nb_album} albums`,
		genres: null,
		followers: artist.nb_fan,
		popularity: null,
		id: artist.id,
		provider: namespace,
		type: "artist"
	};
}

function formatPartialArtistObject(artist): PartialArtistObject {
	return {
		name: artist.name,
		url: artist.link,
		imageUrl: artist.picture_xl || "",
		imageUrlSmall: artist.picture_medium || "",
		id: artist.id,
		provider: namespace, 
		type: "partialArtist"
	};
}

async function getArtistAlbums(artistId, offset, limit) {
	const nextIntRegex = /index=(\d+)/;
	try {
		let artistAlbumData = await await deezerApi.artist.albums(artistId, 9999, 0);
		let artistData = await deezer.getArtistById(artistId);
		let next: any = 0;
		let searchAlbums: any[] = [];
		while (next != null) {
			let searchAlbumData = await deezerApi.search.album(`artist:"${artistData.name}"`, null, 9999, next);
			if (searchAlbumData && searchAlbumData.data) {
				searchAlbums.push(...searchAlbumData.data);
				next = searchAlbumData.next ? searchAlbumData.next.match(nextIntRegex)[1] : null;
			} else {
				next = null;
			}
		}
		let searchAlbumMap = Object.fromEntries(searchAlbums.map(album => [album.id, album]));

		artistAlbumData.data.forEach(album => {
			let searchAlbum = searchAlbumMap[album.id];
			if (!searchAlbum) {
				album.artist = artistData;
			}
			if (searchAlbum) {
				album.artist = searchAlbum.artist;
				album.nb_tracks = searchAlbum.nb_tracks;
			}
		});
		return artistAlbumData;
	} catch (error) {
		err.handleError("Error fetching artist albums:", error);
	}
}

function formatAlbumGetData(rawData): RawAlbumData {
	const nextIntRegex = /index=(\d+)/;
	return {
		count: rawData.total,
		current: !(rawData.prev) ? 0 : rawData.prev.match(nextIntRegex) ? parseInt(rawData.prev.match(nextIntRegex)[1]) + rawData.data.length : 0,
		next: rawData.next ? rawData.next.match(nextIntRegex)[1] : null,
		albums: rawData.data,
	};
}

function formatAlbumObject(album): AlbumObject {
	return {
		provider: namespace,
		id: album.id,
		name: album.title,
		url: album.link,
		imageUrl: album.cover_xl || "",
		imageUrlSmall: album.cover_medium || "",
		albumArtists: album.contributors && album.contributors.length > 0 ? album.contributors.map(formatPartialArtistObject) : album.artist ? [formatPartialArtistObject(album.artist)] : [],
		artistNames: album.contributors && album.contributors.length > 0 ? album.contributors.map(artist => artist.name).join(", ") : album.artist ? album.artist.name : "",
		releaseDate: album.release_date,
		trackCount: album.nb_tracks,
		albumType: album.record_type,
		upc: album.upc || null,
		albumTracks: getAlbumTracks(album),
		type: "album"
	};
}

function getAlbumTracks(album) {
	let tracks = album.tracks?.data;
	if (tracks){
		for (let track in tracks) {
			tracks[track].trackNumber = parseInt(track) + 1;
		}
		tracks = tracks.map(formatTrackObject);
		tracks.sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));
		return tracks;
	}
	return [];
}

function formatTrackObject(track): TrackObject {
	return {
		provider: namespace,
		id: track.id,
		name: track.title,
		url: track.link,
		imageUrl: track.album.cover_xl || "",
		imageUrlSmall: track.album.cover_medium || "",
		albumName: track.album.title,
		trackArtists: track.artist? [formatPartialArtistObject(track.artist)]: [],
		artistNames: track.artist ? [track.artist.name] : [],
		duration: track.duration*1000,
		trackNumber: track.trackNumber,
		releaseDate: track.release_date || null,
		isrcs: track.isrc ? [track.isrc] : [],
		type: "track"
	};
}

function getArtistUrl(artist) {
	return artist.link || `https://www.deezer.com/artist/${artist.id}`;
}

const capabilities: Capabilities = {
  isrcs: {
	availability: "always",
	presence: "onTrackRefresh"
  },
  upcs: {
	availability: "always",
	presence: "onAlbumRefresh"
  }
}

const deezer: FullProvider = {
	namespace,
	config: {capabilities},
	getTrackByISRC: withCache(getTrackByISRC, { ttl: 60 * 30, namespace: namespace }),
	getAlbumByUPC: withCache(getAlbumByUPC, { ttl: 60 * 30, namespace: namespace }),
    searchByArtistName: withCache(searchByArtistName, { ttl: 60 * 30,  namespace: namespace }),
	getAlbumById: withCache(getAlbumById, { ttl: 60 * 30, namespace: namespace }),
	getTrackById: withCache(getTrackById, { ttl: 60 * 30, namespace: namespace }),
	getArtistById: withCache(getArtistById, { ttl: 60 * 30, namespace: namespace }),
	getArtistAlbums: withCache(getArtistAlbums, { ttl: 60 * 30, namespace: namespace }),
	formatArtistSearchData,
	formatArtistLookupData,
    formatArtistObject,
	formatPartialArtistObject,
	formatAlbumGetData,
	formatAlbumObject,
	formatTrackObject,
	getTrackISRCs,
	getAlbumUPCs,
	parseUrl,
	createUrl
};

export default deezer;
