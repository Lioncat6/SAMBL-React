import { UrlParser } from "../../types/component-types";
import { UrlData, UrlType } from "../../types/provider-types";

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

function createUrl(type: UrlType, id: string) {
    return `https://tidal.com/${type}/${id}`;
}

const tidal: UrlParser = {
    parseUrl,
    createUrl
}

export default tidal;