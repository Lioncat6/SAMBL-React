import type { ArtistObject, AlbumObject, TrackObject, AlbumData, PartialArtistObject, FullProvider, RawAlbumData, Capabilities, LabelObject } from "../../types/provider-types";
import logger from "../../utils/logger";
import text from "../../utils/text";
import withCache from "../../utils/cache";
import ErrorHandler from "../../utils/errorHandler";
import parsers from "../parsers/parsers";
const namespace = "subvert";

const err = new ErrorHandler(namespace);
import { CurlMultiImpl, CurlSession, req } from 'curl-cffi';
import { SubvertAlbum, SubvertAlbumArtist, SubvertAlbumTrack, SubvertAlbumTrackPosition, SubvertArtistProfile, SubvertLabelOnRelease, SubvertSearchAlbumTrack, SubvertSearchAlbumTrackPosition, SubvertSearchResult, SubvertSearchResults } from "./lib/subvert-types";
import { AlbumIssues } from "../issues";

const { parseUrl, createUrl } = parsers.getParser(namespace);

const reqSession=new CurlSession({impl:new CurlMultiImpl()})

async function subvertFetch(path: string, body?: {}): Promise<unknown | null> {
    const apiBaseUrl = 'https://www.subvert.fm/api/';
    const url = `${apiBaseUrl}${path}`;
    if (body) {
        const response = await reqSession.post(url,
            body,
            {
                'method': 'POST',
                'impersonate': 'chrome142',
                'headers': {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0",
                    "Accept": "*/*",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Content-Type": "application/json",
                    "Sec-GPC": "1",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-origin",
                    "Priority": "u=4",
                    "Host": 'www.subvert.fm',
                    "Origin": "https://www.subvert.fm"
                },
                'cors': true,
                'referer': 'https://www.subvert.fm/discover',
                'timeout': 20000
            }
        )
        if (response.status == 200) {
            return response.data;
        } else if (response.status == 404) {
            return null;
        } else {
            err.handleError(`Subvert fetch failed: ${response.status} - ${response.text}`);
        }
    } else {
        const response = await reqSession.get(url,
            {
                'method': 'GET',
                'impersonate': 'chrome142',
                'headers': {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0",
                    "Accept": "*/*",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Content-Type": "application/json",
                    "Sec-GPC": "1",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-origin",
                    "Priority": "u=4",
                    "Host": 'www.subvert.fm',
                    "Origin": "https://www.subvert.fm"
                },
                'cors': true,
                'referer': 'https://www.subvert.fm/discover',
                'timeout': 20000
            }
        )
        if (response.status == 200) {
            return response.data;
        } else if (response.status == 404) {
            return null;
        } else {
            err.handleError(`Subvert fetch failed: ${response.status} - ${response.text}`);
        }
    }
}

async function resolveSlug(slug: string, type: 'artist'|'album'|'track'): Promise<string | null> {
    let url = `https://www.subvert.fm/${slug.replace(":", "/")}`;
    if (type == 'track') {
        const chunks = slug.split(':');
        url = `https://www.subvert.fm/${chunks[0]}/tracks/${chunks[2]}`;
    }
    console.log(url)
    const response = await reqSession.get(url,
        {
            'method': 'GET',
            'impersonate': 'chrome142',
            'headers': {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0",
                "Accept": "*/*",
                "Accept-Language": "en-US,en;q=0.9",
                "Content-Type": "application/json",
                "Sec-GPC": "1",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin",
                "Priority": "u=4",
                "Host": 'www.subvert.fm',
                "Origin": "https://www.subvert.fm"
            },
            'cors': true,
            'referer': 'https://www.subvert.fm/discover',
            'timeout': 20000
        }
    )
    if (response.status == 200){
        const idRegex = /{"pageProps":[^}]+"id":"([\w]+)"/
        const match = idRegex.exec(response.data);
        if (match){
            return match[1];
        } else {
            err.handleError(`Failed to locate ID in page HTML`);
        }
    }  else if (response.status == 404) {
        return null;
    } else {
        err.handleError(`Failed to resolve slug: ${response.status} - ${response.text}`);
    }
    return null;
}

const cachedResolvedSlug = withCache(resolveSlug, {namespace, ttl: 60 * 120})

async function searchByArtistName(query: string): Promise<any | null> {
    try {
        const data = await subvertFetch('discover/search', { "mode": "fuzzy", "domains": ["artist"], "limit": 20, "query": query });
        if (data && typeof data == "object" && "results" in data) {
            return data as SubvertSearchResults
        }
    } catch (error) {
        err.handleError("Failed to search by artist name", error)
    }
    return null;
}

function formatArtistSearchData(rawData: SubvertSearchResults): SubvertSearchResult[] {
    return rawData.results;
}

async function getArtistById(id: string): Promise<SubvertArtistProfile | null> {
    try {
        if (id.includes(":") || id.length != 25){
            const resolvedId = await cachedResolvedSlug(id, 'artist');
            if (resolvedId){
                id = resolvedId;
            }
        }
        const data = await subvertFetch(`artist/${id}`);
        if (data && typeof data == "object"){
            return data as SubvertArtistProfile;
        }
    } catch (error) {
        err.handleError("Failed to fetch artist by ID", error)
    }
    return null;
}

