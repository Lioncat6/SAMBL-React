import { UrlParser } from "../../types/component-types";
import { UrlData, UrlType } from "../../types/provider-types";


function parseUrl(url: string): UrlData | null {
    //TODO: Implement parsing
    return null;
}

function createUrl(type: UrlType, id: string): string {
    //TODO: Implement creation
    return `https://musixmatch.com`;
}

const musixmatch: UrlParser = {
    parseUrl,
    createUrl
}

export default musixmatch