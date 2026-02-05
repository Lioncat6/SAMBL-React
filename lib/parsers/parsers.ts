import { UrlParser } from "../../types/component-types";
import { FullProviderNamespace, ProviderNamespace } from "../../types/provider-types";
import applemusic from "./applemusic";
import bandcamp from "./bandcamp";
import deezer from "./deezer"
import musicbrainz from "./musicbrainz";
import musixmatch from "./musixmatch";
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
    "musixmatch": musixmatch
}

function getParser(provider: ProviderNamespace): UrlParser {
    return parserList[provider]
}

const parsers = {
    getParser
}

export default parsers