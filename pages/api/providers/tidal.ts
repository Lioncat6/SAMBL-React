import type { ArtistObject, AlbumObject, TrackObject, AlbumData, PartialArtistObject, FullProvider, RawAlbumData } from "../../../types/provider-types";
import { credentialsProvider, init as initAuth } from '@tidal-music/auth';
import { createAPIClient } from '@tidal-music/api';
import logger from "../../../utils/logger";
import withCache from "../../../utils/cache";
import ErrorHandler from "../../../utils/errorHandler";
import text from "../../../utils/text"
import parsers from "../../../lib/parsers/parsers";

const namespace = "tidal";

const err = new ErrorHandler(namespace);

const { parseUrl, createUrl } = parsers.getParser(namespace);

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
        err.handleError("Failed to authenticate Tidal!", new Error(`Reason: ${content.error || response.statusText}`))
    }
    return {
        accessToken: content?.access_token,
        validUntilTimestamp: Date.now() + (content.expires_in * 1000),
        expiresIn: content.expires_in,
    };
}

let validUntilTimestamp: number | null = null;

const tokenData = await requestAccessToken();
nodeCredentialsProvider._setCredentials({ clientId: tidalClientId, clientSecret: tidalClientSecret, token: tokenData.accessToken, expires: tokenData.expiresIn, requestedScopes: [] });
validUntilTimestamp = tokenData.validUntilTimestamp;


let tidalApi = createAPIClient(nodeCredentialsProvider);

async function refreshApi() {
    if (!validUntilTimestamp || Date.now() > validUntilTimestamp || nodeCredentialsProvider.getCredentials() === null || tidalApi === null) {
        const tokenData = await requestAccessToken();
        nodeCredentialsProvider._setCredentials({ clientId: tidalClientId, clientSecret: tidalClientSecret, token: tokenData.accessToken, expires: tokenData.expiresIn, requestedScopes: [] });
        validUntilTimestamp = tokenData.validUntilTimestamp;
        tidalApi = createAPIClient(nodeCredentialsProvider);
    }
}


refreshApi();

function getSmallImageUrl(url: string): string {
    if (!url) return "";
    return url.replace(/\/\d+x\d+/, '/320x320');
}

async function getTrackByISRC(isrc: string): Promise<TrackObject[] | null> {
    await refreshApi(); // /tracks?countryCode=US&filter[isrc]=${isrc}&include=albums.coverArt&include=artists&include=albums
    try {
        let data = await tidalApi.GET(`/tracks`, { params: { query: { countryCode: "US", "filter[isrc]": [isrc], include: ["albums.coverArt", "artists", "albums"] } } });
        let tidalData = data?.data;
        if (tidalData) {
            let tracksData: TrackObject[] = []
            const artists = tidalData.included?.filter((obj) => obj.type === "artists") || [];
            let artistMap = Object.fromEntries(artists.map((artist) => [artist.id, artist]));
            const artworks = tidalData.included?.filter((obj) => obj.type === "artworks") || [];
            let artworkMap = Object.fromEntries(artworks.map((artwork) => [artwork.id, artwork]));
            const albums = tidalData.included?.filter((obj) => obj.type === "albums") || [];
            let albumMap = Object.fromEntries(albums.map((album) => [album.id, album]));

            function getArtworkUrl(artworkId: string) {
                return artworkMap[artworkId]?.attributes?.files[0]?.href || "";
            }

            function getArtworkSmallUrl(artworkId: string) {
                return artworkMap[artworkId]?.attributes?.files[5]?.href || artworkMap[artworkId]?.attributes?.files[0]?.href || "";
            }

            function getArtists(artistIds: string[]) {
                let artistDict: PartialArtistObject[] = [];
                artistIds.forEach((id) => {
                    const artist = artistMap[id];
                    if (artist && artist.attributes) {
                        artistDict.push(formatPartialArtistObject(artist));
                    }
                });
                return artistDict;
            }

            function getMostRecentAlbum(albumIds: string[]) {
                let mostRecent: TidalAlbum | null = null as TidalAlbum | null;
                albumIds.forEach((id) => {
                    const album = albumMap[id];
                    if (album) {
                        const releaseDate = new Date(album.attributes?.releaseDate || "");
                        if (!mostRecent || releaseDate.getTime() > new Date(mostRecent.attributes?.releaseDate || "").getTime()) {
                            mostRecent = album;
                        }
                    }
                });
                return mostRecent;
            }
            // [ `${track?.relationships?.albums?.data.length} Album${track?.relationships?.albums?.data.length !== 1 ? "s" : ""}`, ],
            tidalData?.data?.forEach((track) => {
                let mostRecentAlbum = track.relationships?.albums?.data?.map((album) => album.id) ? getMostRecentAlbum(track.relationships?.albums?.data?.map((album) => album.id)) : null;
                tracksData.push(
                    {
                        provider: namespace,
                        imageUrl: mostRecentAlbum?.relationships?.coverArt?.data?.[0] ? getArtworkUrl(mostRecentAlbum?.relationships?.coverArt?.data?.[0]?.id) : null,
                        imageUrlSmall: mostRecentAlbum?.relationships?.coverArt?.data?.[0] ? getArtworkSmallUrl(mostRecentAlbum?.relationships?.coverArt?.data[0]?.id) : null,
                        name: track.attributes?.title || "",
                        trackArtists: track.relationships?.artists?.data?.map((artist) => artist.id) ? getArtists(track.relationships?.artists?.data.map((artist) => artist.id)) : [],
                        url: `https://tidal.com/track/${track.id}`,
                        releaseDate: mostRecentAlbum?.attributes?.releaseDate || null,
                        duration: track?.attributes?.duration ? text.formatDurationMS(track?.attributes?.duration) : null,
                        id: track.id,
                        artistNames: [],
                        albumName: mostRecentAlbum?.attributes?.title || null,
                        trackNumber: null,
                        isrcs: track.attributes?.isrc ? [track.attributes?.isrc] : [],
                        type: "track"
                    }
                );
            });
            return tracksData;
        } else {
            return null;
        }
    } catch (error) {
        err.handleError("Error fetching track by ISRC:", error);
        return null;
    }
}

