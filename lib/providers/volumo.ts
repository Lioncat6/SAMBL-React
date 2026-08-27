import type { ArtistObject, AlbumObject, TrackObject, AlbumData, PartialArtistObject, FullProvider, RawAlbumData, Capabilities, LabelObject, } from "../../types/provider-types";
import withCache from "../../utils/cache";
import ErrorHandler from "../../utils/errorHandler";
import medium from "../../utils/medium";
import text from "../../utils/text";
import parsers from "../parsers/parsers";
import getVolumoGenre from "./lib/volumo-genres";
const namespace = "volumo";

const err = new ErrorHandler(namespace);

const { parseUrl, createUrl } = parsers.getParser(namespace);

// Volumo Types

export interface VolumoItemList<T> {
    items: T[];
}

export interface VolumoPartialAlbum {
    id: number
    icpn: string
    title: string
    exclusive: boolean
    artwork_uuid: string
    volumo_direct: boolean
    catalog_number?: string
    release_start_at: string
}

export interface VolumoAlbum extends VolumoPartialAlbum {
    hot: boolean
    price: number
    genres: number[]
    tracks: VolumoTrack[]
    artists: VolumoPartialArtist[]
    charted: boolean
    curated: boolean
    formats: VolumoFormats
    duration: number
    featured: boolean
    purchased: boolean
    downloaded: boolean
    first_live: string
    genres_ids: number[]
    description: string
    recordlabel: VolumoPartialLabel
    published_at: string
    tracks_total: number
    volumo_direct: boolean
    original_release_date: string
}

export interface VolumoTrack {
    id: number
    bpm: number
    isrc: string
    album: VolumoPartialAlbum
    genre: number
    price: number
    title: string
    artists: VolumoPartialArtist[]
    curated: boolean
    formats: VolumoFormats
    keysign: string
    version: string
    duration: number
    featured: boolean
    genre_id: number
    listened: boolean
    remixers: VolumoPartialArtist[]
    purchased: boolean
    album_only: boolean
    downloaded: boolean
    playlisted: number
    recordlabel: VolumoPartialLabel
    composed_title: string
    featured_artists: VolumoPartialArtist[]
    release_start_at: string
}

export interface VolumoPartialContributor {
    id: number
    name: string
    type: "recordlabel" | "artist"
    followed: unknown
}

export interface VolumoPartialArtist extends VolumoPartialContributor {
    type: "artist"
}

export interface VolumoPartialLabel extends VolumoPartialContributor {
    type: "recordlabel"
}

export interface VolumoFormats {
    mp3: VolumoFilesize
    wav: VolumoFilesize
    aiff: VolumoFilesize
    flac: VolumoFilesize
}

export interface VolumoFilesize {
    filesize: number
}

export interface VolumoContributor extends VolumoPartialContributor {
    rank: number
    genres: number[]
    parent: unknown
    public: boolean
    claimed: boolean
    is_public: boolean
    genres_ids: number[]
    description: string
    albums_total: number
    artwork_uuid: string | null
    charts_total: number
    country_code: string
    social_links: string[]
    tracks_total: number
    playlists_total: number
    embed_youtube_ids: unknown[]
    pick_of_the_month: unknown
    my_user_contributor_id: unknown
    contributor_direct_message: boolean
}

export interface VolumoArtist extends VolumoContributor {
    type: "artist"
}

export interface VolumoLabel extends VolumoContributor {
    type: "recordlabel"
}

// export interface VolumoSearchResponse {
//   albums: VolumoSearchAlbum[] | {}
//   charts: unknown[]
//   genres: unknown
//   tracks: VolumoSearchTrack[]
//   artists: VolumoSearchArtist[]
//   playlists: unknown[]
//   albums_total: number
//   charts_total: number
//   genres_total: number
//   recordlabels: VolumoSearchLabel[]
//   tracks_total: number
//   artists_total: number
//   playlists_total: number
//   recordlabels_total: number
// }

export type VolumoSearchResults = VolumoSearchAlbum | VolumoSearchTrack | VolumoSearchArtist | VolumoSearchLabel

export interface VolumoSearchResponse<T extends VolumoSearchResults> {
    items: T[]
}

