import { UrlParser } from "../../types/component-types";
import { UrlData, UrlType } from "../../types/provider-types";

function createUrl(type: UrlType, id: string): string {
    const baseUrl = "bandcamp.com";
    const idArray = id.split("/");
    if (type == "artist"){
        return `https://${id}.bandcamp.com/`
    } else {
        return `https://${idArray[0]}.bandcamp.com/${idArray[1]}/${idArray[2]}`
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