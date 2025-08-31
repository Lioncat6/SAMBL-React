import type { ArtistObject, AlbumObject, TrackObject, AlbumData, AlbumArtistObject } from "./provider-types";
import { credentialsProvider, init as initAuth } from '@tidal-music/auth';
import { createAPIClient } from '@tidal-music/api';
import logger from "../../../utils/logger";
import withCache from "../../../utils/cache";
import ErrorHandler from "../../../utils/errorHandler";
import text from "../../../utils/text"
const namespace = "tidal";

const err = new ErrorHandler(namespace);

type Credentials = {
    clientId: string;
    clientSecret: string;
    token: string;
    expires: number;
    requestedScopes: Array<string>;
};

let credentials: Credentials | null = null;
const listeners: Array<(event: any) => void> = [];

const nodeCredentialsProvider = {
    bus: (callback: any) => {
        listeners.push(callback);
    },
    getCredentials: async (): Promise<Credentials> => {
        if (!credentials) {
            throw new Error("No credentials available");
        }
        return credentials;
    },
    // Helper for updating credentials and notifying listeners
    _setCredentials: (newCreds: Credentials) => {
        credentials = newCreds;
        const event = { 
            type: 'CredentialsUpdatedMessage', 
            payload: credentials 
        };
        listeners.forEach(fn => fn(event));
    }
};

const tidalClientId: string = process.env.TIDAL_CLIENT_ID ?? "";
const tidalClientSecret: string = process.env.TIDAL_CLIENT_SECRET ?? "";

if (!tidalClientId || !tidalClientSecret) {
    throw new Error("TIDAL_CLIENT_ID and TIDAL_CLIENT_SECRET must be set in environment variables.");
}

// Code permanently borrowed from https://github.com/kellnerd/harmony/tree
// Credit to @kellnerd and @outsidecontext
async function requestAccessToken() {
    // See https://developer.tidal.com/documentation/api-sdk/api-sdk-quick-start
    const url = 'https://auth.tidal.com/v1/oauth2/token';
    const auth = btoa(`${tidalClientId}:${tidalClientSecret}`);
    const body = new URLSearchParams();
    body.append('grant_type', 'client_credentials');
    body.append('client_id', tidalClientId);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
    });

    const content = await response.json();
    if (!content?.access_token) {
        err.handleError("Failed to authenticate Tidal!", `Reason: ${content.error || response.statusText}`)
    }
    return {
        accessToken: content?.access_token,
        validUntilTimestamp: Date.now() + (content.expires_in * 1000),
        expiresIn: content.expires_in,
    };
}



let tidalApi: any = null;
let validUntilTimestamp: number | null = null;

async function refreshApi() {
    if (!validUntilTimestamp || Date.now() > validUntilTimestamp || nodeCredentialsProvider.getCredentials() === null || tidalApi === null) {
        const tokenData = await requestAccessToken();
        nodeCredentialsProvider._setCredentials({ clientId: tidalClientId, clientSecret: tidalClientSecret, token: tokenData.accessToken, expires: tokenData.expiresIn, requestedScopes: [] });
        validUntilTimestamp = tokenData.validUntilTimestamp;
        tidalApi = createAPIClient(nodeCredentialsProvider);
    }
}


refreshApi();

