import type { ArtistObject, AlbumObject, TrackObject, AlbumData } from "./provider-types";
import logger from "../../../utils/logger";
import withCache from "../../../utils/cache";
import ErrorHandler from "../../../utils/errorHandler";
import text from "../../../utils/text";
import bcApi from "bandcamp-scraper";

const namespace = "bandcamp";

const err = new ErrorHandler(namespace);

function searchAsync(params) {
	return new Promise((resolve, reject) => {
		try {
			bcApi.search(params, (error, searchResults) => {
				if (error) reject(error);
				else resolve(searchResults);
			});
		} catch (err) {
			reject(err);
		}
	});
}

function getArtistByIdAsync(id) {
	return new Promise((resolve, reject) => {
		try {
			bcApi.getArtistInfo(`https://${id}.bandcamp.com`, (error, artistData) => {
				if (error) reject(error);
				else resolve(artistData);
			});
		} catch (err) {
			reject(err);
		}
	});
}

async function getAlbumUrlsAsync(artistUrl) {
	return new Promise((resolve, reject) => {
		try {
			bcApi.getAlbumUrls(artistUrl, (error, albumData) => {
				if (error) reject(error);
				else resolve(albumData);
			});
		} catch (err) {
			reject(err);
		}
	});
}

async function getAlbumInfoAsync(albumUrl) {
	return new Promise((resolve, reject) => {
		try {
			bcApi.getAlbumInfo(albumUrl, (error, albumData) => {
				if (error) reject(error);
				else resolve(albumData);
			});
		} catch (err) {
			reject(err);
		}
	});
}

async function getTrackInfoAsync(trackUrl) {
	return new Promise((resolve, reject) => {
		try {
			bcApi.getTrackInfo(trackUrl, (error, trackData) => {
				if (error) reject(error);
				else resolve(trackData);
			});
		} catch (err) {
			reject(err);
		}
	});
}

async function init() {
	try {
		await searchAsync({ query: "test", page: 1 });
	} catch (error) {
		err.handleError("Error initializing Bandcamp API:", error);
	}
}

async function getAlbumById(url: string) {
	try {
		let albumData: any = null;
		if (url.includes("/album/")) {
			albumData = await getAlbumInfoAsync(url as string);
		} else if (url.includes("/track/")) {
			albumData = await getTrackInfoAsync(url as string);
		}
		return albumData;
	} catch (error) {
		err.handleError("Error fetching album by ID:", error);
	}
}

function getAlbumUPCs(album) {
	if (album && album.raw) {
		return album.raw.current.upc || -1;
	}
	return null;
}

async function getTrackById(url) {
	try {
		let trackData = await getTrackInfoAsync(url);
		return trackData;
	} catch (error) {
		err.handleError("Error fetching track by ID:", error);
	}
}

function getTrackISRCs(track) {
	if (track && track.raw) {
		return track.raw.current.isrc || -1;
	}
	return null;
}

async function searchByArtistName(artistName) {
	try {
		const data = await searchAsync({ query: artistName, page: 1 });
		if (data) {
			return data;
		}
		return null;
	} catch (error) {
		err.handleError("Error searching for artist:", error);
	}
}

function formatArtistSearchData(rawData) {
	const data = rawData?.filter((a) => a.type == "artist");
	return data;
}

async function getArtistById(artistId) {
	try {
		const data = await bandcamp.searchByArtistName(artistId);
		if (data) {
			let artistData = data.find((a) => a.url == `https://${artistId}.bandcamp.com`) || null;
			let idData = await getArtistByIdAsync(artistId);
			artistData.raw = (idData as any).raw;
			return artistData;
		}
		return null;
	} catch (error) {
		err.handleError("Error fetching artist by ID:", error);
	}
}

function formatArtistLookupData(rawData) {
	return rawData;
}

