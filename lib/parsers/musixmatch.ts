import { UrlParser } from "../../types/component-types";
import { ExternalUrlData, ProviderNamespace, UrlData, UrlType } from "../../types/provider-types";
const namespace: ProviderNamespace = "musixmatch"

function parseUrl(url: string): UrlData | null {
    //TODO: Implement parsing
    return null;
}

function createUrl(type: UrlType, id: string, mbTypes?: number[]): ExternalUrlData {
    //TODO: Implement creation
    return {
        url: id,
        urlInfo: {
            provider: namespace,
            type,
            id
        },
        mbTypes: mbTypes || []
    }
}

const musixmatch: UrlParser = {
    parseUrl,
    createUrl
}

export default musixmatch