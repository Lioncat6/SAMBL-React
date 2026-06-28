import type { ArtistObject, AlbumObject, TrackObject, AlbumData, PartialArtistObject, FullProvider, RawAlbumData, Capabilities, LabelObject } from "../../types/provider-types";
import logger from "../../utils/logger";
import text from "../../utils/text";
import withCache from "../../utils/cache";
import ErrorHandler from "../../utils/errorHandler";
import { DeezerAlbum, DeezerArtist, DeezerPaginationResult, DeezerPublicApi, DeezerTrack } from "deezer-public-api";
import parsers from "../parsers/parsers";
import getDeezerGenre from "./lib/deezer-genres";
const namespace = "deezer";

const err = new ErrorHandler(namespace);

const { parseUrl, createUrl } = parsers.getParser(namespace);

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

async function getTrackByISRC(isrc: string): Promise<TrackObject[] | null> {
	await refreshApi();
	try {
		const data = await deezerApi.track({id: `isrc:${isrc}`});
		if (data.title) {
			return [formatTrackObject(data)];
		} else {
			return null;
		}
	} catch (error) {
		if (error.message.includes("no data")) {
			return null;
		}
		err.handleError("Error fetching track by ISRC:", error);
		return null;

	}
}

async function getAlbumByUPC(upc: string): Promise<AlbumObject[] | null> {
	await refreshApi();
	try {
		const data = await deezerApi.album({id: `upc:${upc.replace(/^0+/, "")}`});
		if (data.title) {
			return [formatAlbumObject(data)];
		} else {
			return null;
		}
	} catch (error) {
		if (error.message.includes("no data")) {
			return null;
		}
		err.handleError("Error fetching album by UPC:", error);
		return null;
	}
}


async function searchByArtistName(query: string): Promise<DeezerPaginationResult<DeezerArtist> | null> {
	await refreshApi();
	try {
		const data = await deezerApi.search.artist({ q: encodeURIComponent(query) });
		if (data.data) {
			return data;
		} else {
			return null;
		}
	} catch (error) {
		if (error.message.includes("no data")) {
			return null;
		}
		err.handleError("Error searching for artist:", error);
		return null;
	}
}

async function getAlbumById(deezerId: string): Promise<DeezerAlbum | null> {
	await refreshApi();
	try {
		const data = await deezerApi.album({id: deezerId});
		if (data.title) {
			return data;
		} else {
			return null;
		}
	} catch (error) {
		if (error.message.includes("no data")) {
			return null;
		}
		err.handleError("Error fetching album by ID:", error);
		return null;
	}
}

async function getTrackById(deezerId: string): Promise<DeezerTrack | null> {
	await refreshApi();
	try {
		const data = await deezerApi.track({id: deezerId});
		if (data.title) {
			return data;
		} else {
			return null;
		}
	} catch (error) {
		if (error.message.includes("no data")) {
			return null;
		}
		err.handleError("Error fetching track by ID:", error);
		return null;
	}
}

async function getArtistById(deezerId: string): Promise<DeezerArtist | null> {
	await refreshApi();
	try {
		const data = await deezerApi.artist({id: deezerId});
		if (data.name) {
			return data;
		} else {
			return null;
		}
	} catch (error) {
		if (error.message.includes("no data")) {
			return null;
		}
		err.handleError("Error fetching artist by ID:", error);
		return null;
	}
}

function getTrackISRCs(track: DeezerTrack) {
	if (!track) return null;
	let isrcs = track?.isrc ? [track.isrc] : [];
	return isrcs;
}

function getAlbumUPCs(album: DeezerAlbum) {
	if (!album) return null;
	let upcs = album?.upc ? [album.upc] : [];
	return upcs;
}

function formatArtistSearchData(rawData: DeezerPaginationResult<DeezerArtist>) {
	return rawData.data;
}

function formatArtistLookupData(rawData: DeezerArtist) {
	return rawData;
}

function formatArtistObject(artist: DeezerArtist): ArtistObject {
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
		url: createUrl("artist", String(artist.id)),
		imageUrl: imageUrl || "",
		imageUrlSmall: imageUrlSmall || "",
		bannerUrl: null,
		relevance: `${artist.nb_fan} fans`,
		info: `${artist.nb_album} albums`,
		genres: null,
		followers: artist.nb_fan || null,
		popularity: null,
		id: String(artist.id),
		provider: namespace,
		type: "artist"
	};
}

