import providers from "./providers/providers";
import logger from "../../utils/logger";
import { ProviderWithCapabilities } from "../../types/provider-types";
import { NextApiRequest, NextApiResponse } from "next";
import normalizeVars from "../../utils/normalizeVars";
import { ISRCData, SAMBLApiError } from "../../types/api-types";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        let { provider_id, provider, url } = normalizeVars(req.query);
        if (!provider_id && !url) {
            return res.status(400).json({ error: "Parameter `id` or `url` is required" } as SAMBLApiError);
        }
        if (provider_id && !provider) {
            return res.status(400).json({ error: "Parameter `provider` is required when using `id`" } as SAMBLApiError);
        }
        let sourceProvider: ProviderWithCapabilities<["getTrackById", "getTrackISRCs"]> | false | null = null;
        let parsed_id: string | null;
        if (url) {
            let urlInfo = providers.getUrlInfo(url);
            if (!urlInfo) {
                return res.status(404).json({ error: "Invalid provider URL" } as SAMBLApiError);
            }
            if (urlInfo.type !== "track") {
                return res.status(400).json({ error: `Invalid URL type. Expected a track URL.` } as SAMBLApiError);
            }
            parsed_id = urlInfo.id;
            if (!parsed_id) {
                return res.status(500).json({ error: "Failed to extract provider id from URL" } as SAMBLApiError);
            }
            provider = urlInfo.provider;
            sourceProvider = providers.parseProvider(urlInfo.provider, ["getTrackById", "getTrackISRCs"]);
        } else if (provider_id && provider) {
            sourceProvider = providers.parseProvider(provider, ["getTrackById", "getTrackISRCs"]);
            parsed_id = provider_id
        } else {
            return res.status(400).json({ error: "Parameters `provider_id` and `provider` are required when not using `url`" } as SAMBLApiError);
        }
        if (!sourceProvider) {
            return res.status(400).json({ error: `Provider \`${provider}\` does not support this operation` } as SAMBLApiError);
        }
        let results = await sourceProvider.getTrackById(parsed_id);
        if (!results) {
            return res.status(404).json({ error: "Track not found!" } as SAMBLApiError);
        }
        let isrcs = sourceProvider.getTrackISRCs(results);
        if (isrcs == null) {
            return res.status(404).json({ error: "Track not found!" } as SAMBLApiError);
        }
        res.status(200).json({ isrcs } as ISRCData);
    } catch (error) {
        logger.error("Error in getTrackISRCs API:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message } as SAMBLApiError);
    }
}