async function getTrackByISRC(isrc) {
	await refreshApi();
	try {
		let data = await tidalApi.GET(`/tracks?countryCode=US&filter[isrc]=${isrc}&include=albums.coverArt&include=artists&include=albums`);
        if (data.data) {
            return JSON.parse(JSON.stringify(data.data));
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
		let data = await tidalApi.GET(`/albums?countryCode=US&filter[barcodeId]=${upc}&include=coverArt&include=artists`);
        if (data.data) {
            return JSON.parse(JSON.stringify(data.data));
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
        const data = await tidalApi.GET(`/searchResults/${encodeURIComponent(query)}?countryCode=US&include=artists&include=artists.profileArt&include=artists.albums&include=albums.artists&include=albums.coverArt&include=artists.albums.coverArt`);
        if (data?.data?.included && data?.data?.included.length > 0) {
            return JSON.parse(JSON.stringify(data)); // Tidal Moment
        } else {
            return {};
        }
    } catch (error) {
        err.handleError("Error searching for artist:", error);
    }
}

async function getAlbumById(tidalId) {
    await refreshApi();
    try {
        const data = await tidalApi.GET(`/albums/${tidalId}?countryCode=US&include=coverArt&include=artists&include=items`);
        if (data.data) {
            let included = data.data?.included;
            const artists = included.filter(obj => obj.type === "artists");
            const artworks = included.filter(obj => obj.type === "artworks");
            const tracks = included.filter(obj => obj.type === "tracks");
            let album = data.data?.data;
            album.attributes.artists = artists;
            album.attributes.coverArt = artworks[0];
            album.attributes.tracks = tracks;
            return JSON.parse(JSON.stringify(data.data?.data))
        } else {
            return null;
        }
    } catch (error) {
        err.handleError("Error fetching album by ID:", error);
    }
}

async function getTrackById(tidalId) {
    await refreshApi();
    try {
        const data = await tidalApi.GET(`/tracks/${tidalId}?countryCode=US&include=album&include=artists`);
        if (data.data) {
            return JSON.parse(JSON.stringify(data.data));
        } else {
            return null;
        }
    } catch (error) {
        err.handleError("Error fetching track by ID:", error);
    }
}

async function getArtistById(tidalId) {
    await refreshApi();
    try {
        const data = await tidalApi.GET(`/artists/${tidalId}?countryCode=US&include=artists&include=artists.profileArt&include=artists.albums&include=albums.artists&include=albums.coverArt&include=artists.albums.coverArt`);
        if (data.data) {
            return JSON.parse(JSON.stringify(data));
        } else {
            return null;
        }
    } catch (error) {
        err.handleError("Error fetching artist by ID:", error);
    }
}

async function getArtistAlbums(artistId, offset, limit) {
    await refreshApi();
    try {
        const data = await tidalApi.GET(`/artists/${artistId}/relationships/albums?countryCode=US&include=albums&include=albums.coverArt&include=albums.artists&include=albums.items${(offset && offset !=0) ? `&page[cursor]=${offset}` : ''}`);
        if (data.data) {
            return JSON.parse(JSON.stringify(data));
        } else {
            return null;
        }
    } catch (error) {
        err.handleError("Error fetching artist albums:", error);
    }
}

function formatAlbumGetData(rawData): AlbumData {
	const currentPage = /%5Bcursor%5D=([a-zA-Z0-9]+)/;
    const data = rawData.data?.data;
    const included = rawData.data?.included;
    if (!included) {
        return {
		count: null,
		current: null,
		next: null,
		albums: [],
	};
    }
    const artists = included.filter(obj => obj.type === "artists");
    const artistMap = Object.fromEntries(artists.map(a => [a.id, a]));
    const albums = included.filter(obj => obj.type === "albums");
    const artworks = included.filter(obj => obj.type === "artworks");
    const artworkMap = Object.fromEntries(artworks.map(a => [a.id, a]));
    const tracks = included.filter(obj => obj.type === "tracks");
    const trackMap = Object.fromEntries(tracks.map(t => [t.id, t]));

    for (let album of albums) {
        album.attributes.artists = album.relationships?.artists?.data.map(a => artistMap[a.id]) || [];
        album.attributes.tracks = album.relationships?.items?.data.map(t => trackMap[t.id]) || [];
        album.attributes.coverArt = artworkMap[album.relationships?.coverArt?.data[0]?.id] || null;
    }

	return {
		count: null,
		current: rawData.data?.links?.self?.match(currentPage) ? rawData.data?.links?.self?.match(currentPage)[1] : null,
		next: rawData.data?.links?.meta?.nextCursor || null,
		albums: albums,
	};
}

function formatAlbumObject(album): AlbumObject {
	return {
		provider: namespace,
		id: album.id,
		name: album.attributes.title,
		url: `https://tidal.com/album/${album.id}`,
		imageUrl: album.attributes?.coverArt?.attributes?.files[0]?.href || "",
		imageUrlSmall: album.attributes?.coverArt?.attributes?.files[5]?.href || "",
		albumArtists: album.attributes.artists.map(formatAlbumArtistObject),
		artistNames: album.attributes.artists.map(artist => artist.attributes.name).join(", "),
		releaseDate: album.attributes.releaseDate,
		trackCount: album.attributes.numberOfItems,
		albumType: album.attributes.type,
        upc: album.attributes.barcodeId,
        albumTracks: getAlbumTracks(album) || [],
	};
}

function getAlbumTracks(album) {
    let tracks = album.attributes.tracks;
    let items = album.relationships?.items.data || [];
    for (let item of items) {
        let track = tracks.find(t => t.id === item.id);
        if (track) {
            track.attributes.trackNumber = item.meta?.trackNumber;
            track.attributes.imageUrl = album.attributes?.coverArt?.attributes?.files[0]?.href || "";
            track.attributes.imageUrlSmall = album.attributes?.coverArt?.attributes?.files[5]?.href || "";
            track.attributes.albumName = album.attributes.title;
            track.attributes.artistNames =  album.attributes.artists.map(artist => artist.attributes.name).join(", ");
        }
    }
    const formattedTracks: TrackObject[] = tracks.map(formatTrackObject);
    formattedTracks.sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));
    return formattedTracks;
}

