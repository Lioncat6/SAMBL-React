import { create } from "node:domain";
import { UrlData, UrlType } from "../../types/provider-types";
import { UrlParser } from "../../types/component-types";

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

function createUrl(type: UrlType, id: string): string {
    const typeDict: Record<UrlType, string> = { 'album': 'release', 'track': 'recording', 'artist': 'artist' };
    return `https://musicbrainz.org/${typeDict[type]}/${id}`;
}

const musicbrainz: UrlParser = {
    parseUrl,
    createUrl
}

export default musicbrainz;
