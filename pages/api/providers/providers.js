import spotify from "./spotify";
import musicbrainz from "./musicbrainz";
import musixmatch from "./musixmatch";
import deezer from "./deezer";
import tidal from "./tidal"
import logger from "../../../utils/logger";

const providerList = [
    spotify,
    musicbrainz,
    musixmatch,
    deezer,
    tidal
];

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