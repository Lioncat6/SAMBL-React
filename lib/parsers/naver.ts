import { UrlParser } from "../../types/component-types";
import { ExternalUrlData, ProviderNamespace, UrlData, UrlType } from "../../types/provider-types";
const namespace: ProviderNamespace = "naver";
function parseUrl(url): UrlData | null {
    const regex = /vibe\.naver\.com\/(track|album|artist)\/(\d+)/;
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
        "artist": [176, 978],
        "album": [980, 74],
        "track": [254, 979],
        label: []
    }
    return {
        url: `https://vibe.naver.com/${type}/${id}`,
        urlInfo: {
            type,
            provider: namespace,
            id
        },
        mbTypes: mbTypes || mbUrlTypes[type] 
    };
}

const naver: UrlParser = {
    parseUrl,
    createUrl
}

export default naver;