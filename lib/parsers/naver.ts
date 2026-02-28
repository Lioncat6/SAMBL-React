import { UrlParser } from "../../types/component-types";
import { UrlData } from "../../types/provider-types";

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

function createUrl(type, id) {
    return `https://vibe.naver.com/${type}/${id}`;
}


const naver: UrlParser = {
    parseUrl,
    createUrl
}

export default naver;