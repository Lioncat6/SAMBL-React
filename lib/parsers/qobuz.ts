import { UrlParser } from "../../types/component-types";
import { ExternalUrlData, ProviderNamespace, UrlData, UrlType } from "../../types/provider-types";
const namespace: ProviderNamespace = "qobuz";

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

function createUrl(type: UrlType, id: string, mbTypes?: number[]): ExternalUrlData {
    const mbUrlTypes: Record<UrlType, number[]> = {
        "artist": [176, 978],
        "album": [980, 74],
        "track": [254, 979]
    }
    return {
        url: `https://open.qobuz.com/${type}/${id}`,
        urlInfo: {
            type,
            provider: namespace,
            id
        },
        mbTypes: mbTypes || mbUrlTypes[type] 
    };
}

const qobuz: UrlParser = {
    parseUrl,
    createUrl
}

export default qobuz;