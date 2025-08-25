import musicbrainz from "./providers/musicbrainz";
import providers from "./providers/providers";
import logger from "../../utils/logger";
import { getTraceEvents } from "next/dist/trace";

export default async function handler(req, res) {
    try {
        let { provider_id, provider, url } = req.query;
        if (!id && !url) {
            return res.status(400).json({ error: "Parameter `id` or `url` is required" });
        }
        if (id && !provider) {
            return res.status(400).json({ error: "Parameter `provider` is required when using `id`" });
        }
        let sourceProvider = null;
        if (url) {
            let urlInfo = providers.getUrlInfo(url);
            if (!urlInfo) {
                return res.status(404).json({ error: "Invalid provider URL" });
            }
            if (urlInfo.type !== "album" && urlInfo.type !== "release") {
                return res.status(400).json({ error: `Invalid URL type. Expected an album URL.` });
            }
            id = urlInfo.id;
            provider = urlInfo.provider.namespace;
            sourceProvider = providers.parseProvider(urlInfo.provider, ["getAlbumById", "getAlbumUPCs"]);
        } else {
            sourceProvider = providers.parseProvider(provider, ["getAlbumById", "getAlbumUPCs"]);
        }
        if (!sourceProvider) {
            return res.status(400).json({ error: `Provider \`${provider}\` does not support this operation` });
        }
        let results = await sourceProvider.getAlbumById(id);
        let upcs = sourceProvider.getAlbumUPCs(results);
        if (upcs == null) {
            return res.status(404).json({ error: "Album not found!" });
        }
        res.status(200).json({ upcs });
    } catch (error) {
        logger.error("Error in getAlbumUPCs API:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}