async function getAlbumByUPC(upc: string): Promise<AlbumObject[] | null> {
    await refreshApi(); // /albums?countryCode=US&filter[barcodeId]=${upc}&include=coverArt&include=artists
    try {
        let data = await tidalApi?.GET(`/albums`, { params: { query: { countryCode: "US", "filter[barcodeId]": [upc], include: ["coverArt", "artists"] } } });
        let tidalData = data?.data;
        if (tidalData && tidalData?.data?.[0]?.attributes?.title) {
            let albumsData: AlbumObject[] = []
            const artists = tidalData.included ? tidalData.included.filter((obj) => obj.type === "artists") : [];
            let artistMap = Object.fromEntries(artists.map((artist) => [artist.id, artist]));
            const artworks = tidalData.included ? tidalData.included.filter((obj) => obj.type === "artworks") : [];
            let artworkMap = Object.fromEntries(artworks.map((artwork) => [artwork.id, artwork]));

            function getArtworkUrl(artworkId: string) {
                return artworkMap[artworkId]?.attributes?.files[0]?.href || "";
            }

            function getArtworkSmallUrl(artworkId: string) {
                return artworkMap[artworkId]?.attributes?.files[5]?.href || artworkMap[artworkId]?.attributes?.files[0]?.href || "";
            }

            function getArtists(artistIds: string[]) {
                let artistDict: PartialArtistObject[] = [];
                artistIds.forEach((id) => {
                    const artist = artistMap[id];
                    if (artist && artist.attributes) {
                        artistDict.push(formatPartialArtistObject(artist))
                    }
                });
                return artistDict;
            }

            tidalData.data.forEach((album) => {
                if (album.attributes) {
                    albumsData.push(
                        {
                            provider: namespace,
                            id: album.id,
                            name: album.attributes?.title,
                            url: `https://tidal.com/album/${album.id}`,
                            imageUrl: album.relationships?.coverArt?.data?.[0] ? getArtworkUrl(album.relationships?.coverArt?.data[0]?.id) : "",
                            imageUrlSmall: album.relationships?.coverArt?.data?.[0] ? getArtworkSmallUrl(album.relationships?.coverArt?.data[0]?.id) : null,
                            albumArtists: getArtists(album.relationships?.artists?.data?.map((artist) => artist.id) || []),
                            artistNames: getArtists(album.relationships?.artists?.data?.map((artist) => artist.id) || []).map((artist) => artist.name),
                            releaseDate: album.attributes.releaseDate || null,
                            trackCount: album.attributes.numberOfItems,
                            albumType: album.attributes.albumType,
                            upc: album.attributes.barcodeId,
                            albumTracks: [], //TODO: Implement album track fetching for getting album by UPC
                            type: "album"
                        }
                    );
                }
            });
            return albumsData;
        } else {
            return null;
        }
    } catch (error) {
        err.handleError("Error fetching album by UPC:", error);
        return null;
    }
}