function formatTrackObject(track): TrackObject {
	return {
		provider: namespace,
		id: track.id,
		name: `${track.attributes.title}${track.attributes.version ? ` (${track.attributes.version})` : ""}`,
		url: `https://tidal.com/track/${track.id}`,
		imageUrl: track.attributes.imageUrl,
		imageUrlSmall: track.attributes.imageUrlSmall,
		artistNames: track.attributes.artistNames,
		albumName: track.attributes.albumName || null,
		releaseDate: track.attributes.releaseDate,
		trackNumber: track.attributes.trackNumber,
		duration: text.formatDuration(track.attributes.duration),
		isrcs: track.attributes.isrc ? [track.attributes.isrc] : [],
	};
}

function formatAlbumArtistObject(artist): AlbumArtistObject {
    return {
        provider: namespace,
        id: artist.id,
        name: artist.attributes.name,
        url: artist.attributes.link,
        imageUrl: artist.attributes.profileArt || "",
        imageUrlSmall: artist.attributes.profileArt || "",
    };
}

function getTrackISRCs(data) {
    if (!data) return null;
    let isrcs = data?.data?.attributes?.isrc ? [data.data?.attributes.isrc] : [];
    return isrcs;
}

function getAlbumUPCs(data) {
    if (!data) return null;
    let upcs = data?.attributes?.barcodeId ? [data.attributes.barcodeId] : [];
    return upcs;
}

function formatArtistSearchData(rawData) {
    const data = rawData.data?.data;
    const included = rawData.data?.included;
    if (!included) {
        if (data) {
            return [data];
        } else {
            return [];
        }
    }
    const artists = included.filter(obj => obj.type === "artists");
    const albums = included.filter(obj => obj.type === "albums");
    const artworks = included.filter(obj => obj.type === "artworks");
    const artworkMap = Object.fromEntries(artworks.map(a => [a.id, a]));

    for (let artist of artists) {
        let coverArtUrl = null;
        let topAlbumPopularity = -1;
        let bestAlbumDate = "";

        // Check for profileArt
        if (artist.relationships?.profileArt?.data?.length) {
            const artId = artist.relationships.profileArt.data[0].id;
            const art = artworkMap[artId];
            if (art?.attributes?.files?.length) {
                coverArtUrl = [...art.attributes.files].sort((a, b) => b.meta.width - a.meta.width)[0].href;
            }
        }

        // Fallback to album cover
        if (!coverArtUrl) {
            for (let album of albums) {
                if (album.relationships?.artists?.data?.some(a => a.id === artist.id)) {
                    const popularity = album.attributes?.popularity ?? 0;
                    const releaseDate = album.attributes?.releaseDate ?? "1970-01-01";

                    // Choose higher popularity, or more recent date on tie
                    if (
                        popularity > topAlbumPopularity ||
                        (popularity === topAlbumPopularity &&
                         new Date(releaseDate) > new Date(bestAlbumDate))
                    ) {
                        topAlbumPopularity = popularity;
                        bestAlbumDate = releaseDate;

                        const coverArtIds = Array.isArray(album.relationships?.coverArt?.data)
                            ? album.relationships.coverArt.data.map(ca => ca.id)
                            : album.relationships?.coverArt?.data?.id
                              ? [album.relationships.coverArt.data.id]
                              : [];

                        for (let id of coverArtIds) {
                            const art = artworkMap[id];
                            if (art?.attributes?.files?.length) {
                                coverArtUrl = [...art.attributes.files].sort((a, b) => b.meta.width - a.meta.width)[0].href;
                                break;
                            }
                        }
                    }
                }
            }
        }

        artist.imageUrl = coverArtUrl;
    }
    return artists;
}

function formatArtistLookupData(rawData) {
    let queryArtist = rawData.data?.links.self.match(/\/artists\/(\d+)/)[1];
    return formatArtistSearchData(rawData).filter(artist => artist.id === queryArtist)[0];
}

function formatArtistObject(rawObject): ArtistObject {
    return {
        name: rawObject.attributes.name,
        url: getArtistUrl(rawObject),
        imageUrl: rawObject.imageUrl || '',
        imageUrlSmall: rawObject.imageUrlSmall || '',
        relevance: `${(rawObject.attributes.popularity * 100).toFixed(0)}% Popularity`,
        info: '',
        genres: null,
        followers: null,
        popularity: rawObject.attributes.popularity * 100,
        id: rawObject.id,
        provider: namespace,
    };
}

function getArtistUrl(artist) {
    return `https://tidal.com/artist/${artist.id}`;
}

function parseUrl(url) {
    const regex = /(?:www\.)?tidal\.com\/(artist|track|album)\/(\d+)/;
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
    return `https://tidal.com/${type}/${id}`;
}

let tidal = {
    namespace,
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
    formatAlbumGetData,
    formatAlbumArtistObject,
    formatAlbumObject,
    getArtistUrl,
    getTrackISRCs,
    getAlbumUPCs,
    parseUrl,
    createUrl
};

export default tidal;