function formatArtistObject(rawData): ArtistObject {
	return {
		name: rawData.name,
		url: rawData.url,
		imageUrl: rawData.imageUrl?.replace(/_\d+\.jpg$/, "_0.jpg"),
		imageUrlSmall: rawData.imageUrl?.replace(/_\d+\.jpg$/, "_3.jpg"),
		bannerUrl: rawData.raw?.design?.bg_image_id ? `https://f4.bcbits.com/img/${rawData.raw.design.bg_image_id}_0.jpg` : rawData.raw?.header_desktop ? `https://f4.bcbits.com/img/${rawData.raw.header_desktop.image_id}_0.jpg` : "",
		relevance: rawData.location,
		info: rawData.tags.join(", "),
		genres: rawData.tags,
		followers: null,
		popularity: null,
		id: getArtistId(rawData),
		provider: namespace,
	};
}

async function getArtistAlbums(artistId: string, offset: number = 1, limit: number) {
	try {
		let searchResults: any = await searchAsync({ query: artistId, page: Number(offset) });
		let albumItems = searchResults.filter((a) => (a.type == "album" || (a.type == "track" && a.artist == "")) && a.url.includes(`https://${artistId}.bandcamp.com/`)); // Yes, this filters out tracks that have an album because of a coding error in the bandcamp library :3
		return { current: offset, next: searchResults.length === 0 ? null : Number(offset) + 1, albums: albumItems };
	} catch (error) {
		err.handleError("Error fetching artist albums:", error);
	}
}

function formatAlbumGetData(rawData): AlbumData {
	return {
		count: null,
		current: rawData.current,
		next: rawData.next,
		albums: rawData.albums,
	};
}

function formatAlbumObject(album): AlbumObject {
	const artistId = album.url.match(/^https?:\/\/([^.]+)\.bandcamp\.com/)[1];
	const albumIdMatch = album.url.match(/\/(album|track)\/([^/]+)/);
	const albumId = albumIdMatch ? albumIdMatch[2] : null;
	let albumType = "album";
	if (!album.artist) {
		album.artist = artistId;
		albumType = "single";
	}
	let imageUrl = album.imageUrl?.replace(/_\d+\.jpg$/, "_0.jpg") || `https://f4.bcbits.com/img/a${album.raw.art_id}_0.jpg`;
	let imageUrlSmall = album.imageUrl?.replace(/_\d+\.jpg$/, "_3.jpg") || `https://f4.bcbits.com/img/a${album.raw.art_id}_3.jpg`;
	return {
		provider: namespace,
		id: albumId,
		name: album.name || album.title,
		url: album.url,
		imageUrl: imageUrl,
		imageUrlSmall: imageUrlSmall,
		albumArtists: [
			{
				url: `https://${artistId}.bandcamp.com`,
				name: album.artist,
				imageUrl: null,
				imageUrlSmall: null,
				id: artistId,
				provider: namespace,
			},
		],
		artistNames: [album.artist],
		releaseDate: text.formatDate(album.releaseDate || album.raw?.current?.release_date),
		trackCount: album.numTracks || album.tracks?.length,
		albumType: albumType,
		upc: album.raw?.current?.upc || null,
		albumTracks: getAlbumTracks(album) || []
	};
}

