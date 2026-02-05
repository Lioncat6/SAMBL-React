import { UrlParser } from "../../types/component-types";
import { UrlData, UrlType } from "../../types/provider-types";

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

function createUrl(urlType: UrlType, providerId: string, country: string = "us"): string | null {
    switch (urlType) {
        case "artist":
            return `https://music.apple.com/${country}/artist/${providerId}`;
        case "album":
            return `https://music.apple.com/${country}/album/${providerId}`;
        case "track":
            return `https://music.apple.com/${country}/song/${providerId}`;
        default:
            return null;
    }
}

const applemusic: UrlParser = {
    parseUrl, 
    createUrl
}

export default applemusic;