import { AlbumObject, ArtistObject, Capabilities, FullProvider, PartialArtistObject, PartialProvider, RawAlbumData, TrackObject } from "../../types/provider-types";
import withCache from "../../utils/cache";
import ErrorHandler from "../../utils/errorHandler";
import medium from "../../utils/medium";
import text from "../../utils/text";
import parsers from "../parsers/parsers";
import { youtube_v3, youtube as youtubeAPI } from '@googleapis/youtube'

const namespace = "youtube";

const err = new ErrorHandler(namespace);

const { parseUrl, createUrl } = parsers.getParser(namespace);

let ytApi: null | youtube_v3.Youtube = null;

const youtubeApiKey = process.env.YOUTUBE_API_KEY;

function getYtAPI() {
    if (!ytApi) {
        if (!youtubeApiKey) {
            throw new Error("YOUTUBE_API_KEY must be set in environment variables.");
        }
        ytApi = youtubeAPI({ version: 'v3', auth: youtubeApiKey })
    }
    return ytApi
}

// Garuntees basic metadata exists because the data is useless otherwise
interface YTVideo extends youtube_v3.Schema$Video {
    id: string;
    snippet: YTVideoSnippet
};
interface YTVideoSnippet extends youtube_v3.Schema$VideoSnippet {
    title: string
}
interface YTChannel extends youtube_v3.Schema$Channel {
    id: string;
    snippet: YTChannelSnippet
}
interface YTChannelSnippet extends youtube_v3.Schema$ChannelSnippet {
    title: string
}
interface YTArtistSearchResult extends youtube_v3.Schema$SearchResult {
    snippet: YTSearchSnippet
    id: YTArtistSearchResultID
}
interface YTSearchSnippet extends youtube_v3.Schema$SearchResultSnippet { 
    title: string
}
interface YTArtistSearchResultID extends youtube_v3.Schema$ResourceId {
    channelId: string;
}
interface YTPlaylistItem extends youtube_v3.Schema$PlaylistItem {
    id: string
    snippet: YTPlaylistItemSnippet
}
interface YTPlaylistItemSnippet extends youtube_v3.Schema$PlaylistItemSnippet {
    title: string
}

async function getTrackById(id: string): Promise<YTVideo | null> {
    try {
        const response = await getYtAPI().videos.list({ id: [id], part: ['contentDetails', 'id', 'snippet', 'topicDetails'] })
        if (response.ok) {
            const data = response.data;
            const video = data.items?.[0];
            // Typescript moment
            if (video?.id && video?.snippet && video.snippet.title) {
                return {
                    ...video,
                    id: video.id,
                    snippet: {
                        ...video.snippet,
                        title: video.snippet.title
                    }
                }
            }
            return null;
        } else {
            throw new Error(`${response.status}`)
        }
    } catch (error) {
        err.handleError("Error fetching video by ID:", error);
    }
    return null;
}

async function getAlbumById(id: string): Promise<YTVideo | null> {
    return getTrackById(id);
}

function getThumbnailURL(thumbnails: youtube_v3.Schema$ThumbnailDetails | null | undefined, small = false) {
    if (!thumbnails) {
        return null;
    }
    if (small) {
        return thumbnails.standard?.url ?? null;
    }
    return thumbnails.default?.url?.replace(/https:\/\/i.ytimg.com\/vi\/([^\/]+)\/.+/, 'https://i.ytimg.com/vi/$1/oardefault.jpg') ?? null;
}

