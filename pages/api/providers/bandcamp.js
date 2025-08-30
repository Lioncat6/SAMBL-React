import logger from "../../../utils/logger";
import withCache from "../../../utils/cache";
import ErrorHandler from "../../../utils/errorHandler";
const bcApi = require("bandcamp-scraper");

const namespace = "bandcamp";

const err = new ErrorHandler(namespace);

function parseBandcampDate(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date)) return null;
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
}

function searchAsync(params) {
	return new Promise((resolve, reject) => {
		bcApi.search(params, (error, searchResults) => {
			if (error) reject(error);
			else resolve(searchResults);
		});
	});
}

function getArtistByIdAsync(id) {
	return new Promise((resolve, reject) => {
		bcApi.getArtist(`https://${id}.bandcamp.com`, (error, artistData) => {
			if (error) reject(error);
			else resolve(artistData);
		});
	});
}

async function getAlbumUrlsAsync(artistUrl) {
	return new Promise((resolve, reject) => {
		bcApi.getAlbumUrls(artistUrl, (error, albumData) => {
			if (error) reject(error);
			else resolve(albumData);
		});
	});
}

async function getAlbumInfoAsync(albumUrl) {
	return new Promise((resolve, reject) => {
		bcApi.getAlbumInfo(albumUrl, (error, albumData) => {
			if (error) reject(error);
			else resolve(albumData);
		});
	});
}

async function getTrackInfoAsync(trackUrl) {
    return new Promise((resolve, reject) => {
        bcApi.getTrackInfo(trackUrl, (error, trackData) => {
            if (error) reject(error);
            else resolve(trackData);
        });
    });
}

async function init() {
	try {
		await searchAsync({ query: "test", page: 1 });
	} catch (error) {
		err.handleError("Error initializing Bandcamp API:", error);
	}
}

async function getAlbumById(url) {
    console.log(url)
    try {
        let albumData = null;
        if (url.includes("/album/")) {
            albumData = await getAlbumInfoAsync(url);
        } else if (url.includes("/track/")) {
            albumData = await getTrackInfoAsync(url);
        }
        console.log(albumData)
        return albumData;
    } catch (error) {
        err.handleError("Error fetching album by ID:", error);
    }
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
			return data.find((a) => a.url == `https://${artistId}.bandcamp.com`) || null;
		}
		return null;
	} catch (error) {
		err.handleError("Error fetching artist by ID:", error);
	}
}

function formatArtistLookupData(rawData) {
	return rawData;
}

function formatArtistObject(rawData) {
	return {
		name: rawData.name,
		url: rawData.url,
		imageUrl: rawData.imageUrl,
		relevance: rawData.location,
		info: rawData.tags.join(", "),
		genres: rawData.tags,
		followers: null,
		popularity: null,
		id: getArtistId(rawData),
		provider: namespace,
	};
}

async function getArtistAlbums(artistId, offset = 1, limit) {
	try {
		let searchResults = await searchAsync({ query: artistId, page: parseInt(offset) });
		let albumItems = searchResults.filter((a) => ( a.type == "album" || (a.type == "track" && a.artist == "" ) ) && a.url.includes(`https://${artistId}.bandcamp.com/`)); // Yes, this filters out tracks that have an album because of a coding error in the bandcamp library :3
		return { current: offset, next: searchResults.length === 0 ? null : parseInt(offset) + 1, albums: albumItems };
	} catch (error) {
		err.handleError("Error fetching artist albums:", error);
	}
}

function formatAlbumGetData(rawData) {
	return {
		count: null,
		current: rawData.current,
		next: rawData.next,
		albums: rawData.albums,
	};
}

function formatAlbumObject(album) {
	const artistId = album.url.match(/^https?:\/\/([^.]+)\.bandcamp\.com/)[1];
    const albumIdMatch = album.url.match(/\/(album|track)\/([^/]+)/);
	const albumId = albumIdMatch ? albumIdMatch[2] : null;
    let albumType = "album";
    if (!album.artist) {
        album.artist = artistId;
        albumType = "single";
    }
    let imageUrl = album.imageUrl.replace(/_\d+\.jpg$/, "_0.jpg") || `https://f4.bcbits.com/img/a${album.raw.art_id}_0.jpg`;
    let imageUrlSmall = album.imageUrl.replace(/_\d+\.jpg$/, "_3.jpg") || `https://f4.bcbits.com/img/a${album.raw.art_id}_3.jpg`;
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
		artistNames: album.artist,
		releaseDate: parseBandcampDate(album.releaseDate || album.raw?.current?.release_date),
		trackCount: album.numTracks,
		albumType: albumType,
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
	getArtistUrl,
	createUrl,
	formatArtistSearchData,
	formatArtistObject,
	formatArtistLookupData,
	formatAlbumObject,
	formatAlbumGetData,
	getArtistById,
    parseUrl
};

export default bandcamp;
