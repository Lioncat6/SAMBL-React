import type { ArtistObject, AlbumObject, TrackObject, AlbumData, PartialArtistObject, FullProvider, RawAlbumData } from "./provider-types";
import logger from "../../../utils/logger";
import withCache from "../../../utils/cache";
import ErrorHandler from "../../../utils/errorHandler";
import SpotifyWebApi from "spotify-web-api-node";

const namespace = "spotify";

const err = new ErrorHandler(namespace);

const spotifyApi = new SpotifyWebApi({
	clientId: process.env.SPOTIFY_CLIENT_ID,
	clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
	redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

let accessToken: string | null = null;
let tokenExpirationTime: number | null = null;

function validateSpotifyId(spotifyId) {
	const spfPattern = /[A-Za-z0-9]{22}/;
	return spfPattern.test(spotifyId);
}

function extractSpotifyIdFromUrl(url) {
	const spfPattern = /[A-Za-z0-9]{22}$/;
	const match = url.match(spfPattern);
	if (match && match[0]) {
		return match[0];
	}
}

async function withRetry(apiCall, retries = 3, delay = 1000) {
	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			return await apiCall();
		} catch (error) {
			if (attempt < retries) {
				logger.warn(`Retrying API call (attempt ${attempt} of ${retries})...`);
				await new Promise((resolve) => setTimeout(resolve, delay));
			} else {
				err.handleError("API call failed after retries:", error);
			}
		}
	}
}

export function getFullAlbumImageUrl(url: null | undefined): null;
export function getFullAlbumImageUrl(url: string): string;
export function getFullAlbumImageUrl(url: string | null | undefined): string | null
export function getFullAlbumImageUrl(url: string | null | undefined): string | null {
	if (url == null) return null;

	// from: https://i.scdn.co/image/ab67616d0000 b273 684d81c9356531f2a456b1c1
	//   to: https://i.scdn.co/image/ab67616d0000 82c1 684d81c9356531f2a456b1c1

	const urlParts = url.split("/");
	const id = urlParts[urlParts.length - 1];
	urlParts[urlParts.length - 1] = `${id.slice(0, 12)}82c1${id.slice(16)}`;
	return urlParts.join("/");
}

async function checkAccessToken() {
	const currentTime = Date.now();

	if (accessToken && tokenExpirationTime && currentTime < tokenExpirationTime) {
		// logger.debug("Using cached access token");
		// spotifyApi.setAccessToken(accessToken);
		// This doesn't need to be set again
		return;
	}

	try {
		const tokenData = await spotifyApi.clientCredentialsGrant();
		accessToken = tokenData.body["access_token"];
		const expiresIn = tokenData.body["expires_in"];
		tokenExpirationTime = currentTime + expiresIn * 1000;
		spotifyApi.setAccessToken(accessToken);
		logger.debug("Spotify access token refreshed successfully");
	} catch (error) {
		err.handleError("Error refreshing Spotify access token:", error);
	}
}

async function getArtistById(spotifyId) {
	try {
		await checkAccessToken();
		// Fetch artist data
		const data = await spotifyApi.getArtist(spotifyId);
		if (data.statusCode === 404) {
			return null;
		}
		return data.body;
	} catch (error) {
		err.handleError("Error fetching artist data:", error);
	}
}

async function searchByArtistName(artistName) {
	try {
		await checkAccessToken();
		// Fetch artist data
		const data = await spotifyApi.searchArtists(artistName);
		return data.body;
	} catch (error) {
		err.handleError("Error searching for artist:", error);

	}
}

async function getArtistAlbums(spotifyId, offset = 0, limit = 50) {
	try {
		await checkAccessToken();
		// Fetch artist albums
		const data = await spotifyApi.getArtistAlbums(spotifyId, { limit: limit, offset: offset });
		return data.body;
	} catch (error) {
		err.handleError("Error fetching artist albums:", error);

	}
}

async function getAlbumByUPC(upc) {
	try {
		await checkAccessToken();
		const data = await spotifyApi.searchAlbums(`upc:${upc}`, { limit: 20 });
		return data.body;
	} catch (error) {
		err.handleError("Error fetching album data:", error);
	}
}

async function getTrackByISRC(isrc: string) {
	try {
		await checkAccessToken();
		const data = await spotifyApi.searchTracks(`isrc:${isrc}`, { limit: 20 });
		return data.body;
	} catch (error) {
		err.handleError("Error fetching track data:", error);
	}
}

async function getAlbumById(spotifyId: string) {
	try {
		await checkAccessToken();
		const data = await spotifyApi.getAlbum(spotifyId);
		if (data.body?.tracks?.total > 50) {
			data.body.tracks = await getAlbumTracksById(spotifyId);
		}
		return data.body;
	} catch (error) {
		err.handleError("Error fetching album by Spotify ID:", error);
	}
}

async function getAlbumTracksById(spotifyId) {
	try {
		await checkAccessToken();
		let itemsArray: any = [];
		let offset = 0;
		let data: any;
		do {
			data = await spotifyApi.getAlbumTracks(spotifyId, { limit: 50, offset: offset });
			itemsArray = itemsArray.concat(data.body.items);
			offset += data.body.items.length;
		}
		while (data?.body?.next)
		return { items: itemsArray, total: data.body.total };
	} catch (error) {
		err.handleError("Error fetching album tracks by Spotify ID:", error);
	}
}

