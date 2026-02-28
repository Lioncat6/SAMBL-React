import { ArtistObject, AlbumObject, TrackObject, AlbumData, PartialArtistObject, FullProvider, RawAlbumData, Capabilities, PartialProvider, ProviderNamespace } from "../../types/provider-types";
import logger from "../../utils/logger";
import withCache from "../../utils/cache";
import parsers from "../parsers/parsers";
import ErrorHandler from "../../utils/errorHandler";

const namespace: ProviderNamespace = "naver"
const err = new ErrorHandler(namespace);
const { createUrl, parseUrl } = parsers.getParser(namespace);

// Response Wrapper
export interface NaverResponse<TResult> {
    response: {
        result: TResult
    }
}

// Shared Artist Types
export interface NaverPartialArtist {
    artistId: number
    artistName: string
    imageUrl?: string
}

export interface NaverArtist extends NaverPartialArtist {
    debutDate?: string
    genreNames: string
    likeCount: number
    isGroup: boolean
}

export interface NaverArtistResult {
    artist: NaverArtist
}

// Artist Search
export interface NaverSearchResult {
    originalQuery: string
}

export interface NaverArtistSearchResult extends NaverSearchResult {
    artistTotalCount: number
    artists?: NaverArtist[]
}

// Artist Detail (artistEnd)
export interface NaverArtistPhoto {
    musicianPhotoType: string
    thumbnailImageUrl: string
    bodyImageUrl: string
    originalImageUrl: string
    imageUrlKey: string
    photoViewerImgId: string
    photoViewerIndex: number
}

export interface NaverArtistMember {
    artistId: number
    artistName: string
    imageUrl?: string
    likeCount: number
}

export interface NaverArtistEnd {
    artistId: number
    artistName: string
    debutDate: string
    gender: string
    isGroup: boolean
    activePeriod: string
    managementName: string
    genreNames: string
    memberGroupArtistIds: string
    memberGroupArtistNames: string
    imageUrl: string
    biography?: string
    likeCount: number
    photoCount: number
    photoList: NaverArtistPhoto[]
    memberList: NaverArtistMember[]
}

// Album Types
export interface NaverAlbumBase {
    albumId: number
    albumTitle: string
    releaseDate: string
    imageUrl: string
    isDolbyAtmos: boolean
    hasDolbyAtmos: boolean
    isVariousArtists: boolean
}

export interface NaverPartialAlbum extends NaverAlbumBase {
    artists: NaverPartialArtist[]
}

export interface NaverAlbum extends NaverAlbumBase {
    isRegular: boolean
    isAdult: boolean
    agencyName: string
    productionName: string
    artists: NaverPartialArtist[]
    sizeAndDuration: string
    trackTotalCount: number
    artistTotalCount: number
    albumGenres: string
    albumGenreList: string[]
    shareUrl: string
    likeCount: number
    playtime: number
}

export interface NaverAlbumResult {
    album: NaverAlbum
}

// Track Credits (writers, composers, arrangers)
export interface NaverCreditArtist {
    artistId: number
    artistName: string
    isDisplay: boolean
}

export type NaverLyricWriter = NaverCreditArtist
export type NaverComposer = NaverCreditArtist
export type NaverArranger = NaverCreditArtist

// Track Information (/track/{id}/info.json)
export interface NaverTrackInformation {
    trackId: number
    lyricWriters: NaverLyricWriter[]
    composers: NaverComposer[]
    arrangers: NaverArranger[]
    hasLyric: string
    hasSyncLyric: string
    syncLyric: string
    lyricSourceTypeCd: string
    lyricRegisterUserId: number | null
    lyricUpdateUserId: number | null
}

// Track Detail (/track/{id}.json)
export interface NaverTrack {
    trackId: number
    trackTitle: string
    represent: boolean
    discNumber: number
    trackNumber: number
    artists: NaverPartialArtist[]
    album: NaverPartialAlbum
    hasLyric: boolean
    hasSyncLyric: boolean
    isStreaming: boolean
    isDownload: boolean
    isMobileDownload: boolean
    isAdult: boolean
    representDownloadPrice: number
    isPrdd: boolean
    isAodd: boolean
    isOversea: boolean
    playTime: string
    isKaraokeEnabled: boolean
    isDolbyAtmos: boolean
    hasDolbyAtmos: boolean
}

export interface NaverTrackResult {
    track: NaverTrack
}

// Search-All (/searchall.json)
export interface NaverSearchAllTrackResult {
    trackTotalCount: number
    tracks: NaverTrack[]
}

export interface NaverSearchAllAlbumResult {
    albumTotalCount: number
    albums: NaverPartialAlbum[]
}

export interface NaverSearchAllArtistResult {
    artistTotalCount: number
    artists: NaverArtist[]
}

export interface NaverSearchAllResult extends NaverSearchResult {
    lyricResult: { trackTotalCount: number }
    trackResult: NaverSearchAllTrackResult
    albumResult: NaverSearchAllAlbumResult
    artistResult: NaverSearchAllArtistResult
    videoResult: { videoTotalCount: number }
    playlistResult: { playlistTotalCount: number }
    userPlaylistResult: { playlistTotalCount: number }
    newAudioResult: { audioTotalCount: number }
    popularResult: { searchType: number }
}

