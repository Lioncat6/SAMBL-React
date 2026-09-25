import providers from "../../lib/providers/providers";
import logger from "../../utils/logger";
import normalizeVars from "../../utils/normalizeVars";
import { ProviderWithCapabilities } from "../../types/provider-types";
import { SAMBLApiError, SAMBLAPIResponse, UPCData } from "../../types/api-types";
import { Stages } from "../../utils/timings";
import ServerAPIHandler from "../../utils/serverAPIHandler";

export default async function handler(req, res) {
    const stages = new Stages();
    const api = new ServerAPIHandler('getAlbumUPCs', res, stages, ['provider_id', 'provider', 'url', 'forceRefresh'])
    try {
        var { provider_id, provider, url } = normalizeVars(req.query);
        const forceRefresh = Object.prototype.hasOwnProperty.call(req.query, "forceRefresh");
        if (provider_id && !provider) {
            return api.response(400, { error: { error: "Provider must be specified when provider_id is provided", parameters: ['provider'] } });
        }
        if (!provider_id && !url) {
            return api.response(400, { error: { error: "Either `provider_id` or `url` must be provided", parameters: ['provider_id', 'url'] } });
        }
        let sourceProvider: ProviderWithCapabilities<["getAlbumById", "formatAlbumObject"]> | false | null = null;
        let parsed_id: string | null;
        if (url) {
            let urlInfo = providers.getUrlInfo(url);
            if (!urlInfo) {
                return api.response(404, { error: { error: "Invalid provider URL" } });
            }
            if (urlInfo.type !== "album") {
                return api.response(400, { error: { error: `Invalid URL type. Expected a track URL.` } });
            }
            parsed_id = urlInfo.id;
            if (!parsed_id) {
                return api.response(500, { error: { error: "Failed to extract provider id from URL" } });
            }
            provider = urlInfo.provider;
            sourceProvider = providers.parseProvider(urlInfo.provider, ["getAlbumById", "formatAlbumObject"]);
        } else if (provider_id && provider) {
            sourceProvider = providers.parseProvider(provider, ["getAlbumById", "formatAlbumObject"]);
            parsed_id = provider_id
        } else {
            return api.response(400, { error: { error: "Parameters `provider_id` and `provider` are required when not using `url`", parameters: ['provider_id', 'provider'] } });
        }
        if (!sourceProvider) {
            return api.response(400, { error: { error: `Provider \`${provider}\` does not support this operation`}});
        }
        stages.start('Fetch album by ID', sourceProvider.namespace);
        let results = await sourceProvider.getAlbumById(parsed_id, { noCache: forceRefresh });
        stages.end('Fetch album by ID');
        if (!results) {
            return api.response(404, { error: { error: "Album not found!", provider: sourceProvider.namespace } });
        }
        let formattedAlbum = sourceProvider.formatAlbumObject(results)
        let upcs = formattedAlbum.upc ? [formattedAlbum.upc] : [];
        api.response(200, { data: { upcs } });
    } catch (error) {
        logger.error("Error in formatAlbumObject API:", error);
        api.response(500, { error: { error: "Internal Server Error", details: error.message } });
    }
}