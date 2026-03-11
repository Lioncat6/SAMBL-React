import { UrlParser } from "../../types/component-types";
import { ExternalUrlData, ProviderNamespace, UrlData, UrlType } from "../../types/provider-types";
const namespace: ProviderNamespace = "applemusic";
function parseUrl(url: string): UrlData | null {
    const match = url.match(/music\.apple\.com\/.+?\/(?<type>artist|album|song)(\/(.+?))?\/(?<id>\d+)/);
    if (!match?.groups) return null;

    let type: "artist" | "album" | "track" | null = null;
    switch (match.groups["type"]) {
        case "artist":
            type = "artist";
            break;
        case "album":
            type = "album";
            break;
        case "song":
            type = "track";
            break;
    }

    return {
        type,
        id: match.groups["id"],
    };
}

function createUrl(type: UrlType, id: string, mbTypes?: number[], country: string = "us"): ExternalUrlData {
    const typeDict: Record<UrlType, string> = { 'album': 'album', 'track': 'song', 'artist': 'artist' };
    const mbUrlTypes: Record<UrlType, number[]> = {
        "artist": [176, 978],
        "album": [980, 74],
        "track": [254, 979]
    }
    return {
        url: `https://music.apple.com/${country}/${typeDict[type]}/${id}`,
        urlInfo: {
            type,
            provider: namespace,
            id
        },
        mbTypes: mbTypes || mbUrlTypes[type] 
    };
}

const applemusic: UrlParser = {
    parseUrl, 
    createUrl
}

export default applemusic;