// Artist Albums
export interface NaverArtistAlbumsResult {
    albumTotalCount: number
    albums: NaverPartialAlbum[]
}

// Artist Tracks
export interface NaverArtistTracksResult {
    trackTotalCount: number
    tracks: NaverTrack[]
}

// Album Tracks
export interface NaverAlbumTrack extends NaverTrack {
    likeCount?: number
    score?: number
    isTopPopular?: boolean
}

export interface NaverAlbumTracksResult {
    trackTotalCount: number
    tracks: NaverAlbumTrack[]
}

// Custom Types
export interface NaverAlbumWithTracks extends NaverAlbum {
    tracks?: NaverAlbumTrack[]
}

export interface NaverPartialAlbumWithTracks extends NaverPartialAlbum {
    tracks?: NaverAlbumTrack[]
    trackTotalCount?: number
}

const apiUrl = "https://apis.naver.com/vibeWeb/musicapiweb"
/**
 * V4 Paramters:
 * `&start=1&display=100&sort=RELEVANCE&cact=ogn`
 * - start: offset, starting at 1 instead of 0
 * - display: limit, seemingly has no limit
 * - sort: supports at least RELEVANCE
 * - cact: unknown
 */
const v4Url = apiUrl + "/v4"
/**
 * Only needed for /artist endpoint,
 * otherwise is just an alias of the base apiUrl
 */
const v1Url = apiUrl + "/vibe/v1"

function getFullImageUrl(url: string): string {
    const imgRegex = /https:\/\/musicmeta-phinf\.pstatic\.net\/[^?]*/
    const match = url.match(imgRegex)
    if (!match) {
        return url;
    }
    return match[0];
}

function formatNaverDate(date: string): string {
    return date.split(".").join("-");
}

function formatNaverTrackDuration(duration: string): number {
    const segments = duration.split(":");
    let ms = 0;
    if (segments.length == 2) {
        ms += Number(segments[0]) * 60 * 1000;
        ms += Number(segments[1]) * 1000;
    } else if (segments.length == 1){
        ms += Number(segments[1]) * 1000;
    }
    return ms;
}

async function searchByArtistName(query): Promise<NaverResponse<NaverArtistSearchResult> | null> {
    try {
        const response = await fetch(v4Url + `/search/artist.json?query=${query}&sort=RELEVANCE`)
        if (response.ok) {
            return await response.json() as NaverResponse<NaverArtistSearchResult>
        } else if (response.status == 404) {
            return null
        } else {
            throw new Error(`${response.status} - ${response.statusText}`)
        }
    } catch (error) {
        err.handleError("Error searching by artist name", error)
    }
    return null;
}

function formatArtistSearchData(response: NaverResponse<NaverArtistSearchResult>) {
    return response.response.result.artists || [];
}

function formatArtistObject(artist: NaverArtist): ArtistObject {
    return {
        provider: namespace,
        type: "artist",
        id: String(artist.artistId),
        name: artist.artistName,
        url: createUrl("artist", String(artist.artistId)) || "",
        bannerUrl: null,
        imageUrl: artist.imageUrl ? getFullImageUrl(artist.imageUrl) : null,
        imageUrlSmall: artist.imageUrl || null,
        genres: [artist.genreNames],
        followers: null,
        popularity: null,
        info: "",
        relevance: `${artist.likeCount} Likes`
    }
}

async function getAlbumById(id: string): Promise<NaverAlbumWithTracks | null> {
    try {
        const response = await fetch(apiUrl + `/album/${id}.json`)
        if (response.ok) {
            let album = (await response.json() as NaverResponse<NaverAlbumResult>).response.result.album as NaverAlbumWithTracks;
            const trackResponse = await fetch(apiUrl + `/album/${id}/tracks.json`)
            if (trackResponse.ok) {
                const tracks = (await trackResponse.json() as NaverResponse<NaverAlbumTracksResult>).response.result.tracks;
                album.tracks = tracks;
            }
            return album
        } else if (response.status == 404) {
            return null
        } else {
            throw new Error(`${response.status} - ${response.statusText}`)
        }
    } catch (error) {
        err.handleError("Error searching by artist name", error)
    }
    return null;
}

async function getTrackById(id: string): Promise<NaverTrack | null> {
    try {
        const response = await fetch(apiUrl + `/track/${id}.json`)
        if (response.ok) {
            let track = (await response.json() as NaverResponse<NaverTrackResult>).response.result.track;
            return track
        } else if (response.status == 404) {
            return null
        } else {
            throw new Error(`${response.status} - ${response.statusText}`)
        }
    } catch (error) {
        err.handleError("Error searching by artist name", error)
    }
    return null;
}

async function getArtistById(id: string): Promise<NaverArtist | null> {
    try {
        const response = await fetch(v1Url + `/artist/${id}.json`)
        if (response.ok) {
            let artist = (await response.json() as NaverResponse<NaverArtistResult>).response.result.artist;
            return artist
        } else if (response.status == 404) {
            return null
        } else {
            throw new Error(`${response.status} - ${response.statusText}`)
        }
    } catch (error) {
        err.handleError("Error searching by artist name", error)
    }
    return null;
}

