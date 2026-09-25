import providers from "../../lib/providers/providers";
import logger from "../../utils/logger";
import { ProviderWithCapabilities } from "../../types/provider-types";
import { NextApiRequest, NextApiResponse } from "next";
import normalizeVars from "../../utils/normalizeVars";
import { ISRCData, SAMBLApiError } from "../../types/api-types";
import { Stages } from "../../utils/timings";
import ServerAPIHandler from "../../utils/serverAPIHandler";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const stages = new Stages();
    const api = new ServerAPIHandler('getTrackISRCs', res, stages, ['provider_id', 'provider', 'url'])
    try {
        let { provider_id, provider, url } = normalizeVars(req.query);
        if (!provider_id && !url) {
            return api.response(400, { error: { error: "Parameter `provider_id` or `url` is required", parameters: ['provider_id', 'url'] } });
        }
        if (provider_id && !provider) {
            return api.response(400, { error: { error: "Parameter `provider` is required when using `id`", parameters: ['provider'] } });
        }
        let sourceProvider: ProviderWithCapabilities<["getTrackById", "formatTrackObject"]> | false | null = null;
        let parsed_id: string | null;
        if (url) {
            let urlInfo = providers.getUrlInfo(url);
            if (!urlInfo) {
                return api.response(404, { error: { error: "Invalid provider URL" } });
            }
            if (urlInfo.type !== "track") {
                return api.response(400, { error: { error: `Invalid URL type. Expected a track URL.` } });
            }
            parsed_id = urlInfo.id;
            if (!parsed_id) {
                return api.response(500, { error: { error: "Failed to extract provider id from URL" } });
            }
            provider = urlInfo.provider;
            sourceProvider = providers.parseProvider(urlInfo.provider, ["getTrackById", "formatTrackObject"]);
        } else if (provider_id && provider) {
            sourceProvider = providers.parseProvider(provider, ["getTrackById", "formatTrackObject"]);
            parsed_id = provider_id
        } else {
            return api.response(400, { error: { error: "Parameters `provider_id` and `provider` are required when not using `url`", parameters: ['provider_id', 'provider'] } });
        }
        if (!sourceProvider) {
            return api.response(400, { error: { error: `Provider \`${provider}\` does not support this operation` } });
        }
        stages.start('Get track by ID', sourceProvider.namespace);
        let results = await sourceProvider.getTrackById(parsed_id);
        stages.end('Get track by ID');
        if (!results) {
            return api.response(404, { error: { error: "Track not found!", provider: sourceProvider.namespace } });
        }
        let isrcs = sourceProvider.formatTrackObject(results).isrcs;
        if (isrcs == null) {
            return api.response(404, { error: { error: "No ISRCs found!", provider: sourceProvider.namespace } });
        }
        api.response<ISRCData>(200, { data: { isrcs } });
    } catch (error) {
        logger.error("Error in formatTrackObject API:", error);
        api.response(500, { error: { error: "Internal Server Error", details: error.message } });
    }
}