import { UrlParser } from "../../types/component-types";
import { ExternalUrlData, ProviderNamespace, UrlData, UrlType } from "../../types/provider-types";
const namespace: ProviderNamespace ="youtube";

function parseUrl(url: string): UrlData | null {
    // https://wiki.archiveteam.org/index.php/YouTube/Technical_details
    const videoRegex = /(?:www\.)?youtube\.com\/watch\?v=([A-Za-z0-9_-]{10}[AEIMQUYcgkosw048])/
    const albumRegex = /(?:www\.)?youtube\.com\/playlist\?list=(OLAK5uy_[klmn][A-Za-z0-9_-]{32})/
    const playlistRegex = /(?:www\.)?youtube\.com\/playlist\?list=(PL[0-9A-F]{16}|PL[A-Za-z0-9_-]{32})/
    const channelIdRegex = /(?:www\.)?youtube\.com\/channel\/(UC[A-Za-z0-9_-]{21}[AQgw])/
    const channelNameRegex = /(?:www\.)?youtube\.com\/(?:c\/|@)?([^\/?#\s]+)/
    const videoMatch = url.match(videoRegex);
    const albumMatch = url.match(albumRegex);
    const playlistMatch = url.match(playlistRegex);
    const channelIdMatch = url.match(channelIdRegex);
    const channelNameMatch = url.match(channelNameRegex);
    if (videoMatch) {
        return {
            type: "track",
            id: videoMatch[1]
        }
    } 
    if (albumMatch) {
         return null; // This is a youtube music release; Should be ignored
    }
    if (playlistMatch) {
        return {
            type: "album",
            id: playlistMatch[1]
        }
    }
    if (channelIdMatch) {
        return {
            type: "artist",
            id: channelIdMatch[1]
        }
    }
    if (channelNameMatch) {
        return {
            type: "artist",
            id: `@${channelNameMatch[1]}`
        }
    }
    return null;
}

function createUrl(type: UrlType, id: string, mbTypes?: number[], sourceType?: UrlType): ExternalUrlData {
    const mbUrlTypes: Record<UrlType, number[]> = {
        "artist": [193],
        "album": [85],
        "track": [268],
        "label": [225]
    }
    const videoIdRegex = /[A-Za-z0-9_-]{10}[AEIMQUYcgkosw048]/
    let path = "watch?v="
    if (type == "album" && !id.match(videoIdRegex) && sourceType != "track") {
        path = "playlist?list="
    }
    if (type == "artist" || type == "label") {
        path = "channel/"
    }
    return {
        url: `https://www.youtube.com/${path}${id}`,
        urlInfo: {
            type,
            provider: namespace,
            id
        },
        mbTypes: mbTypes || mbUrlTypes[type],
        isVideo: sourceType == "track"
    };
}

const youtube: UrlParser = {
    parseUrl,
    createUrl
}

export default youtube;