async function getTrackById(spotifyId) {
	try {
		await checkAccessToken();
		const data = await spotifyApi.getTrack(spotifyId);
		return data.body;
	} catch (error) {
		err.handleError("Error fetching track by Spotify ID:", error);
	}
}

function getTrackISRCs(track) {
	if (!track) return null;
	let isrcs = track?.external_ids?.isrc ? [track.external_ids.isrc] : [];
	return isrcs;
}

function getAlbumUPCs(album) {
	if (!album) return null;
	let upcs = album?.external_ids?.upc ? [album.external_ids.upc] : [];
	return upcs;
}

function formatArtistSearchData(rawData) {
	return rawData.artists.items;
}

function formatArtistLookupData(rawData) {
	return rawData;
}

function formatArtistObject(rawObject): ArtistObject {
	const followers = rawObject.followers?.total ?? null;
	const genres = rawObject.genres ?? [];
	return {
		name: rawObject.name,
		url: getArtistUrl(rawObject),
		imageUrl: rawObject.images?.[0]?.url || "",
		imageUrlSmall: rawObject.images?.[1]?.url || rawObject.images?.[0]?.url || "",
		bannerUrl: null,
		relevance: followers != null ? `${followers} Followers` : "",
		info: genres.join(", "),
		genres: genres,
		followers: followers,
		popularity: rawObject.popularity ?? null,
		id: rawObject.id,
		provider: namespace,
	};
}

function getArtistUrl(artist) {
	return artist.external_urls?.spotify || `https://open.spotify.com/artist/${artist.id}`;
}

function parseUrl(url) {
	const regex = /(?:www\.)?open\.spotify\.com\/(artist|track|album)\/([A-Za-z0-9]{22})/;
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
	return `https://open.spotify.com/${type}/${id}`;
}

function formatAlbumGetData(rawData): RawAlbumData {
	const nextIntRegex = /offset=(\d+)/;
	return {
		count: rawData.total,
		current: rawData.offset,
		next: rawData.next ? rawData.next?.match(nextIntRegex)[1] : null,
		albums: rawData.items,
	};
}

function formatPartialArtistObject(artist): PartialArtistObject {
	return {
		name: artist.name,
		url: getArtistUrl(artist),
		imageUrl: "",
		imageUrlSmall: "",
		id: artist.id,
		provider: namespace,
	};
}

function formatAlbumObject(album): AlbumObject {
	return {
		provider: namespace,
		id: album.id,
		name: album.name,
		url: album.external_urls.spotify,
		imageUrl: getFullAlbumImageUrl(album.images[0]?.url),
		imageUrlSmall: album.images[1]?.url || album.images[0]?.url || "",
		albumArtists: album.artists.map(formatPartialArtistObject),
		artistNames: album.artists.map((artist) => artist.name),
		releaseDate: album.release_date,
		trackCount: album.total_tracks,
		albumType: album.album_type,
		upc: album.external_ids?.upc || null,
		albumTracks: getAlbumTracks(album),
	};
}

function getAlbumTracks(album): TrackObject[] {
	let tracks = album.tracks?.items
	if (tracks) {
		tracks.forEach((track) => {
			track.imageUrl = getFullAlbumImageUrl(album.images[0]?.url);
			track.imageUrlSmall = album.images[1]?.url || album.images[0]?.url || "";
			track.albumName = album.name;
		});
		tracks = tracks.map(formatTrackObject);
		return tracks;
	}
	return []
}

function formatTrackObject(track): TrackObject {
	return {
		provider: namespace,
		id: track.id,
		name: track.name,
		url: track.external_urls.spotify,
		imageUrl: getFullAlbumImageUrl(track.imageUrl),
		imageUrlSmall: track.imageUrlSmall || "",
		albumName: track.albumName,
		trackArtists: track.artists.map(formatPartialArtistObject),
		artistNames: track.artists.map((artist) => artist.name),
		duration: track.duration_ms,
		trackNumber: track.track_number,
		releaseDate: track.release_date || null,
		isrcs: track.external_ids?.isrc ? [track.external_ids.isrc] : [],
	};
}

const spotify: FullProvider = {
	namespace,
	getArtistById: withCache(getArtistById, { ttl: 60 * 30, namespace: namespace }),
	searchByArtistName: withCache(searchByArtistName, { ttl: 60 * 30, namespace: namespace }),
	getArtistAlbums: withCache(getArtistAlbums, { ttl: 60 * 30, namespace: namespace }),
	getAlbumByUPC: withCache(getAlbumByUPC, { ttl: 60 * 30, namespace: namespace }),
	getTrackByISRC: withCache(getTrackByISRC, { ttl: 60 * 30, namespace: namespace }),
	getAlbumById: withCache(getAlbumById, { ttl: 60 * 30, namespace: namespace }),
	getTrackById: withCache(getTrackById, { ttl: 60 * 30, namespace: namespace }),
	formatArtistSearchData,
	formatPartialArtistObject,
	formatArtistLookupData,
	formatTrackObject,
	formatArtistObject,
	formatAlbumGetData,
	formatAlbumObject,
	getArtistUrl,
	getTrackISRCs,
	getAlbumUPCs,
	parseUrl,
	createUrl
};

export default spotify;