export interface VolumoSearchContributor extends VolumoPartialContributor {
    artwork_uuid: string | null
    country_code: string | null
    pick_of_the_month: unknown
}

export interface VolumoSearchArtist extends VolumoSearchContributor {
    type: "artist"
}

export interface VolumoSearchLabel extends VolumoSearchContributor {
    type: "recordlabel"
}

export interface VolumoSearchAlbum extends VolumoPartialAlbum {
    artists: VolumoPartialArtist[]
    listened: boolean
    genres_ids: number[]
    tracks_ids: number[]
    recordlabel: VolumoPartialLabel
    published_at: string
}

export interface VolumoSearchTrack {
    id: number
    isrc: string
    album: VolumoPartialAlbum
    title: string
    artists: VolumoPartialArtist[]
    version?: string
    remixers: VolumoPartialArtist[]
    recordlabel: VolumoPartialLabel
    composed_title: string
    featured_artists: VolumoPartialArtist[]
    release_start_at: string
}

const baseUrl = "https://volumo.com/api/v1"

async function volumoFetch(path: string) {
    return await fetch(baseUrl + path);
}


interface VolumoFullSearch {
    artists: VolumoSearchArtist[]
    tracks: VolumoSearchTrack[]
    albums: VolumoSearchAlbum[]
}

async function runSearch<T extends VolumoSearchResults>(query: string, entity: "artist" | "track" | "album") {
    const paths: Record<typeof entity, string> = {
        "artist": `/contributors/artist/search?query=${encodeURIComponent(query)}&limit=20`,
        "album": `/albums/search?query=${encodeURIComponent(query)}&limit=20`,
        "track": `/tracks/search?query=${encodeURIComponent(query)}&limit=20`
    }
    const response = await volumoFetch(paths[entity]);
    if (response.ok) {
        const data = await response.json() as VolumoSearchResponse<T>;
        return data.items;
    } else {
        err.handleError(`Request error`, undefined, response, await response.text())
    }
    return null;
}

async function searchByArtistName(name: string): Promise<VolumoFullSearch | null> {
    try {
        let result: VolumoFullSearch = {
            artists: [],
            tracks: [],
            albums: []
        };
        const [artists, tracks, albums] = await Promise.all([
            runSearch<VolumoSearchArtist>(name, "artist"),
            runSearch<VolumoSearchTrack>(name, "track"),
            runSearch<VolumoSearchAlbum>(name, "album"),
        ])
        result = {
            artists: artists ?? [],
            tracks: tracks ?? [],
            albums: albums ?? []
        }
        return result;
    } catch (error) {
        err.handleError("Error searching for artist", error);
        return null;
    }
}

function formatArtistSearchData(data: VolumoFullSearch): VolumoSearchArtist[] {
    let artists = data.artists;
    let albums = Array.isArray(data.albums) ? data.albums : [];
    let tracks = data.tracks;
    // albums = albums.sort((a, b) => text.compareDates(b.release_start_at, a.release_start_at, true));
    const albumsArtistIDMap = new Map<number, VolumoSearchAlbum[]>();
    albums.forEach((album) => {
        album.artists.forEach((artist) => {
            if (!albumsArtistIDMap.has(artist.id)) {
                albumsArtistIDMap.set(artist.id, []);
            }
            albumsArtistIDMap.get(artist.id)?.push(album);
        });
    });
    // tracks = tracks.sort((a, b) => text.compareDates(b.release_start_at, a.release_start_at, true));
    const tracksArtistIDMap = new Map<number, VolumoSearchTrack[]>();
    tracks.forEach((track) => {
        [...track.artists, ...track.remixers, ...track.featured_artists].forEach((artist) => {
            if (!tracksArtistIDMap.has(artist.id)) {
                tracksArtistIDMap.set(artist.id, []);
            }
            tracksArtistIDMap.get(artist.id)?.push(track);
        });
    });
    artists.forEach((artist) => {
        if (!artist.artwork_uuid) {
            artist.artwork_uuid = albumsArtistIDMap.get(artist.id)?.find((album) => album.artwork_uuid)?.artwork_uuid ||
                tracksArtistIDMap.get(artist.id)?.find((track) => track.album.artwork_uuid)?.album.artwork_uuid || null;
        }
    });
    return artists;
}

