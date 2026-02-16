import { ArtistObject, AlbumObject, TrackObject, AlbumData, PartialArtistObject, FullProvider, RawAlbumData, Capabilities } from "../../../types/provider-types";
import logger from "../../../utils/logger";
import withCache from "../../../utils/cache";
import ErrorHandler from "../../../utils/errorHandler";
import SpotifyWebApi from "spotify-web-api-node";
import parsers from "../../../lib/parsers/parsers";

const namespace = "spotify";

const {parseUrl, createUrl} = parsers.getParser(namespace);

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

async function getArtistById(spotifyId: string) {
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

async function searchByArtistName(artistName: string) {
	try {
		await checkAccessToken();
		// Fetch artist data
		const data = await spotifyApi.searchArtists(artistName);
		return data.body;
	} catch (error) {
		err.handleError("Error searching for artist:", error);

	}
}

async function getArtistAlbums(spotifyId: string, offset = 0, limit = 50) {
	try {
		await checkAccessToken();
		// Fetch artist albums
		const data = await spotifyApi.getArtistAlbums(spotifyId, { limit: limit, offset: offset });
		return data.body;
	} catch (error) {
		err.handleError("Error fetching artist albums:", error);

	}
}

async function getAlbumByUPC(upc: string): Promise<AlbumObject[] | null> {
	try {
		await checkAccessToken();
		const data = await spotifyApi.searchAlbums(`upc:${upc}`, { limit: 20 });
		return data.body.albums?.items.map(formatAlbumObject) || [];
	} catch (error) {
		err.handleError("Error fetching album data:", error);
		return null;
	}
}

async function getTrackByISRC(isrc: string): Promise<TrackObject[] | null> {
	try {
		await checkAccessToken();
		const data = await spotifyApi.searchTracks(`isrc:${isrc}`, { limit: 20 });
		return data.body.tracks?.items.map(formatTrackObject) || [];
	} catch (error) {
		err.handleError("Error fetching track data:", error);
		return null;
	}
}

async function getAlbumById(spotifyId: string) {
	try {
		await checkAccessToken();
		const data = await spotifyApi.getAlbum(spotifyId);
		if (data.body?.tracks?.total > 50) {
			let tracks = await getAlbumTracksById(spotifyId);
			if (tracks) data.body.tracks = tracks.items;
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

export interface ExtendedTrack extends SpotifyApi.TrackObjectSimplified, Partial<Omit<SpotifyApi.TrackObjectFull, keyof SpotifyApi.TrackObjectSimplified>> {}

function getTrackISRCs(track: SpotifyApi.TrackObjectSimplified | SpotifyApi.TrackObjectFull) {
	if (!track) return null;
	const extendedTrack = track as ExtendedTrack
	let isrcs = extendedTrack?.external_ids?.isrc ? [extendedTrack.external_ids.isrc] : [];
	return isrcs;
}

export interface ExtendedAlbum extends SpotifyApi.AlbumObjectSimplified, Partial<Omit<SpotifyApi.AlbumObjectFull, keyof SpotifyApi.AlbumObjectSimplified	>> {}

function getAlbumUPCs(album: SpotifyApi.AlbumObjectFull | SpotifyApi.AlbumObjectSimplified) {
	if (!album) return null;
	const extendedAlbum = album as ExtendedAlbum;
	let upcs = extendedAlbum?.external_ids?.upc ? [extendedAlbum.external_ids.upc] : [];
	return upcs;
}

function formatArtistSearchData(rawData: SpotifyApi.SearchResponse) {
	return rawData.artists?.items || [];
}

function formatArtistLookupData(rawData: SpotifyApi.SingleAlbumResponse) {
	return rawData;
}

export interface extendedArtist extends SpotifyApi.ArtistObjectSimplified, Partial<Omit<SpotifyApi.ArtistObjectFull, keyof SpotifyApi.ArtistObjectSimplified>> {}

function formatArtistObject(rawObject: SpotifyApi.ArtistObjectSimplified | SpotifyApi.ArtistObjectFull): ArtistObject {
	const extendedArtist = rawObject as extendedArtist;
	return {
		name: extendedArtist.name,
		url: getArtistUrl(extendedArtist),
		imageUrl: extendedArtist.images?.[0]?.url || "",
		imageUrlSmall: extendedArtist.images?.[1]?.url || extendedArtist.images?.[0]?.url || "",
		bannerUrl: null,
		relevance: extendedArtist.followers ? `${extendedArtist.followers.total} Followers`: "",
		info: extendedArtist.genres?.join(", ") || "", // Convert genres array to a string
		genres: extendedArtist.genres || null,
		followers: extendedArtist.followers?.total || null,
		popularity: extendedArtist.popularity || null,
		id: rawObject.id,
		provider: namespace,
	};
}

function getArtistUrl(artist: SpotifyApi.ArtistObjectSimplified) {
	return artist.external_urls.spotify || `https://open.spotify.com/artist/${artist.id}`;
}

function formatAlbumGetData(rawData: SpotifyApi.ArtistsAlbumsResponse): RawAlbumData {
	const nextIntRegex = /offset=(\d+)/;
	return {
		count: rawData.total,
		current: rawData.offset,
		next: rawData.next ? rawData.next.match(nextIntRegex)?.[1] || null : null,
		albums: rawData.items,
	};
}

function formatPartialArtistObject(artist: SpotifyApi.ArtistObjectSimplified): PartialArtistObject {
	return {
		name: artist.name,
		url: getArtistUrl(artist),
		imageUrl: "",
		imageUrlSmall: "",
		id: artist.id,
		provider: namespace,
	};
}

function formatAlbumObject(album: SpotifyApi.SingleAlbumResponse): AlbumObject {
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


export interface ExtendedTrack extends SpotifyApi.TrackObjectSimplified, Partial<Omit<SpotifyApi.TrackObjectFull, keyof SpotifyApi.TrackObjectSimplified>> {}
export interface trackWithAlbumData extends ExtendedTrack {
		imageUrl?: string
		imageUrlSmall?: string
		albumName?: string
		release_date?: string
	}

function getAlbumTracks(album: SpotifyApi.SingleAlbumResponse): TrackObject[] {
	let tracks: trackWithAlbumData[] = album.tracks?.items
	if (tracks) {
		tracks.forEach((track) => {
			track.imageUrl = getFullAlbumImageUrl(album.images[0]?.url);
			track.imageUrlSmall = album.images[1]?.url || album.images[0]?.url || "";
			track.albumName = album.name;
			track.release_date = album.release_date
		});
		const formattedTracks = tracks.map(formatTrackObject);
		return formattedTracks;
	}
	return []
}

function formatTrackObject(track: trackWithAlbumData | SpotifyApi.TrackObjectSimplified | SpotifyApi.TrackObjectFull): TrackObject {
	let extendedTrack = track as trackWithAlbumData	
	const album = extendedTrack.album
	const imageUrl = extendedTrack.imageUrl || album?.images?.[0]?.url || null
	const imageUrlSmall = extendedTrack.imageUrlSmall || album?.images?.[1]?.url || imageUrl
	return {
		provider: namespace,
		id: extendedTrack.id,
		name: extendedTrack.name,
		url: extendedTrack.external_urls.spotify,
		imageUrl: imageUrl ? getFullAlbumImageUrl(imageUrl): null ,
		imageUrlSmall: imageUrlSmall || null,
		albumName: extendedTrack.albumName || album?.name || null,
		trackArtists: extendedTrack.artists.map(formatPartialArtistObject),
		artistNames: extendedTrack.artists.map((artist) => artist.name),
		duration: extendedTrack.duration_ms,
		trackNumber: extendedTrack.track_number,
		releaseDate: extendedTrack.release_date || album?.release_date || null,
		isrcs: extendedTrack.external_ids?.isrc ? [extendedTrack.external_ids.isrc] : [],
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

const spotify: FullProvider = {
	namespace,
	config: {default: true, capabilities},
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
	getTrackISRCs,
	getAlbumUPCs,
	parseUrl,
	createUrl
};

export default spotify;