function formatArtistLookupData(rawData: SubvertArtistProfile): SubvertArtistProfile {
    return rawData;
}

function createSubvertImage(id?: string, small: boolean = false): string | null {
    if (!id) return null;
    return `https://images.subvert.fm/${id}${small ? '-300h' : ''}` //can be -300h or -600h
}


function formatArtistObject(rawData: SubvertSearchResult | SubvertArtistProfile): ArtistObject {
    if ("matchReason" in rawData) {
        const artist = rawData as SubvertSearchResult
        return {
            id: artist.id,
            type: 'artist',
            name: artist.name,
            url: createUrl('artist', artist.slug),
            provider: namespace,
            relevance: artist.subtitle,
            imageUrl: createSubvertImage(artist.imageId),
            imageUrlSmall: createSubvertImage(artist.imageId, true),
            bannerUrl: null,
            info: artist.metadata.genres?.join(", ") || '',
            genres: artist.metadata.genres || null,
            followers: null,
            popularity: null
        }
    } else {
        const artist = rawData as SubvertArtistProfile;
        return {
            id: artist.id,
            type: 'artist',
            name: artist.name,
            url: createUrl('artist', artist.slug),
            provider: namespace,
            relevance: '',
            info: '',
            followers: null,
            popularity: null,
            genres: artist.genres || [],
            imageUrl: createSubvertImage(artist.profileImageId),
            imageUrlSmall: createSubvertImage(artist.profileImageId, true),
            bannerUrl: createSubvertImage(artist.bannerImageId)
        }
    }
}

interface SubvertSearchResultWithArtist extends SubvertSearchResult {
    artist?: SubvertArtistProfile;
}

interface SubvertSearchResultsWithArtist extends SubvertSearchResults {
    results: SubvertSearchResultWithArtist[]
}

async function getArtistAlbums(id: string, offset: number = 0, limit: number = 100): Promise<SubvertSearchResultsWithArtist | null> {
    try {
        const rawArtist = await subvert.getArtistById(id);
        if (rawArtist) {
            const typedRawArtist = rawArtist as SubvertArtistProfile;
            const artist = subvert.formatArtistObject(rawArtist);
            const data = await subvertFetch('discover/search', { "mode": "fuzzy", "domains": ["release"], "limit": limit, "offset": offset, "query": artist.name });
            if (data && typeof data == "object" && "results" in data) {
                let rawdata = data as SubvertSearchResultsWithArtist;
                const filteredResults = rawdata.results.filter(result => result.artistSlug == typedRawArtist.slug);
                filteredResults.forEach(result => { result.artist = rawArtist });
                rawdata.results = filteredResults;
                return rawdata;
            }
        }
    } catch (error) {
        err.handleError("Failed to fetch artist albums", error)
    }
    return null;
}

function formatAlbumGetData(rawData: SubvertSearchResults): RawAlbumData {
    return {
        albums: rawData.results,
        count: rawData.meta.totalCount,
        current: rawData.meta.offset,
        next: rawData.meta.hasMore ? String(Number(rawData.meta.offset + rawData.results.length)) : null 
    }
}

async function getAlbumById(id: string): Promise<SubvertAlbum | null> {
    try {
        if (id.includes(":")){
            const resolvedId = await cachedResolvedSlug(id, 'album');
            if (resolvedId){
                id = resolvedId
            }
        }
        const data = await subvertFetch(`release/${id}`);
        if (data && typeof data == "object" &&  "slug" in data) {
            return data as SubvertAlbum;
        }
    } catch (error) {
        err.handleError("Failed to fetch album by id", error)
    }
    return null;
}

function formatAlbumObject(rawData: SubvertSearchResultWithArtist | SubvertAlbum): AlbumObject {
    if ("metadata" in rawData) {
        const album = rawData as SubvertSearchResultWithArtist;
        const tracks = album.metadata.tracks ? (album.metadata.tracks as SubvertSearchAlbumTrackWithArtistPosition[])?.map((track) => track.track.artist = album.artist) : []
        return {
            id: album.id,
            provider: namespace,
            type: 'album',
            name: album.name,
            url: createUrl('album', `${album.artistSlug}/${album.slug}`),
            imageUrl: createSubvertImage(album.imageId),
            imageUrlSmall: createSubvertImage(album.imageId, true),
            releaseDate: album.metadata.releaseDate ? text.formatDate(album.metadata.releaseDate) : null,
            albumArtists: album.artist ? [formatPartialArtistObject(album.artist)] : [],
            artistNames: album.artist?.name ? [album.artist?.name] : [],
            trackCount: album.metadata.trackCount || album.metadata.tracks?.length || null,
            upc: null,
            albumType: album.metadata.releaseType || null,
            albumTracks: album.metadata.tracks?.map(formatTrackObject) || [],
            labels: null,
            copyrights: null,
            genres: album.metadata.genres || null
        }
    } else {
        const album = rawData as SubvertAlbum;
        return {
            id: album.id,
            provider: namespace,
            type: 'album',
            name: album.name,
            url: createUrl('album', `${album.artists[0].slug}/${album.slug}`),
            imageUrl: createSubvertImage(album.coverImageId),
            imageUrlSmall: createSubvertImage(album.coverImageId, true),
            releaseDate: text.formatDate(album.releaseDate),
            albumType: album.releaseType,
            upc: album.productIdUpcEan || null,
            labels: album.labelsOnReleases.map(formatLabelObject),
            copyrights: album.license ? [album.license]: null,
            genres: album.genres,
            albumArtists: album.artists.map(formatPartialArtistObject),
            artistNames: album.artists.map((artist) => artist.name),
            trackCount: album.tracks.length,
            albumTracks: album.tracks.map(formatTrackObject)
        }
    }
}