function getVolumoGenres(ids: number | number[]): string[] {
    if (typeof ids == "number") {
        ids = [ids]
    }
    let genres: string[] = [];
    ids.forEach((id) => {
        const genre = getVolumoGenre(id);
        if (genre) genres.push(genre);
    })
    return genres;
}

function createVolumoImageUrl(uuid: string | null, small: boolean = false): string | null {
    if (!uuid) return null;
    if (small) {
        return `https://volumo.com/img/size/120x0/${uuid}.webp`;
    }
    return `https://volumo.com/img/size/0x0/${uuid}.png`;
}

function formatArtistObject(artist: VolumoSearchArtist | VolumoArtist): ArtistObject {
    if ("genres" in artist) {
        let fullArtist = artist as VolumoArtist;
        return {
            id: String(fullArtist.id),
            type: "artist",
            name: fullArtist.name,
            url: createUrl("artist", String(fullArtist.id)),
            provider: namespace,
            imageUrl: createVolumoImageUrl(fullArtist.artwork_uuid),
            imageUrlSmall: createVolumoImageUrl(fullArtist.artwork_uuid, true),
            bannerUrl: null,
            followers: null,
            popularity: null,
            genres: getVolumoGenres(fullArtist.genres),
            info: getVolumoGenres(fullArtist.genres).join(", "),
            relevance: `${fullArtist.albums_total} albums`
        }
    } else {
        const searchArtist = artist as VolumoSearchArtist;
        return {
            id: String(searchArtist.id),
            type: "artist",
            name: searchArtist.name,
            url: createUrl("artist", String(searchArtist.id)),
            provider: namespace,
            imageUrl: createVolumoImageUrl(searchArtist.artwork_uuid),
            imageUrlSmall: createVolumoImageUrl(searchArtist.artwork_uuid, true),
            bannerUrl: null,
            followers: null,
            popularity: null,
            genres: null,
            info: searchArtist.country_code || ``,
            relevance: searchArtist.country_code || ``
        }
    }
}

async function getArtistById(id: string): Promise<VolumoArtist | null> {
    try {
        const response = await volumoFetch(`/contributors/artist/${id}`);
        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`Failed to fetch artist: ${response.status} ${response.statusText}`);
        }
        const artist = await response.json() as VolumoArtist;
        if (!artist.artwork_uuid) {
            const albums = await getArtistAlbums(id, 0, 10);
            if (albums && albums.items.length > 0) {
                artist.artwork_uuid = albums.items.find((album) => album.artwork_uuid)?.artwork_uuid || null;
            }
        }
        return artist;
    } catch (error) {
        err.handleError("Error fetching artist:", error);
        return null;
    }
}

function formatArtistLookupData(data: VolumoArtist): VolumoArtist {
    return data;
}

export interface ExtendedAlbumFilterResponse extends VolumoItemList<VolumoAlbum> {
    offset: number;
    limit: number;
}

async function getArtistAlbums(artistId: string, offset: number = 0, limit: number = 1000): Promise<ExtendedAlbumFilterResponse | null> {
    try {
        const response = await volumoFetch(`/albums?filter={%22artist_id%22%3A${artistId}}&sort=date&limit=${limit}&offset=${offset}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch artist albums: ${response.status} ${response.statusText}`);
        }
        const albums = await response.json();
        const albumResponse: ExtendedAlbumFilterResponse = {
            ...albums,
            offset,
            limit
        };
        return albumResponse;
    } catch (error) {
        err.handleError("Error fetching artist albums:", error);
        return null;
    }
}

function formatAlbumGetData(data: ExtendedAlbumFilterResponse): RawAlbumData {
    return {
        albums: data.items,
        count: Number(data.limit) + Number(data.offset),
        current: data.offset,
        next: data.items.length == data.limit ? String(Number(data.offset) + Number(data.limit)) : null,
        max: 1000
    }
}

export type VolumoTrackWithNumber = VolumoTrack & { trackNumber: number };

