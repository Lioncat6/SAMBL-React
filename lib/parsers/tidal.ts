import { UrlParser } from "../../types/component-types";
import { ExternalUrlData, ProviderNamespace, UrlData, UrlType } from "../../types/provider-types";
const namespace: ProviderNamespace ="tidal";

function parseUrl(url: string): UrlData | null {
    const regex = /(?:www\.)?tidal\.com\/(artist|track|album)\/(\d+)/;
    const match = url.match(regex);
    if (match) {
        return {
            type: match[1] as UrlType, //TODO: improve typing
            id: match[2],
        };
    }
    return null;
}

function createUrl(type: UrlType, id: string, mbTypes?: number[]): ExternalUrlData {
    const mbUrlTypes: Record<UrlType, number[]> = {
        "artist": [978],
        "album": [980],
        "track": [979]
    }
    return {
        url: `https://tidal.com/${type}/${id}`,
        urlInfo: {
            type,
            provider: namespace,
            id
        },
        mbTypes: mbTypes || mbUrlTypes[type] 
    };
}

const tidal: UrlParser = {
    parseUrl,
    createUrl
}

export default tidal;