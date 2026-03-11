import { create } from "node:domain";
import { ExternalUrlData, ProviderNamespace, UrlData, UrlType } from "../../types/provider-types";
import { UrlParser } from "../../types/component-types";
const namespace: ProviderNamespace = "musicbrainz"
function parseUrl(url: string): UrlData | null {
    const regex = /musicbrainz\.org\/([a-z\-]+)\/([0-9a-fA-F\-]{36})/;
    const match = url.match(regex);
    if (match) {
        const typeDict: {[x: string]: UrlType} = { 'release': 'album', 'recording': 'track', 'artist': 'artist' };
        return {
            type: typeDict[match[1]],
            id: match[2],
        };
    }
    return null;
}

function createUrl(type: UrlType, id: string, mbTypes?: number[]): ExternalUrlData {
    const typeDict: Record<UrlType, string> = { 'album': 'release', 'track': 'recording', 'artist': 'artist' };
    return {
        url: `https://musicbrainz.org/${typeDict[type]}/${id}`,
        urlInfo: {
            type,
            provider: namespace,
            id
        },
        mbTypes: mbTypes || []
    };
}

const musicbrainz: UrlParser = {
    parseUrl,
    createUrl
}

export default musicbrainz;
