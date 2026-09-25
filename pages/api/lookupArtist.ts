import providers from "../../lib/providers/providers";
import musicbrainz from "../../lib/providers/musicbrainz";
import logger from "../../utils/logger";
import { NextApiRequest, NextApiResponse } from "next";
import { ProviderWithCapabilities } from "../../types/provider-types";
import normalizeVars from "../../utils/normalizeVars";
import { ArtistLookupData } from "../../types/api-types";
import { SAMBLApiError } from "../../types/api-types";
import { Stages } from "../../utils/timings";
import ServerAPIHandler from "../../utils/serverAPIHandler";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const stages = new Stages();
    const api = new ServerAPIHandler('lookupArtist', res, stages, ['provider_id', 'provider', 'url', 'forceRefresh'])
    try {
        var { provider_id, provider, url } = normalizeVars(req.query);
        const forceRefresh = Object.prototype.hasOwnProperty.call(req.query, "forceRefresh");
        if (provider_id && !provider) {
            return api.response(400, { error: { error: "Provider must be specified when provider_id is provided", parameters: ['provider'] } });
        }
        if (!provider_id && !url) {
            return api.response(400, { error: { error: "Either `provider_id` or `url` must be provided", parameters: ['provider_id', 'url'] } });
        }
        let sourceProvider: ProviderWithCapabilities<["getArtistById", "formatArtistLookupData", "formatArtistObject", "createUrl"]> | false | null = null;
        let parsed_id: string | null;
        if (url) {
            let urlInfo = providers.getUrlInfo(url);
            if (!urlInfo) {
                return api.response(404, { error: { error: "Invalid provider URL" } });
            }
            if (urlInfo.type !== "artist") {
                return api.response(400, { error: { error: `Invalid URL type. Expected a artist URL.` } });
            }
            parsed_id = urlInfo.id;
            if (!parsed_id) {
                return api.response(500, { error: { error: "Failed to extract provider id from URL" } });
            }
            provider = urlInfo.provider;
            sourceProvider = providers.parseProvider(urlInfo.provider, ["getArtistById", "formatArtistLookupData", "formatArtistObject", "createUrl"]);
        } else if (provider_id && provider) {
            sourceProvider = providers.parseProvider(provider, ["getArtistById", "formatArtistLookupData", "formatArtistObject", "createUrl"]);
            parsed_id = provider_id
        } else {
            return api.response(400, { error: { error: "Parameters `provider_id` and `provider` are required when not using `url`", parameters: ['provider_id', 'provider'] } });
        }
        if (!sourceProvider) {
            return api.response(400, { error: { error: `Provider \`${provider}\` does not support this operation` } });
        }
        stages.start('Get source artist by ID', sourceProvider.namespace)
        const artist = await sourceProvider.getArtistById(parsed_id, { noCache: forceRefresh });
        stages.end('Get source artist by ID');
        if (!artist) {
            return api.response(404, { error: { error: "Artist not found", provider: sourceProvider.namespace } });
        }
        const formattedArtist = sourceProvider.formatArtistObject(sourceProvider.formatArtistLookupData(artist));
        const providerUrl = formattedArtist.url || sourceProvider.createUrl("artist", parsed_id) || null;
        if (!providerUrl) {
            return api.response(400, { error: { error: "Provider id invalid or missing" } });
        }
        let regexProvider = provider ? providers.parseProvider(sourceProvider.namespace, ["buildUrlSearchQuery"]) : false;
        if (regexProvider) {
            let urlQuery = regexProvider.buildUrlSearchQuery("artist", [providerUrl.url]);
            if (urlQuery) {
                stages.start('Regex search target for artist', 'musicbrainz')
                const urlResults = await musicbrainz.getIdsByUrlQuery(urlQuery);
                stages.end('Regex search target for artist')
                const lookupData: ArtistLookupData = { mbid: urlResults?.[parsed_id] || null, provider: sourceProvider.namespace, provider_id: parsed_id }
                if (lookupData.mbid) {
                    return api.response<ArtistLookupData>(200, { data: lookupData });
                };
            }
        }
        stages.start('Search target for artist', 'musicbrainz')
        let mbData = await musicbrainz.getArtistByUrl(providerUrl.url, ["artist-rels", "url-rels"], { noCache: forceRefresh });
        stages.end('Search target for artist')
        let mbid = mbData?.id || null;
        const lookupData: ArtistLookupData = { mbid, provider: sourceProvider.namespace, provider_id: parsed_id }
        return api.response<ArtistLookupData>(200, { data: lookupData });
    } catch (error) {
        logger.error("Error in lookupArtist API", error);
        return api.response(500, { error: { error: "Internal Server Error", details: error.message } });
    }
}