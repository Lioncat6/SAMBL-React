import providers from "../../lib/providers/providers";
import musicbrainz from "../../lib/providers/musicbrainz";
import logger from "../../utils/logger"
import { IArtist } from "musicbrainz-api";
import { ArtistData } from "../../types/api-types";
import { NextApiRequest, NextApiResponse } from "next";
import normalizeVars from "../../utils/normalizeVars";
import { ProviderWithCapabilities } from "../../types/provider-types";
import { SAMBLApiError } from "../../types/api-types";
import { Stages } from "../../utils/timings";
import ServerAPIHandler from "../../utils/serverAPIHandler";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const stages = new Stages();
    const api = new ServerAPIHandler('getArtistInfo', res, stages, ['provider_id', 'provider', 'url', 'mbData', 'forceRefresh']);
    try {
        var { provider_id, provider, url } = normalizeVars(req.query);
        const incMBData = Object.prototype.hasOwnProperty.call(req.query, "mbData");
        const forceRefresh = Object.prototype.hasOwnProperty.call(req.query, "forceRefresh");
        if (provider_id && !provider) {
            return api.response(400, { error: { error: "Provider must be specified when provider_id is provided", parameters: ['provider'] } });
        }
        if (!provider_id && !url) {
            return api.response(400, { error: { error: "Either `provider_id` or `url` must be provided", parameters: ['provider_id', 'url'] } });
        }
        let sourceProvider: ProviderWithCapabilities<["getArtistById", "formatArtistObject", "formatArtistLookupData", "createUrl"]> | false | null = null;
        let parsed_id: string | null;
        if (url) {
            let urlInfo = providers.getUrlInfo(url);
            if (!urlInfo) {
                return api.response(404, { error: { error: "Invalid provider URL" } });
            }
            if (urlInfo.type !== "artist") {
                return api.response(400, { error: { error: `Invalid URL type. Expected an artist URL.` } });
            }
            parsed_id = urlInfo.id;
            if (!parsed_id) {
                return api.response(500, { error: { error: "Failed to extract provider id from URL" } });
            }
            provider = urlInfo.provider;
            sourceProvider = providers.parseProvider(urlInfo.provider, ["getArtistById", "formatArtistObject", "formatArtistLookupData", "createUrl"]);
        } else if (provider_id && provider) {
            sourceProvider = providers.parseProvider(provider, ["getArtistById", "formatArtistObject", "formatArtistLookupData", "createUrl"]);
            parsed_id = provider_id
        } else {
            return api.response(400, { error: { error: "Parameters `provider_id` and `provider` are required when not using `url`" } });
        }
        if (!sourceProvider) {
            return api.response(400, { error: { error: `Provider \`${provider}\` does not support this operation` } });
        }
        stages.start('Get artist by ID', sourceProvider.namespace);
        const artist = await sourceProvider.getArtistById(parsed_id, { noCache: forceRefresh });
        stages.end('Get artist by ID');
        if (!artist) {
            return api.response(404, { error: { error: "Artist not found" } });
        }
        let providerData = sourceProvider.formatArtistLookupData(artist)
        let formattedData = sourceProvider.formatArtistObject(providerData);
        const providerUrl = sourceProvider.createUrl("artist", parsed_id)
        let mbData: IArtist | null = null;
        if (incMBData && providerUrl) {
            stages.start('Lookup target artist', 'musicbrainz');
            mbData = await musicbrainz.getArtistByUrl(providerUrl.url, ["url-rels", "artist-rels"], { noCache: forceRefresh });
            stages.end('Lookup target artist');
            const fullArtist = mbData ? await stages.await('Get target artist info', musicbrainz.getArtistById(mbData.id, { noCache: forceRefresh }), 'musicbrainz') : null;
            const formattedMbData = fullArtist ? musicbrainz.formatArtistObject(fullArtist) : null;
            return api.response<ArtistData>(200, { data: { providerData: formattedData, mbData: formattedMbData } });
        }
        return api.response<ArtistData>(200, { data: { providerData: formattedData } });
    } catch (error) {
        logger.error("Error in getArtistInfo API", error)
        return api.response(500, { error: { error: "Internal Server Error", details: error.message } });
    }
}