function formatPartialArtistObject(artist: DeezerArtist): PartialArtistObject {
	return {
		name: artist.name,
		url: createUrl("artist", String(artist.id)),
		imageUrl: artist.picture_xl || "",
		imageUrlSmall: artist.picture_medium || "",
		id: String(artist.id),
		provider: namespace,
		type: "partialArtist"
	};
}

async function getArtistAlbums(artistId: string, offset, limit) {
	const nextIntRegex = /index=(\d+)/;
	try {
		let artistAlbumData = await await deezerApi.artist.albums({id: artistId, limit: 9999, index: 0});
		let artistData = await deezer.getArtistById(artistId);
		let searchAlbums: any[] = [];
		let searchAlbumData = await deezerApi.search.album({ q: `artist:"${encodeURIComponent(artistData.name)}"`, limit: 9999, index: 0 });
		searchAlbums.push(...searchAlbumData.data);
		while (searchAlbumData.next) {
			searchAlbumData = await searchAlbumData.next();
			if (searchAlbumData && searchAlbumData.data) {
				searchAlbums.push(...searchAlbumData.data);
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

function formatAlbumGetData(rawData: DeezerPaginationResult<DeezerAlbum>): RawAlbumData {
	const nextIntRegex = /index=(\d+)/;
	return {
		count: rawData.total || null,
		current: !(rawData.prev) ? 0 : rawData.prevIndex ? rawData.prevIndex + rawData.data.length : 0,
		next: rawData.nextIndex ? String(rawData.nextIndex) : null,
		albums: rawData.data,
	};
}

function formatAlbumObject(album: DeezerAlbum): AlbumObject {
	const fallbackGenre = getDeezerGenre(album.genre_id);
	return {
		provider: namespace,
		id: String(album.id),
		name: album.title,
		url: createUrl("album", String(album.id)),
		imageUrl: album.cover_xl || "",
		imageUrlSmall: album.cover_medium || "",
		albumArtists: album.contributors && album.contributors.length > 0 ? album.contributors.map(formatPartialArtistObject) : album.artist ? [formatPartialArtistObject(album.artist)] : [],
		artistNames: album.contributors && album.contributors.length > 0 ? album.contributors.map(artist => artist.name) : album.artist ? [album.artist.name] : [],
		releaseDate: album.release_date,
		trackCount: album.nb_tracks || null,
		albumType: album.record_type,
		upc: album.upc || null,
		albumTracks: getAlbumTracks(album),
		type: "album",
		labels: album.label ? [formatLabelObject(album.label)] : null,
		copyrights: null,
		genres: album.genres?.data ? album.genres.data.map((genre) => genre.name) : fallbackGenre ? [fallbackGenre]: null 
	};
}

function formatLabelObject(label: string): LabelObject {
	return {
		type: "label",
		provider: namespace,
		id: null,
		name: label,
		url: null,
	}
}

export type DeezerTrackWithTrackNumber = DeezerTrack & {
	trackNumber?: number;
}

function getAlbumTracks(album: DeezerAlbum) {
	let tracks = album.tracks?.data as DeezerTrackWithTrackNumber[];
	if (tracks) {
		for (let track in tracks) {
			tracks[track].trackNumber = parseInt(track) + 1;
		}
		let newTracks = tracks.map(formatTrackObject);
		tracks.sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));
		return newTracks;
	}
	return [];
}

function formatTrackObject(track: DeezerTrackWithTrackNumber): TrackObject {
	return {
		provider: namespace,
		id: String(track.id),
		name: track.title,
		url: createUrl("track", String(track.id)),
		imageUrl: track.album?.cover_xl || null,
		imageUrlSmall: track.album?.cover_medium || null,
		albumName: track.album?.title || null,
		trackArtists: track.artist ? [formatPartialArtistObject(track.artist)] : [],
		artistNames: track.artist ? [track.artist.name] : [],
		duration: track.duration * 1000,
		trackNumber: track.trackNumber || null,
		releaseDate: track.release_date || null,
		isrcs: track.isrc ? [track.isrc] : [],
		type: "track"
	};
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
	config: { capabilities },
	getTrackByISRC: withCache(getTrackByISRC, { ttl: 60 * 30, namespace: namespace }),
	getAlbumByUPC: withCache(getAlbumByUPC, { ttl: 60 * 30, namespace: namespace }),
	searchByArtistName: withCache(searchByArtistName, { ttl: 60 * 30, namespace: namespace }),
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
	parseUrl,
	createUrl
};

export default deezer;