async function getArtistAlbums(id: string, offset: number = 1, limit: number = 9999): Promise<RawAlbumData | null> {
    if (offset <= 0){
        offset = 1
    }
    try {
        const response = await fetch(v1Url + `/artist/${id}/albums.json?display=9999&start=1`)
        if (response.ok) {
            let artistAlbums = (await response.json() as NaverResponse<NaverArtistAlbumsResult>).response.result;
            let albums = artistAlbums.albums
            let albumsIdMap: Map<number, NaverPartialAlbumWithTracks> = new Map();
            albums.forEach((album) => {
                if (albumsIdMap.has(album.albumId)) return;
                albumsIdMap.set(album.albumId, album);
            });
            const trackResponse = await fetch(v1Url + `/artist/${id}/tracks.json?display=9999&start=1`)
            if (response.ok){
                let tracks = (await trackResponse.json() as NaverResponse<NaverArtistTracksResult>).response.result.tracks
                tracks.forEach(track => {
                    const mappedAlbum = albumsIdMap.get(track.album.albumId)
                    if (mappedAlbum){
                        if (!mappedAlbum.tracks) mappedAlbum.tracks = [];
                        mappedAlbum.tracks.push(track)
                        mappedAlbum.tracks.sort((a, b) => a.trackNumber = b.trackNumber)
                        mappedAlbum.trackTotalCount = mappedAlbum.tracks.length;
                    }
                });
            }
            albums = Array.from(albumsIdMap.values());
            return {
                current: 0,
                count: artistAlbums.albumTotalCount,
                next: null,
                albums: albums,
            }
        } else if (response.status == 404) {
            return null
        } else {
            throw new Error(`${response.status} - ${response.statusText}`)
        }
    } catch (error) {
        err.handleError("Error searching by artist name", error)
    }
    return null;
}

function formatAlbumGetData(data: RawAlbumData): RawAlbumData {
    return data;
}

function formatArtistLookupData(artist: NaverArtist): NaverArtist {
    return artist;
}

function formatAlbumObject(album: NaverAlbumWithTracks): AlbumObject {
    return {
        provider: namespace,
        type: "album",
        id: String(album.albumId),
        name: album.albumTitle,
        url: createUrl("album", String(album.albumId)) || "",
        albumArtists: album.artists.map(formatPartialArtistObject),
        artistNames: album.artists.map(artist => artist.artistName),
        releaseDate: formatNaverDate(album.releaseDate),
        trackCount: album.trackTotalCount || null,
        albumType: album.trackTotalCount ? album.trackTotalCount > 1 ? "album" : "single": null,
        upc: null,
        albumTracks: album.tracks?.map(formatTrackObject) || [],
        imageUrl: album.imageUrl ? getFullImageUrl(album.imageUrl) : null,
        imageUrlSmall: album.imageUrl || null
    }
}

function formatPartialArtistObject(artist: NaverPartialArtist): PartialArtistObject {
    return {
        provider: namespace,
        type: "artist",
        id: String(artist.artistId),
        name: artist.artistName,
        url: createUrl("artist", String(artist.artistId)) || "",
        imageUrl: artist.imageUrl ? getFullImageUrl(artist.imageUrl) : null,
        imageUrlSmall: artist.imageUrl || null
    }
}

function formatTrackObject(track: NaverTrack): TrackObject {
    return {
        provider: namespace,
        type: "track",
        id: String(track.trackId),
        name: track.trackTitle,
        url: createUrl("track", String(track.trackId)) || "",
        trackArtists: track.artists.map(formatPartialArtistObject),
        artistNames: track.artists.map(artist => artist.artistName),
        albumName: track.album.albumTitle,
        releaseDate: track.album.releaseDate,
        trackNumber: track.trackNumber,
        duration: formatNaverTrackDuration(track.playTime),
        isrcs: [],
        imageUrl: track.album.imageUrl ? getFullImageUrl(track.album.imageUrl) : null,
        imageUrlSmall: track.album.imageUrl || null
    }
}

function getAlbumUPCs() {
    return [];
}

function getTrackISRCs() {
    return [];
}

const naver: FullProvider = {
    namespace: "naver",
    searchByArtistName: withCache(searchByArtistName, { ttl: 60 * 30, namespace: namespace }),
    getAlbumById: withCache(getAlbumById, { ttl: 60 * 30, namespace: namespace }),
    getTrackById: withCache(getTrackById, { ttl: 60 * 30, namespace: namespace }),
    getArtistById: withCache(getArtistById, { ttl: 60 * 30, namespace: namespace }),
    getArtistAlbums: withCache(getArtistAlbums, { ttl: 60 * 30, namespace: namespace }),
    formatAlbumGetData,
    formatArtistLookupData,
    formatAlbumObject,
    formatPartialArtistObject,
    formatTrackObject,
    formatArtistSearchData,
    formatArtistObject,
    parseUrl,
    createUrl,
    getAlbumUPCs,
    getTrackISRCs
}

export default naver;