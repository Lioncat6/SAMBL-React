import { UrlParser } from "../../types/component-types";

function parseUrl(url) {
    const regex = /(?:www\.)?open\.spotify\.com\/(artist|track|album)\/([A-Za-z0-9]{22})/;
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
    return `https://open.spotify.com/${type}/${id}`;
}


const spotify: UrlParser = {
    parseUrl,
    createUrl
}

export default spotify;