function formatAlbumObject(album: VolumoAlbum): AlbumObject {
    const tracksWithNumbers: VolumoTrackWithNumber[] = album.tracks.map((track, index) => ({
        ...track,
        trackNumber: index + 1
    }));
    return {
        id: String(album.id),
        name: album.title,
        provider: namespace,
        type: "album",
        imageUrl: createVolumoImageUrl(album.artwork_uuid),
        imageUrlSmall: createVolumoImageUrl(album.artwork_uuid, true),
        url: createUrl('album', String(album.icpn)),
        releaseDate: text.formatDate(album.original_release_date || album.release_start_at),
        upc: album.icpn,
        albumType: album.tracks.length > 1 ? "album" : "single",
        trackCount: album.tracks.length,
        albumArtists: album.artists.map(formatPartialArtistObject),
        artistNames: album.artists.map((artist) => artist.name),
        genres: getVolumoGenres(album.genres),
        copyrights: null,
        labels: getAlbumLabels(album),
        mediums: medium.convertTrackList(tracksWithNumbers.map(formatTrackObject), 'Digital Media')
    }
}

function formatTrackObject(track: VolumoTrackWithNumber | VolumoTrack): TrackObject {
    return {
        id: String(track.id),
        name: track.title,
        provider: namespace,
        type: "track",
        imageUrl: createVolumoImageUrl(track.album.artwork_uuid),
        imageUrlSmall: createVolumoImageUrl(track.album.artwork_uuid, true),
        url: createUrl('track', String(track.id)),
        duration: track.duration,
        isrcs: [track.isrc],
        trackNumber: ("trackNumber" in track) ? track.trackNumber : null,
        trackArtists: [...track.artists, ...track.featured_artists, ...track.remixers].map(formatPartialArtistObject),
        artistNames: track.artists.map((artist) => artist.name),
        albumName: track.album.title,
        releaseDate: text.formatDate(track.album.release_start_at),
    }
}

function getAlbumLabels(album: VolumoAlbum): LabelObject[] {
    if (!album.recordlabel) {
        return [];
    }
    const label = album.recordlabel;
    return [{
        id: String(label.id),
        name: label.name,
        provider: namespace,
        type: "label",
        url: createUrl('label', String(label.id)),
        catalogNumber: album.catalog_number
    }];
}

function formatPartialArtistObject(artist: VolumoArtist): PartialArtistObject {
    return {
        id: String(artist.id),
        name: artist.name,
        provider: namespace,
        type: "partialArtist",
        imageUrl: createVolumoImageUrl(artist.artwork_uuid),
        imageUrlSmall: createVolumoImageUrl(artist.artwork_uuid, true),
        url: createUrl('artist', String(artist.id))
    }
}

async function getAlbumById(id: string): Promise<VolumoAlbum | null> {
    try {
        const path = text.validateUPC(id) ? `/album_by_icpn/${text.removeLeadingZeros(id)}` : `/albums/${id}`
        const response = await volumoFetch(path);
        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            err.handleError(`Request error`, undefined, response, await response.text());
        }
        const albums = await response.json();
        return Array.isArray(albums) ? albums[0]: albums ?? null;
    } catch (error) {
        err.handleError(`Error fetching album:`, error);
        return null;
    }
}

async function getAlbumByUPC(upc: string): Promise<AlbumObject[] | null> {
    try {
        const response = await volumoFetch(`/album_by_icpn/${text.removeLeadingZeros(upc)}`);
        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`Failed to fetch album: ${response.status} ${response.statusText}`);
        }
        let albums = await response.json() as VolumoAlbum;
        return [formatAlbumObject(albums)];
    } catch (error) {
        err.handleError(`Error fetching album:`, error);
        return null;
    }
}

async function getTrackById(id: string): Promise<VolumoTrack | null> {
    try {
        const response = await volumoFetch(`/tracks/${id}`);
        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`Failed to fetch track: ${response.status} ${response.statusText}`);
        }
        return response.json();
    } catch (error) {
        err.handleError(`Error fetching track:`, error);
        return null;
    }
}

const capabilities: Capabilities = {
    isrcs: {
        availability: "always",
        presence: "always"
    },
    upcs: {
        availability: "always",
        presence: "always"
    }
}

const volumo: FullProvider = {
    namespace,
    config: { capabilities },
    // getTrackByISRC: withCache(getTrackByISRC, { ttl: 60 * 30, namespace: namespace }),
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

export default volumo;
