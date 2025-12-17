import musicbrainz from "./providers/musicbrainz";
import providers from "./providers/providers";
import logger from "../../utils/logger";
import { getTraceEvents } from "next/dist/trace";
import { FullProvider } from "./providers/provider-types";
import { NextApiRequest, NextApiResponse } from "next";
import normalizeVars from "../../utils/normalizeVars";

export default async function handler(req:NextApiRequest, res:NextApiResponse) {
    try {
        let { provider_id, provider, url } = normalizeVars(req.query);
        if (!provider_id && !url) {
            return res.status(400).json({ error: "Parameter `id` or `url` is required" });
        }
        if (provider_id && !provider) {
            return res.status(400).json({ error: "Parameter `provider` is required when using `id`" });
        }
        let sourceProvider: FullProvider | false | null = null;
        if (url) {
            let urlInfo = providers.getUrlInfo(url);
            if (!urlInfo) {
                return res.status(404).json({ error: "Invalid provider URL" });
            }
            if (urlInfo.type !== "track") {
                return res.status(400).json({ error: `Invalid URL type. Expected a track URL.` });
            }
            provider_id = urlInfo.id;
            provider = urlInfo.provider.namespace;
            sourceProvider = providers.parseProvider(urlInfo.provider.namespace, ["getTrackById", "getTrackISRCs"]);
        } else {
            sourceProvider = providers.parseProvider(provider, ["getTrackById", "getTrackISRCs"]);
        }
        if (!sourceProvider) {
            return res.status(400).json({ error: `Provider \`${provider}\` does not support this operation` });
        }
        if (!provider_id) {
            return res.status(400).json({ error: "Provider id invalid or missing" });
        }
        let results = await sourceProvider.getTrackById(provider_id);
        let isrcs = sourceProvider.getTrackISRCs(results);
        if (isrcs == null) {
            return res.status(404).json({ error: "Track not found!" });
        }
        res.status(200).json({ isrcs });
	} catch (error) {
        logger.error("Error in getTrackISRCs API:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}