import { UrlParser } from "../../types/component-types";
import { ExternalUrlData, ProviderNamespace, UrlData, UrlType } from "../../types/provider-types";
const namespace: ProviderNamespace = "qobuz";

function parseUrl(url: string): UrlData | null {
    const regex = /https:\/\/www.discogs.com\/(label|artist|release|master)\/(\d+)/;
    const match = url.match(regex);
    if (match) {
        const typeMap: Record<string, UrlType | null> = {
            "artist": "artist",
            "release": "album",
            "label": "label"
        }
        if (!typeMap[match[1]]) return null;
        return {
            type: typeMap[match[1]],
            id: match[2],
        };
    }
    return null;
}
function createUrl(type: UrlType, id: string, mbTypes?: number[]): ExternalUrlData  {
    const mbUrlTypes: Record<UrlType, number[]> = {
        "artist": [180],
        "album": [76],
        "track": [],
        "label": [217],
    }
    const urlTypeMap: Record<UrlType, string|null> = {
        "artist": "artist",
        "album": "release",
        "track": null,
        "label": "label"
    }
    if (!urlTypeMap[type]) {
        throw new Error(`Unsupported url type for Discogs: ${type}`);
    }
    return {
        url: `https://www.discogs.com/${urlTypeMap[type]}/${id}`,
        urlInfo: {
            type,
            provider: namespace,
            id
        },
        mbTypes: mbTypes || mbUrlTypes[type] 
    };
}

const discogs: UrlParser = {
    parseUrl,
    createUrl
}

export default discogs;