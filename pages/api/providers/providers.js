import spotify from "./spotify";
import musicbrainz from "./musicbrainz";
import musixmatch from "./musixmatch";
import deezer from "./deezer";
import tidal from "./tidal"
import logger from "../../../utils/logger";

function parseProvider(rawProvider, capabilities) {
    let provider = spotify;
    switch (rawProvider) {
        case "musicbrainz":
            provider = musicbrainz;
            break;
        case "musixmatch":
            provider = musixmatch;
            break;
        case "tidal":
            provider = tidal;
            break;
        case "deezer":
            provider = deezer;
            break;
    }
    if (capabilities && capabilities.length > 0) {
        for (const capability of capabilities) {
            if (!provider[capability]) {
                throw new Error(`Provider ${provider} does not support capability: ${capability}`);
            }
        }
    }
    return provider;
}

const providers = {
    parseProvider
};

export default providers;