function formatLabelObject(rawData: SubvertLabelOnRelease): LabelObject {
    return {
        id: rawData.label.id,
        type: 'label',
        provider: namespace,
        name: rawData.label.name,
        url: null
    }
}

interface SubvertSearchAlbumTrackWithArtistPosition extends SubvertSearchAlbumTrackPosition {
    track: SubvertSearchAlbumTrackWithArtist
}

interface SubvertSearchAlbumTrackWithArtist extends SubvertSearchAlbumTrack {
    artist?: SubvertArtistProfile
}

interface SubvertAlbumTrackWithArtistPosition extends SubvertAlbumTrackPosition {
    track: SubvertAlbumTrackWithArtist
}

interface SubvertAlbumTrackWithArtist extends SubvertAlbumTrack {
    artist?: SubvertArtistProfile
}

function formatTrackObject(rawData: SubvertSearchAlbumTrackWithArtistPosition | SubvertAlbumTrackWithArtistPosition): TrackObject {
    if ("trackNumber" in rawData){
        if ("isrc" in rawData){
            const trackPosition = rawData as SubvertAlbumTrackWithArtistPosition;
            const track = trackPosition.track;
            return {
                provider: namespace,
                id: track.id,
                name: track.name,
                url: createUrl('track', `${track.artist?.slug}/${track.slug}`),
                duration: track.duration ? track.duration * 1000: null,
                albumName: null,
                releaseDate: text.formatDate(track.releaseDate),
                trackArtists: track.artist ? [formatPartialArtistObject(track.artist)] : [],
                artistNames: track.artist ? [formatPartialArtistObject(track.artist).name] : [],
                isrcs: (track.isrc && track.isrc != '') ? [track.isrc] : [],
                type: 'track',
                trackNumber: trackPosition.trackNumber,
                imageUrl: createSubvertImage(track.coverImageId),
                imageUrlSmall: createSubvertImage(track.coverImageId, true)
            }
        } else {
            const trackPosition = rawData as SubvertSearchAlbumTrackWithArtistPosition;
            const track = trackPosition.track;
            return {
                provider: namespace,
                id: track.id,
                name: track.name,
                url: createUrl('track', `${track.artist?.slug}/${track.slug}`),
                duration: track.duration ? track.duration * 1000: null,
                trackArtists: track.artist ? [formatPartialArtistObject(track.artist)] : [],
                albumName: null,
                releaseDate: null,
                artistNames: track.artist ? [formatPartialArtistObject(track.artist).name] : [],
                trackNumber: trackPosition.trackNumber,
                isrcs: [],
                type: 'track',
                imageUrl: createSubvertImage(track.coverImageId),
                imageUrlSmall: createSubvertImage(track.coverImageId, true)
            }
        }
    } else {
        const track = rawData
        return {

        }
    }
}

function formatPartialArtistObject(rawData: SubvertArtistProfile | SubvertAlbumArtist): PartialArtistObject {
    if ("description" in rawData){
        const artist = rawData as SubvertArtistProfile;
        return {
            type: 'partialArtist',
            provider: namespace,
            id: artist.id,
            name: artist.name,
            url: createUrl('artist', artist.slug),
            imageUrl: createSubvertImage(artist.profileImageId),
            imageUrlSmall: createSubvertImage(artist.profileImageId, true)
        }
    } else {
        const artist = rawData as SubvertAlbumArtist;
        return {
            type: 'partialArtist',
            provider: namespace,
            id: artist.id,
            name: artist.name,
            url: createUrl('artist', artist.slug),
            imageUrl: createSubvertImage(artist.profileImageId),
            imageUrlSmall: createSubvertImage(artist.profileImageId, true)
        }
    }
}

async function getTrackById(id: string): Promise<null> {

}

const capabilities: Capabilities = {
    isrcs: {
        availability: "sometimes",
        presence: "onAlbumRefresh"
    },
    upcs: {
        availability: "sometimes",
        presence: "onAlbumRefresh"
    }
}

const subvert: FullProvider = {
    namespace,
    config: { capabilities },
    // getTrackByISRC: withCache(getTrackByISRC, { ttl: 60 * 30, namespace: namespace }),
    // getAlbumByUPC: withCache(getAlbumByUPC, { ttl: 60 * 30, namespace: namespace }),
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

export default subvert;
