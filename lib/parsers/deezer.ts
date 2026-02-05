import { UrlParser } from "../../types/component-types";
import { UrlData, UrlType } from "../../types/provider-types";


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

function createUrl(type: UrlType, id: string) {
    return `https://www.deezer.com/${type}/${id}`;
}

const deezer: UrlParser = {
    parseUrl, 
    createUrl
}

export default deezer;
