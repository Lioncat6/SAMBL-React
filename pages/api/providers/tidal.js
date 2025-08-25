import { credentialsProvider, init as initAuth } from '@tidal-music/auth';
import { createAPIClient } from '@tidal-music/api';
import logger from "../../../utils/logger";
import withCache from "../../../utils/cache";

const namespace = "tidal";


let credentials = null;
const listeners = [];

const nodeCredentialsProvider = {
    bus: (callback) => {
        listeners.push(callback);
    },
    getCredentials: async () => credentials,
    // Helper for updating credentials and notifying listeners
    _setCredentials: (newCreds) => {
        credentials = newCreds;
        const event = { 
            type: 'CredentialsUpdatedMessage', 
            payload: credentials 
        };
        listeners.forEach(fn => fn(event));
    }
};

const tidalClientId = process.env.TIDAL_CLIENT_ID;
const tidalClientSecret = process.env.TIDAL_CLIENT_SECRET;

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
    return {
        accessToken: content?.access_token,
        validUntilTimestamp: Date.now() + (content.expires_in * 1000),
        expiresIn: content.expires_in,
    };
}



let tidalApi = null;
let validUntilTimestamp = null;

async function refreshApi() {
    if (!validUntilTimestamp || Date.now() > validUntilTimestamp || nodeCredentialsProvider.getCredentials() === null || tidalApi === null) {
        const tokenData = await requestAccessToken();
        nodeCredentialsProvider._setCredentials({ clientId: tidalClientId, clientSecret: tidalClientSecret, token: tokenData.accessToken, expires: tokenData.expiresIn });
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
		logger.error("Error fetching track by ISRC:", error);
		throw error;
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
		logger.error("Error fetching album by UPC:", error);
		throw error;
	}
}

async function searchByArtistName(query) {
    await refreshApi();
    try {
        const data = await tidalApi.GET(`/searchResults/${encodeURIComponent(query)}?countryCode=US&include=artists&include=artists.profileArt&include=artists.albums&include=albums.artists&include=albums.coverArt&include=artists.albums.coverArt`);

        if (data?.data.included && data?.data.included.length > 0) {
            return JSON.parse(JSON.stringify(data)); // Tidal Moment
        } else {
            return {};
        }
    } catch (error) {
        logger.error("Error searching for artist:", error);
        throw error;
    }
}

async function getAlbumById(tidalId) {
    await refreshApi();
    try {
        const data = await tidalApi.GET(`/albums/${tidalId}?countryCode=US&include=coverArt&include=artists`);
        if (data.data) {
            let included = data.data.included;
            const artists = included.filter(obj => obj.type === "artists");
            const artworks = included.filter(obj => obj.type === "artworks");
            let album = data.data.data;
            album.attributes.artists = artists;
            album.attributes.coverArt = artworks[0];
            return JSON.parse(JSON.stringify(data.data.data))
        } else {
            return null;
        }
    } catch (error) {
        logger.error("Error fetching album by ID:", error);
        throw error;
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
        logger.error("Error fetching track by ID:", error);
        throw error;
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
        logger.error("Error fetching artist by ID:", error);
        throw error;
    }
}

async function getArtistAlbums(artistId, offset, limit) {
    await refreshApi();
    try {
        const data = await tidalApi.GET(`/artists/${artistId}/relationships/albums?countryCode=US&include=albums&include=albums.coverArt&include=albums.artists${(offset && offset !=0) ? `&page[cursor]=${offset}` : ''}`);
        if (data.data) {
            return JSON.parse(JSON.stringify(data));
        } else {
            return null;
        }
    } catch (error) {
        logger.error("Error fetching artist albums:", error);
        throw error;
    }
}

function formatAlbumGetData(rawData) {
	const currentPage = /%5Bcursor%5D=([a-zA-Z0-9]+)/;
    const included = rawData.data.included;
    const artists = included.filter(obj => obj.type === "artists");
    const artistMap = Object.fromEntries(artists.map(a => [a.id, a]));
    const albums = included.filter(obj => obj.type === "albums");
    const artworks = included.filter(obj => obj.type === "artworks");
    const artworkMap = Object.fromEntries(artworks.map(a => [a.id, a]));

    for (let album of albums) {
        album.attributes.artists = album.relationships?.artists?.data.map(a => artistMap[a.id]) || [];
        album.attributes.coverArt = artworkMap[album.relationships?.coverArt?.data[0]?.id] || null;
    }

	return {
		count: null,
		current: rawData.data.links?.self?.match(currentPage) ? rawData.data.links?.self?.match(currentPage)[1] : null,
		next: rawData.data.links?.meta?.nextCursor || null,
		albums: albums,
	};
}

function formatAlbumObject(album) {
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
	};
}

function formatAlbumArtistObject(artist) {
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
    let isrcs = data?.data?.attributes?.isrc ? [data.data.attributes.isrc] : [];
    return isrcs;
}

function getAlbumUPCs(data) {
    if (!data) return null;
    let upcs = data?.data?.attributes?.barcodeId ? [data.data.attributes.barcodeId] : [];
    return upcs;
}

function formatArtistSearchData(rawData) {
    const included = rawData.data.included;
    const artists = included.filter(obj => obj.type === "artists");
    const albums = included.filter(obj => obj.type === "albums");
    const artworks = included.filter(obj => obj.type === "artworks");
    const artworkMap = Object.fromEntries(artworks.map(a => [a.id, a]));

    for (let artist of artists) {
        let coverArtUrl = null;
        let topAlbumPopularity = -1;
        let bestAlbumDate = null;

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
    let queryArtist = rawData.data.links.self.match(/\/artists\/(\d+)/)[1];
    return formatArtistSearchData(rawData).filter(artist => artist.id === queryArtist)[0];
}

function formatArtistObject(rawObject) {
    return {
        name: rawObject.attributes.name,
        url: getArtistUrl(rawObject),
        imageUrl: rawObject.imageUrl || '',
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