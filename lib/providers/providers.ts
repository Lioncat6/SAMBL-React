import spotify from "./spotify";
import musicbrainz from "./musicbrainz";
import musixmatch from "./musixmatch";
import deezer from "./deezer";
import tidal from "./tidal"
import bandcamp from "./bandcamp"
import soundcloud from "./soundcloud"
import applemusic from "./applemusic";
import { PartialProvider, Provider, ProviderCapability, ProviderNamespace, ProviderWithCapabilities } from "../../types/provider-types";
import clientProviders from "../../utils/clientProviders";
import parsers from "../parsers/parsers";
import naver from "./naver";
const { isDisabled } = clientProviders;

const providerList = [
    spotify,
    musicbrainz,
    musixmatch,
    deezer,
    tidal,
    bandcamp,
    soundcloud,
    applemusic,
    naver
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
): (T extends ProviderCapability[] ? ProviderWithCapabilities<T> : PartialProvider) | false {
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

function getAllProviders<T extends ProviderCapability[]>( 
    capabilities?: T 
): (T extends ProviderCapability[] ? ProviderWithCapabilities<T> : PartialProvider  )[] {
    let allProviders: (T extends ProviderCapability[] ? ProviderWithCapabilities<T> : PartialProvider)[] = []
    providerList.forEach((p)=>{
        const parsedProvider = parseProvider(p, capabilities)
        if (parsedProvider != false) {
            allProviders.push(parsedProvider)
        }
    })
    return allProviders;
}

const providers = {
    parseProvider,
    getUrlInfo: parsers.getUrlInfo,
    getDefaultProvider,
    getAllProviders
};

export default providers;