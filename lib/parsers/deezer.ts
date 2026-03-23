import { UrlParser } from "../../types/component-types";
import { ExternalUrlData, ProviderNamespace, UrlData, UrlType } from "../../types/provider-types";
const namespace: ProviderNamespace = "deezer";

function parseUrl(url: string): UrlData | null {
    const regex = /(?:www\.)?deezer\.com\/(?:([a-z]{2})\/)?(artist|track|album)\/(\d+)/;
    const match = url.match(regex);
    if (match) {
        return {
            type: match[2] as UrlType, //TODO: improve type safety here
            id: match[3],
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
        url: `https://www.deezer.com/${type}/${id}`,
        urlInfo: {
            type,
            provider: namespace,
            id
        },
        mbTypes: mbTypes || mbUrlTypes[type] 
    };
}

const deezer: UrlParser = {
    parseUrl, 
    createUrl
}

export default deezer;
