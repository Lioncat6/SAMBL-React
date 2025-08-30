import spotify from "./spotify";
import musicbrainz from "./musicbrainz";
import musixmatch from "./musixmatch";
import deezer from "./deezer";
import tidal from "./tidal"
import bandcamp from "./bandcamp"
import logger from "../../../utils/logger"

const providerList = [
    spotify,
    musicbrainz,
    musixmatch,
    deezer,
    tidal,
    bandcamp
];

/**
 * Parses the given provider input and checks for required capabilities.
 *
 * @param {string|object} rawProvider - The provider namespace string or provider object.
 * @param {string[]} [capabilities] - Array of required function names.
 * @returns {object|boolean} The matched provider object if all capabilities are present, otherwise false.
 */
function parseProvider(rawProvider, capabilities) {
    let provider = spotify;

    if (typeof rawProvider === "string") {
        providerList.forEach(p => {
            if (p.namespace == rawProvider) {
                provider = p;
            }
        });
    } else {
        provider = rawProvider;
    }

    if (capabilities && capabilities.length > 0) {
        for (const capability of capabilities) {
            if (!provider[capability]) {
                return false;
            }
        }
    }
    return provider;
}

/**
 * Extracts provider information from a given URL.
 *
 * @param {string} url - The URL to parse for provider information.
 * @returns {object|null} An object containing the provider, id, and type if matched, otherwise null.
 */
function getUrlInfo(url) {
    let urlInfo = null;

    providerList.forEach(p => {
        if (p.parseUrl) {
            let match = p.parseUrl(url);
            if (match) {
                urlInfo = {
                    provider: p,
                    id: match.id,
                    type: match.type
                };
            }
        }
    });

    return urlInfo;
}

const providers = {
    parseProvider,
    getUrlInfo
};

export default providers;