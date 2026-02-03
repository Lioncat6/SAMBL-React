import spotify from "./spotify";
import musicbrainz from "./musicbrainz";
import musixmatch from "./musixmatch";
import deezer from "./deezer";
import tidal from "./tidal"
import bandcamp from "./bandcamp"
import logger from "../../../utils/logger"
import soundcloud from "./soundcloud"
import applemusic from "./applemusic";
import { FullProvider, PartialProvider, Provider, ProviderCapability, ProviderNamespace, ProviderWithCapabilities, UrlInfo } from "../../../types/provider-types";
import clientProviders from "../../../utils/clientProviders";
const { isDisabled } = clientProviders;

const providerList = [
    spotify,
    musicbrainz,
    musixmatch,
    deezer,
    tidal,
    bandcamp,
    soundcloud,
    applemusic
];

function getDefaultProvider(): Provider {
    return providerList.find(p => p.config?.default) || providerList[0];
}

/**
 * Parses the given provider input and checks for required capabilities.
 *
 * @param {string|object} rawProvider - The provider namespace string or provider object.
 * @param {string[]} [capabilities] - Array of required function names.
 * @returns {object|boolean} The matched provider object if all capabilities are present, otherwise false.
 */

function parseProvider<T extends ProviderCapability[]>( 
    rawProvider: ProviderNamespace | string | Provider, 
    capabilities?: T 
): (T extends ProviderCapability[] ? ProviderWithCapabilities<T> | false : PartialProvider) | false {
    let provider = getDefaultProvider();

    if (typeof rawProvider === "string") {
        providerList.forEach(p => {
            if (p.namespace == rawProvider) {
                provider = p;
            }
        });
    } else {
        provider = rawProvider;
    }

    if (isDisabled(provider)) return false;

    if (capabilities && capabilities.length > 0) {
        for (const capability of capabilities) {
            if (!provider[capability as keyof typeof provider]) {
                return false;
            }
        }
    }
    return provider as any;
}

/**
 * Extracts provider information from a given URL.
 *
 * @param {string} url - The URL to parse for provider information.
 * @returns {object|null} An object containing the provider, id, and type if matched, otherwise null.
 */
function getUrlInfo(url: string): UrlInfo | null {
    let urlInfo: UrlInfo | null = null;

    providerList.forEach(p => {
        if (p.parseUrl) {
            let match = p.parseUrl(url);
            if (match) {
                urlInfo = {
                    provider: p.namespace,
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
    getUrlInfo,
    getDefaultProvider
};

export default providers;