type _GetSearchResults = () => ReturnType<typeof tidalApi.GET<"/searchResults/{id}", { params }>>;
type TidalSearchResultsResponse = Awaited<ReturnType<_GetSearchResults>>;
type TidalSearchResultsData = NonNullable<TidalSearchResultsResponse["data"]>

async function searchByArtistName(query: string) {
    await refreshApi(); // /searchResults/${encodeURIComponent(query)}?countryCode=US&include=artists&include=artists.profileArt&include=artists.albums&include=albums.artists&include=albums.coverArt&include=artists.albums.coverArt
    try {
        const data = await tidalApi?.GET(`/searchResults/{id}`, { params: { path: { id: encodeURIComponent(query) }, query: { countryCode: "US", include: ["artists", "artists.profileArt", "artists.albums", "albums.artists", "albums.coverArt", "artists.albums.coverArt"] } } });
        const artistData = data?.data
        if (artistData?.included && artistData?.included.length > 0) {
            return artistData;
        } else {
            return {};
        }
    } catch (error) {
        err.handleError("Error searching for artist:", error);
    }
}



type _GetAlbum = () => ReturnType<typeof tidalApi.GET<"/albums/{id}", { params }>>;
type TidalAlbumResponse = Awaited<ReturnType<_GetAlbum>>;
type TidalAlbumIncluded = NonNullable<NonNullable<TidalAlbumResponse["data"]>["included"]>[number];
type TidalAlbum = NonNullable<NonNullable<TidalAlbumResponse["data"]>["data"]>;
type TidalArtist = Extract<TidalAlbumIncluded, { type: "artists" }>;
type TidalArtwork = Extract<TidalAlbumIncluded, { type: "artworks" }>;
type TidalTrack = Extract<TidalAlbumIncluded, { type: "tracks" }>;
interface ExtendedAlbum extends TidalAlbum {
    artists: TidalArtist[];
    coverArt: TidalArtwork | null;
    tracks: TidalTrack[];
}


async function getAlbumById(tidalId: string) {
    await refreshApi(); // /albums/${tidalId}?countryCode=US&include=coverArt&include=artists&include=items
    try {
        const data = await tidalApi?.GET(`/albums/{id}`, { params: { path: { id: tidalId }, query: { countryCode: "US", include: ["coverArt", "artists", "items"] } } });
        const albumData = data?.data;
        if (albumData && albumData.data) {
            const included = albumData.included;
            const artists = included ? included.filter(obj => obj.type === "artists") : [];
            const artworks = included ? included.filter(obj => obj.type === "artworks") : [];
            const tracks = included ? included.filter(obj => obj.type === "tracks") : [];
            let album = data.data?.data as ExtendedAlbum;
            album.artists = artists;
            album.coverArt = artworks[0];
            album.tracks = tracks;
            return JSON.parse(JSON.stringify(album)) as ExtendedAlbum;
        } else {
            return null;
        }
    } catch (error) {
        err.handleError("Error fetching album by ID:", error);
    }
}

async function getTrackById(tidalId: string) {
    await refreshApi(); ///tracks/${tidalId}?countryCode=US&include=album&include=artists
    try {
        const data = await tidalApi.GET(`/tracks/{id}`, { params: { path: { id: tidalId }, query: { countryCode: "US", include: ["album", "artists"] } } });
        if (data.data) {
            return JSON.parse(JSON.stringify(data.data)) as typeof data.data;
        } else {
            return null;
        }
    } catch (error) {
        err.handleError("Error fetching track by ID:", error);
    }
}

async function getArtistById(tidalId: string) {
    await refreshApi(); // /artists/${tidalId}?countryCode=US&include=artists&include=artists.profileArt&include=artists.albums&include=albums.artists&include=albums.coverArt&include=artists.albums.coverArt
    try {
        const data = await tidalApi.GET(`/artists/{id}`, { params: { path: { id: tidalId }, query: { countryCode: "US", include: ["artists", "artists.profileArt", "artists.albums", "albums.artists", "albums.coverArt", "artists.albums.coverArt"] } } });
        if (data.data) {
            return JSON.parse(JSON.stringify(data.data)) as typeof data.data;
        } else {
            return null;
        }
    } catch (error) {
        err.handleError("Error fetching artist by ID:", error);
    }
}