function getAlbumTracks(album): TrackObject[] {
	const trackUrlRegex = /(https?:\/\/[^/]+\/(track|album)\/[^#]+)/;
	const trackIdRegex = /\/(track|album)\/([^/]+)/;
	let tracks: TrackObject[] = [];
	if (album && album.tracks) {
		album.tracks = album.tracks.filter(track => (track.url && track.duration));
		for (let trackNumber in album.tracks) {
			let trackinfo = album.raw.trackinfo[trackNumber];
			let currentTrack = album.tracks[trackNumber];
			trackinfo.url = trackUrlRegex.exec(currentTrack.url)?.[1] || null;
			trackinfo.id = trackinfo.url?.match(trackIdRegex) ? trackinfo.url.match(trackIdRegex)[2] : null;
			if (!trackinfo.artist) {
				trackinfo.artist = album.artist;
			}
			trackinfo.albumName = album.name || album.title;
			trackinfo.releaseDate = text.formatDate(album.releaseDate || album.raw?.current?.release_date);
			trackinfo.imageUrl = album.imageUrl?.replace(/_\d+\.jpg$/, "_0.jpg") || (album.raw.art_id ? `https://f4.bcbits.com/img/a${album.raw.art_id}_0.jpg` : null);
			trackinfo.imageUrlSmall = album.imageUrl?.replace(/_\d+\.jpg$/, "_3.jpg") || (album.raw.art_id ? `https://f4.bcbits.com/img/a${album.raw.art_id}_3.jpg` : null);
			tracks.push(formatTrackObject(trackinfo));
		}
	} else if (album && album.raw?.current?.type == "track") {
		let trackinfo = album.raw.trackinfo[0];
		trackinfo.url = trackUrlRegex.exec(album.url)?.[1] || null;
		trackinfo.id = trackinfo.url?.match(trackIdRegex) ? trackinfo.url.match(trackIdRegex)[2] : null;
		trackinfo.albumName = album.name || album.title;
		trackinfo.releaseDate = text.formatDate(album.releaseDate || album.raw?.current?.release_date);
		trackinfo.imageUrl = album.imageUrl?.replace(/_\d+\.jpg$/, "_0.jpg") || (album.raw.art_id ? `https://f4.bcbits.com/img/a${album.raw.art_id}_0.jpg` : null);
		trackinfo.imageUrlSmall = album.imageUrl?.replace(/_\d+\.jpg$/, "_3.jpg") || (album.raw.art_id ? `https://f4.bcbits.com/img/a${album.raw.art_id}_3.jpg` : null);
		trackinfo.isrc = album.raw.current.isrc;
		tracks.push(formatTrackObject(trackinfo));
	}
	tracks.sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));
	return tracks;
}

function formatTrackObject(track): TrackObject {
	const artistId = track.url.match(/^https?:\/\/([^.]+)\.bandcamp\.com/)[1];
	return {
		provider: namespace,
		id: track.id || null,
		name: track.title,
		url: track.url || null,
		imageUrl: track.imageUrl || null,
		imageUrlSmall: track.imageUrlSmall || null,
		trackArtists: [{
			url: `https://${artistId}.bandcamp.com`,
			name: track.artist,
			imageUrl: null,
			imageUrlSmall: null,
			id: artistId,
			provider: namespace,
		}],
		artistNames: track.artist ? [track.artist] : [],
		albumName: track.albumName || null,
		releaseDate: track.releaseDate || null,
		trackNumber: track.track_num,
		duration: text.formatSeconds(track.duration),
		isrcs: track.isrc ? [track.isrc] : []
	};
}

function getArtistId(artist) {
	const idRegex = /^https?:\/\/([^.]+)\.bandcamp\.com/;
	const match = artist.url.match(idRegex);
	return match ? match[1] : null;
}

function getArtistUrl(artist) {
	return artist.url;
}

function createUrl(type, id) {
	const baseUrl = "bandcamp.com";
	switch (type) {
		case "artist":
			return `https://${id}.bandcamp.com`;
		default:
			return `${baseUrl}/${id}`;
	}
}

function parseUrl(url) {
	const musicRegex = /^https?:\/\/([^.]+)\.bandcamp\.com\/(track|album)\/([^.]+)/;
	const musicMatch = url.match(musicRegex);
	if (musicMatch) {
		return {
			type: musicMatch[2],
			id: url
		};
	}
	const artistRegex = /^https?:\/\/([^.]+)\.bandcamp\.com/;
	const artistMatch = url.match(artistRegex);
	if (artistMatch) {
		return {
			type: "artist",
			id: artistMatch[1],
		};
	}
	return null;
}

init();

const bandcamp = {
	namespace,
	searchByArtistName: withCache(searchByArtistName, { ttl: 60 * 30, namespace: namespace }),
	getArtistAlbums: withCache(getArtistAlbums, { ttl: 60 * 30, namespace: namespace }),
	getAlbumById: withCache(getAlbumById, { ttl: 60 * 30, namespace: namespace }),
	getTrackById: withCache(getTrackById, { ttl: 60 * 30, namespace: namespace }),
	getArtistUrl,
	createUrl,
	formatArtistSearchData,
	formatArtistObject,
	formatArtistLookupData,
	formatAlbumObject,
	formatAlbumGetData,
	getArtistById,
	parseUrl,
	getTrackISRCs,
	getAlbumUPCs
};

export default bandcamp;
