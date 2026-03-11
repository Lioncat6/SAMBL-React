import { UrlParser } from "../../types/component-types";
import { ExternalUrlData, ProviderNamespace, UrlData, UrlType } from "../../types/provider-types";
const namespace: ProviderNamespace = "bandcamp";
function createUrl(type: UrlType, id: string, mbTypes?: number[]): ExternalUrlData {
    const mbUrlTypes: Record<UrlType, number[]> = {
        "artist": [718],
        "album": [85, 74],
        "track": [254, 268]
    }
    const baseUrl = "bandcamp.com";
    const idArray = id.split("/");
    let url = `https://${idArray[0]}.bandcamp.com/${idArray[1]}/${idArray[2]}`
    if (type == "artist"){
        url = `https://${id}.bandcamp.com/`
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
        /^https?:\/\/([^.]+)\.bandcamp\.com\/(track|album)\/([^.]+)/;
    const musicMatch = url.match(musicRegex);
    if (musicMatch) {
        return {
            type: musicMatch[2] as UrlType,  //TODO: improve type safety here
            id: `${musicMatch[1]}/${musicMatch[2]}/${musicMatch[3]}`,
        };
    }
    const artistRegex = /^https?:\/\/([^.]+)\.bandcamp\.com/;
    const artistMatch = url.match(artistRegex);
    if (artistMatch) {
        return {
            type: "artist",
            id: artistMatch[1],
        };
    }
    return null;
}

const bandcamp: UrlParser = {
    parseUrl, 
    createUrl
}

export default bandcamp;