type _GetArtist = () => ReturnType<typeof tidalApi.GET<"/artists/{id}", { params }>>;
type TidalArtistReponse = Awaited<ReturnType<_GetArtist>>;
type TidalArtistData = NonNullable<TidalArtistReponse["data"]>

async function getArtistAlbums(artistId: string, offset?: string | null | number, limit?: string | null | number) {
    await refreshApi(); // /artists/${artistId}/relationships/albums?countryCode=US&include=albums&include=albums.coverArt&include=albums.artists&include=albums.items${(offset && offset != 0) ? `&page[cursor]=${offset}` : ''}
    try {
        const data = await tidalApi.GET(`/artists/{id}`, { params: { path: { id: artistId }, query: { countryCode: "US", include: ["albums", "albums.coverArt", "albums.artists", "albums.items"], page: offset || undefined } } });
        if (data.data) {
            return JSON.parse(JSON.stringify(data)) as typeof data;
        } else {
            return null;
        }
    } catch (error) {
        err.handleError("Error fetching artist albums:", error);
    }
}



function formatAlbumGetData(rawData: TidalArtistReponse): RawAlbumData {
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
    const albums = included.filter(obj => obj.type === "albums") as ExtendedAlbum[];
    const artworks = included.filter(obj => obj.type === "artworks");
    const artworkMap = Object.fromEntries(artworks.map(a => [a.id, a]));
    const tracks = included.filter(obj => obj.type === "tracks");
    const trackMap = Object.fromEntries(tracks.map(t => [t.id, t]));

    for (let album of albums) {
        album.artists = album.relationships?.artists?.data?.map(a => artistMap[a.id]) || [];
        album.tracks = album.relationships?.items?.data?.map(t => trackMap[t.id]) || [];
        album.coverArt = album.relationships?.coverArt?.data?.[0]?.id ? artworkMap[album.relationships?.coverArt?.data[0]?.id] || null : null;
    }

    return {
        count: null,
        current: rawData.data?.links?.self?.match(currentPage) ? rawData.data?.links?.self?.match(currentPage)?.[1] || null : null,
        next: rawData.data?.links?.next?.match(currentPage) ? rawData.data?.links?.next?.match(currentPage)?.[1] || null : null,
        albums: albums,
    };
}

function formatAlbumObject(album: ExtendedAlbum): AlbumObject {
    return {
        provider: namespace,
        id: album.id,
        name: album.attributes?.title || "",
        url: `https://tidal.com/album/${album.id}`,
        imageUrl: album.coverArt?.attributes?.files[0]?.href || "",
        imageUrlSmall: album.coverArt?.attributes?.files[5]?.href || "",
        albumArtists: album.artists.map(formatPartialArtistObject),
        artistNames: album.artists.map(artist => artist.attributes?.name).filter((name) => name != undefined),
        releaseDate: album.attributes?.releaseDate || null,
        trackCount: album.attributes?.numberOfItems || null,
        albumType: album.attributes?.type || null,
        upc: album.attributes?.barcodeId || null,
        albumTracks: getAlbumTracks(album) || [],
        type: "album"
    };
}

interface ExtendedTrack extends TidalTrack {
    trackNumber: number | null
    imageUrl: string | null
    imageUrlSmall: string | null
    albumName: string | null
    releaseDate: string | null
    artists: TidalArtist[]
}

function getAlbumTracks(album: ExtendedAlbum) {
    let tracks = album.tracks;
    let items = album.relationships?.items.data || [];
    for (let item of items) {
        let track = tracks.find(t => t.id === item.id) as ExtendedTrack | undefined;
        if (track) {
            track.trackNumber = item.meta?.trackNumber || null;
            track.imageUrl = album.coverArt?.attributes?.files[0]?.href || null;
            track.imageUrlSmall = album.coverArt?.attributes?.files[5]?.href || null;
            track.albumName = album.attributes?.title || null;
            track.artists = album.artists || [];
            track.releaseDate = album.attributes?.releaseDate || null;
        }
    }
    const formattedTracks: TrackObject[] = tracks.map(formatTrackObject);
    formattedTracks.sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));
    return formattedTracks;
}

