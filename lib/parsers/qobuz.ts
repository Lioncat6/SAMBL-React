import { UrlParser } from "../../types/component-types";
import { UrlData } from "../../types/provider-types";

function parseUrl(url): UrlData | null { //https://tickets.metabrainz.org/browse/MBS-13611
    const regex = /play\.qobuz\.com\/(track|album|artist)\/(\d+)/;
    const oldRegex = /(?:www\.)?qobuz\.com\/(?:\w{2}-\w{2}\/)?(track|album|artist|label|interpreter)\/(?:[^\/]+\/)?(?:[^\/]+\/)?([A-Za-z0-9]+)/
    const match = url.match(regex) || url.match(oldRegex);
    if (match) {
        let type = match[1];
        if (type == "interpreter" || type == "label") {
            type == "artist";
        }
        return {
            type: type,
            id: match[2],
        };
    }
    return null;
}

function createUrl(type, id) {
    return `https://open.qobuz.com/${type}/${id}`;
}


const qobuz: UrlParser = {
    parseUrl,
    createUrl
}

export default qobuz;