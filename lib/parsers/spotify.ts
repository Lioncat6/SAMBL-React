import { UrlParser } from "../../types/component-types";
import { ExternalUrlData, ProviderNamespace, UrlType } from "../../types/provider-types";
const namespace: ProviderNamespace = "spotify"

function parseUrl(url) {
    const regex = /(?:www\.)?open\.spotify\.com\/(artist|track|album)\/([A-Za-z0-9]{22})/;
    const match = url.match(regex);
    if (match) {
        return {
            type: match[1],
            id: match[2],
        };
    }
    return null;
}

function createUrl(type: UrlType, id: string, mbTypes?: number[]): ExternalUrlData {
    const mbUrlTypes: Record<UrlType, number[]> = {
        "artist": [194],
        "album": [85],
        "track": [268]
    }
    return {
        url: `https://open.spotify.com/${type}/${id}`,
        urlInfo: {
            type,
            provider: namespace,
            id
        },
        mbTypes: mbTypes || mbUrlTypes[type] 
    };
}

const spotify: UrlParser = {
    parseUrl,
    createUrl
}

export default spotify;