function formatTrackObject(track: ExtendedTrack): TrackObject {
    return {
        provider: namespace,
        id: track.id,
        name: `${track.attributes?.title}${track.attributes?.version ? ` (${track.attributes.version})` : ""}`,
        url: `https://tidal.com/track/${track.id}`,
        imageUrl: track.imageUrl,
        imageUrlSmall: track.imageUrlSmall,
        trackArtists: track.artists.map(formatPartialArtistObject),
        artistNames: track.artists.map(artist => artist.attributes?.name).filter((name) => name != undefined),
        albumName: track.albumName,
        releaseDate: track.releaseDate,
        trackNumber: track.trackNumber,
        duration: track.attributes?.duration ? text.formatDurationMS(track.attributes?.duration) : null,
        isrcs: track.attributes?.isrc ? [track.attributes.isrc] : [],
        type: "track"
    };
}

function formatPartialArtistObject(artist: TidalArtist): PartialArtistObject {
    return {
        provider: namespace,
        id: artist.id,
        name: artist.attributes?.name || "",
        url: `https://tidal.com/artist/${artist.id}`,
        imageUrl: null,
        imageUrlSmall: null,
        type: "partialArtist"
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

interface ExtendedArtist extends TidalArtist {
    imageUrl: string | null
    imageUrlSmall: string | null
}

function formatArtistSearchData(rawData: TidalSearchResultsData | TidalArtistData) {
    const data = rawData.data;
    const included = rawData.included;
    if (!included) {
        if (data) {
            return [data];
        } else {
            return [];
        }
    }
    const artists = included.filter(obj => obj.type === "artists") as ExtendedArtist[];
    const albums = included.filter(obj => obj.type === "albums");
    const artworks = included.filter(obj => obj.type === "artworks");
    const artworkMap = Object.fromEntries(artworks.map(a => [a.id, a]));

    for (let artist of artists) {
        let coverArtUrl: string | null = null;
        let topAlbumPopularity = -1;
        let bestAlbumDate = "";

        // Check for profileArt
        if (artist.relationships?.profileArt?.data?.length) {
            const artId = artist.relationships.profileArt.data[0].id;
            const art = artworkMap[artId];
            if (art?.attributes?.files?.length) {
                coverArtUrl = [...art.attributes.files].sort((a, b) => (b.meta?.width || 0) - (a.meta?.width || 0))[0].href;
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

                        const coverArtIds = album.relationships.coverArt.data?.map(ca => ca.id) || []

                        for (let id of coverArtIds) {
                            const art = artworkMap[id];
                            if (art?.attributes?.files?.length) {
                                coverArtUrl = [...art.attributes.files].sort((a, b) => (b.meta?.width || 0) - (a.meta?.width || 0))[0].href;
                                break;
                            }
                        }
                    }
                }
            }
        }

        artist.imageUrl = coverArtUrl;
        artist.imageUrlSmall = getSmallImageUrl(coverArtUrl || "");
    }
    return artists;
}

function formatArtistLookupData(rawData: TidalArtistData) {
    let queryArtist = rawData?.links?.self.match(/\/artists\/(\d+)/)?.[1];
    return formatArtistSearchData(rawData).filter(artist => artist.id === queryArtist)[0];
}

function formatArtistObject(rawObject: ExtendedArtist): ArtistObject {
    return {
        name: rawObject.attributes?.name || "",
        url: getArtistUrl(rawObject),
        imageUrl: rawObject.imageUrl || '',
        imageUrlSmall: rawObject.imageUrlSmall || '',
        bannerUrl: null,
        relevance: rawObject.attributes?.popularity ? `${(rawObject.attributes?.popularity * 100).toFixed(0)}% Popularity` : "",
        info: '',
        genres: null,
        followers: null,
        popularity: rawObject.attributes?.popularity ? rawObject.attributes?.popularity * 100 : null,
        id: rawObject.id,
        provider: namespace,
        type: "artist"
    };
}

function getArtistUrl(artist) {
    return `https://tidal.com/artist/${artist.id}`;
}

let tidal: FullProvider = {
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
    formatPartialArtistObject,
    formatAlbumObject,
    formatTrackObject,
    getTrackISRCs,
    getAlbumUPCs,
    parseUrl,
    createUrl
};

export default tidal;