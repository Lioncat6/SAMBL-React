import { UrlParser } from "../../types/component-types";
import { ExternalUrlData, ProviderNamespace, UrlData, UrlType } from "../../types/provider-types";
const namespace: ProviderNamespace = "volumo";

function parseUrl(url: string): UrlData | null {
    const regex = /volumo\.com\/(?:\w+\/)?(album|track|label|artist)\/(\d+)/;
    const match = url.match(regex);
    if (match) {
        return {
            type: match[1] as UrlType, //TODO: improve type safety here
            id: match[2],
        };
    }
    return null;
}

function createUrl(type: UrlType, id: string, mbTypes?: number[]): ExternalUrlData {
    const mbUrlTypes: Record<UrlType, number[]> = {
        "artist": [176, 978],
        "album": [74, 980],
        "track": [254, 979],
        "label": [959, 1005],
    }
    return {
        url: `https://www.volumo.com/${type}/${id}`,
        urlInfo: {
            type,
            provider: namespace,
            id
        },
        mbTypes: mbTypes || mbUrlTypes[type] 
    };
}

const volumo: UrlParser = {
    parseUrl, 
    createUrl
}

export default volumo;
