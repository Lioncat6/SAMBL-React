import { UrlParser } from "../../types/component-types";
import { FullProviderNamespace, ProviderNamespace, UrlInfo } from "../../types/provider-types";
import applemusic from "./applemusic";
import bandcamp from "./bandcamp";
import deezer from "./deezer"
import musicbrainz from "./musicbrainz";
import musixmatch from "./musixmatch";
import naver from "./naver";
import soundcloud from "./soundcloud";
import spotify from "./spotify";
import tidal from "./tidal";

const parserList: Record<ProviderNamespace, UrlParser> ={
    "applemusic": applemusic,
    "bandcamp" : bandcamp,
    "deezer": deezer,
    "musicbrainz": musicbrainz,
    "soundcloud" : soundcloud,
    "tidal": tidal,
    "spotify": spotify,
    "musixmatch": musixmatch,
    "naver": naver
}

function getParser(provider: ProviderNamespace): UrlParser {
    return parserList[provider]
}

/**
 * Extracts provider information from a given URL.
 *
 * @param {string} url - The URL to parse for provider information.
 * @returns {object|null} An object containing the provider, id, and type if matched, otherwise null.
 */
function getUrlInfo(url: string): UrlInfo | null {
    let urlInfo: UrlInfo | null = null;
    for (const [provider, urlParser] of Object.entries(parserList) as [ProviderNamespace, UrlParser][]) {
        const match = urlParser.parseUrl(url);
        if (match) {
            urlInfo = {
                provider,
                id: match.id,
                type: match.type
            };
        }
    }
    return urlInfo;
} 

const parsers = {
    getParser,
    getUrlInfo
}

export default parsers