function parseWikiUrls(urls: string[] | null | undefined): string[] {
    const topics: string[] = [];
    urls?.forEach((url) => {
        const match = url.match(/\/wiki\/([^?#\/]+)/)
        if (match?.[1]) {
            topics.push(match[1].replaceAll('_', ' '));
        }
    })
    return topics;
}

function formatAlbumObject(album: YTVideo | YTPlaylistItem): AlbumObject {
    const video = album as YTVideo | YTPlaylistItem;
    const snippet = video.snippet;
    const artists: PartialArtistObject[] = getPartialArtistsFromSnippet(snippet) ?? [];
    let genres: string[] = [];
    if ("tags" in snippet && "topicDetails" in video) {
        genres = [...snippet.tags ?? [], ...parseWikiUrls(video.topicDetails?.topicCategories)]
    }
    let id = video.id;
    if ("resourceId" in snippet && snippet.resourceId?.videoId) {
        id = snippet.resourceId?.videoId
    }
    const albumObject: AlbumObject = {
        provider: namespace,
        type: "album",
        id: id,
        name: snippet.title,
        url: createUrl("album", id, undefined, undefined, "track"),
        albumArtists: artists,
        artistNames: artists.map((artist) => artist.name),
        releaseDate: snippet.publishedAt ? text.formatDate(snippet.publishedAt) : null,
        trackCount: 1,
        albumType: "single",
        upc: null,
        genres: genres,
        labels: null,
        copyrights: null,
        mediums: medium.convertTrackList([formatTrackObject(album)], 'Digital Media'),
        imageUrl: getThumbnailURL(snippet.thumbnails),
        imageUrlSmall: getThumbnailURL(snippet.thumbnails, true),
        isVideo: true
    }
    return albumObject;
}

function formatTrackObject(track: YTVideo | YTPlaylistItem): TrackObject {
    const video = track as YTVideo | YTPlaylistItem;
    const snippet = video.snippet;
    const artists = getPartialArtistsFromSnippet(snippet) ?? []
    let duration: number | null = null;
    let id = video.id;
    if ("resourceId" in snippet && snippet.resourceId?.videoId) {
        id = snippet.resourceId?.videoId
    }
    if (video.contentDetails && "duration" in video.contentDetails && video.contentDetails?.duration) {
        duration = text.formatDurationMS(video.contentDetails?.duration);
    }
    if (video.contentDetails && "endAt" in video.contentDetails) {
        duration = video.contentDetails.endAt ? Number(video.contentDetails.endAt) * 1000 : null;
    }
    const TrackObject: TrackObject = {
        provider: namespace,
        type: "track",
        id: id,
        name: snippet.title,
        albumName: snippet.title,
        url: createUrl("track", id, undefined, undefined, "track"),
        trackArtists: artists,
        artistNames: artists.map((artist) => artist.name),
        releaseDate: snippet.publishedAt ? text.formatDate(snippet.publishedAt) : null,
        trackNumber: 1,
        isrcs: [],
        imageUrl: getThumbnailURL(snippet.thumbnails),
        imageUrlSmall: getThumbnailURL(snippet.thumbnails, true),
        duration: duration,
        isVideo: true
    }
    return TrackObject;
}

function getPartialArtistsFromSnippet(snippet: YTVideoSnippet): PartialArtistObject[] | null {
    if (snippet.channelId && snippet.channelTitle) {
        return [{
            id: snippet.channelId,
            name: snippet.channelTitle,
            url: createUrl('artist', snippet.channelId),
            type: 'partialArtist',
            provider: namespace,
            imageUrl: null,
            imageUrlSmall: null
        }]
    }
    return null
}


async function getArtistById(id: string): Promise<YTChannel | null> {
    try {
        const response = await getYtAPI().channels.list({ id: [id], part: ['contentDetails', 'id', 'snippet', 'topicDetails', 'brandingSettings', 'topicDetails', 'statistics'] })
        if (response.ok) {
            const data = response.data;
            const channel = data.items?.[0];
            // Typescript moment
            if (channel?.id && channel?.snippet && channel.snippet.title) {
                return {
                    ...channel,
                    id: channel.id,
                    snippet: {
                        ...channel.snippet,
                        title: channel.snippet.title
                    }
                }
            }
            return null;
        } else {
            throw new Error(`${response.status}`)
        }
    } catch (error) {
        err.handleError("Error fetching video by ID:", error);
    }
    return null;
}

function formatArtistLookupData(artist: YTChannel): YTChannel {
    return artist;
}

function getChannelImage(url: string | null | undefined, small = false): string | null {
    if (!url) return null;
    if (small) return url.replace(/https:\/\/yt3\.ggpht\.com\/([^=]+).+/, 'https://yt3.googleusercontent.com/$1=s160-c-k-c0x00ffffff-no-rj');
    return url.replace(/(?:(?:=|%3D)[^\/?]*)?(\?.*)?$/, '=s0$1') + '?imgmax=0';
}

function formatArtistObject(artist: YTChannel | YTArtistSearchResult): ArtistObject {
    if (artist.kind == "youtube#channel") {
        const channel = artist as YTChannel;
        const snippet = channel.snippet;
        const banners = channel.brandingSettings?.image;
        const thumbnails = channel.snippet.thumbnails
        const artistObject: ArtistObject = {
            name: snippet.title,
            id: channel.id,
            type: 'artist',
            provider: namespace,
            info: snippet.description ?? '',
            relevance: channel.statistics?.subscriberCount ? `${channel.statistics?.subscriberCount} Subscribers` : '',
            followers: Number(channel.statistics?.subscriberCount) ?? null,
            popularity: null,
            bannerUrl: getChannelImage(banners?.bannerImageUrl ?? banners?.bannerTvImageUrl),
            imageUrl: getChannelImage(thumbnails?.maxres?.url ?? thumbnails?.default?.url),
            imageUrlSmall: getChannelImage(thumbnails?.default?.url, true),
            genres: [...channel.brandingSettings?.channel?.keywords?.split(",") ?? [], ...parseWikiUrls(channel.topicDetails?.topicCategories)],
            url: createUrl('artist', channel.id)
        }
        return artistObject;
    } else {
        const channel = artist as YTArtistSearchResult;
        const snippet = channel.snippet;
        const thumbnails = channel.snippet.thumbnails
        const artistObject: ArtistObject = {
            name: snippet.title,
            id: channel.id.channelId,
            type: 'artist',
            provider: namespace,
            info: snippet.description ?? '',
            relevance: '',
            followers: null,
            popularity: null,
            bannerUrl: null,
            imageUrl: getChannelImage(thumbnails?.maxres?.url ?? thumbnails?.default?.url),
            imageUrlSmall: getChannelImage(thumbnails?.default?.url, true),
            genres: null,
            url: createUrl('artist', channel.id.channelId)
        }
        return artistObject;
    }
}

async function searchByArtistName(query: string): Promise<youtube_v3.Schema$SearchListResponse | null> {
    try {
        const response = await getYtAPI().search.list({ part: ['snippet'], q: query, type: ['channel'], maxResults: 20 });
        if (response.ok) {
            return response.data ?? null;
        } else {
            throw new Error(`${response.status}`)
        }
    } catch (error) {
        err.handleError("Error fetching video by ID:", error);
    }
    return null;
}

function formatArtistSearchData(rawData: youtube_v3.Schema$SearchListResponse): YTArtistSearchResult[] {
    const items = rawData.items;
    let results: YTArtistSearchResult[] = [];
    items?.forEach((item) => {
        if (item.snippet?.title && item.id?.channelId) {
            results.push({
                ...item,
                snippet: {
                    ...item.snippet,
                    title: item.snippet.title
                },
                id: {
                    ...item.id,
                    channelId: item.id.channelId
                }
            })
        }
    })
    return results;
}

async function getArtistAlbums(channelId: string, offset: string | undefined, limit = 50): Promise<youtube_v3.Schema$PlaylistItemListResponse | null> {
    if (limit > 50) limit = 50;
    if (String(offset) == "0") offset= undefined;
    try {
        const response = await getYtAPI().playlistItems.list({
            part: ['snippet', 'contentDetails'],
            //https://wiki.archiveteam.org/index.php/YouTube/Technical_details#ID_formats
            playlistId: channelId.replace(/UC([A-Za-z0-9_-]{21}[AQgw])/, 'UU$1'),
            maxResults: limit,
            pageToken: offset
        });

        return response.data;
    } catch (error) {
        console.error("Error fetching videos:", error);
        throw error;
    }
}

function formatAlbumGetData(rawData: youtube_v3.Schema$PlaylistItemListResponse): RawAlbumData {
    let albums: YTPlaylistItem[] = [];
    rawData.items?.forEach((video) => {
        if (video.id && video.snippet?.title){
            albums.push({
                    ...video,
                    id: video.id,
                    snippet: {
                        ...video.snippet,
                        title: video.snippet.title
                    }
                }
            )
        }
    })
    return {
        count: rawData.pageInfo?.totalResults ?? null,
        next: rawData.nextPageToken ?? null,
        current: rawData.pageInfo?.resultsPerPage ?? null,
        albums: rawData.items ?? [],
    };
}

const capabilities: Capabilities = {
    isrcs: {
        availability: "never",
        presence: "never"
    },
    upcs: {
        availability: "never",
        presence: "never"
    }
}

const youtube: PartialProvider = {
    namespace,
    config: { capabilities },
    getArtistById: withCache(getArtistById, { ttl: 60 * 30, namespace: namespace }),
    searchByArtistName: withCache(searchByArtistName, { ttl: 60 * 30, namespace: namespace }),
    getArtistAlbums: withCache(getArtistAlbums, { ttl: 60 * 30, namespace: namespace }),
    // getAlbumByUPC: withCache(getAlbumByUPC, { ttl: 60 * 30, namespace: namespace }),
    // getTrackByISRC: withCache(getTrackByISRC, { ttl: 60 * 30, namespace: namespace }),
    getAlbumById: withCache(getAlbumById, { ttl: 60 * 30, namespace: namespace }),
    getTrackById: withCache(getTrackById, { ttl: 60 * 30, namespace: namespace }),
    formatArtistSearchData,
    // formatPartialArtistObject,
    formatArtistLookupData,
    formatTrackObject,
    formatArtistObject,
    formatAlbumGetData,
    formatAlbumObject,
    parseUrl,
    createUrl
};

export default youtube;
