import { UrlParser } from "../../types/component-types";
import { ExternalUrlData, ProviderNamespace, UrlData, UrlType } from "../../types/provider-types";
const namespace: ProviderNamespace = "subvert";
function createUrl(type: UrlType, id: string, mbTypes?: number[]): ExternalUrlData {
    const mbUrlTypes: Record<UrlType, number[]> = {
        "artist": [176, 194],
        "album": [85, 74],
        "track": [254, 268],
        "label": []
    }
    const idArray = id.split("/");
    let url = `https://www.subvert.fm/${idArray[0]}/${type == 'track' ? 'tracks/': ''}${idArray[1]}`
    if (type == "artist" || type == "label") {
        url = `https://www.subvert.fm/${id}`
    }
    return {
        url,
        urlInfo: {
            provider: namespace,
            type,
            id
        },
        mbTypes: mbTypes || mbUrlTypes[type]
    }
}

function parseUrl(url: string): UrlData | null {
    const musicRegex =
        /www\.subvert\.fm\/([\w-]+)(?:\/)?(tracks)?(?:\/)([\w-]+)?/;
    const musicMatch = url.match(musicRegex);
    if (musicMatch) {
        if (musicMatch.length == 2) {
            return {
                type: 'artist',
                id: musicMatch[1]
            }
        } else if (musicMatch.length == 3) {
            return {
                type: 'album',
                id: `${musicMatch[1]}/${musicMatch[2]}`
            }
        } if (musicMatch.length == 4) {
            return {
                type: 'track',
                id: `${musicMatch[1]}/${musicMatch[3]}`
            }
        }
    }
    return null;
}

const subvert: UrlParser = {
    parseUrl, 
    createUrl
}

export default subvert;