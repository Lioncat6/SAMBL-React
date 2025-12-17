import musicbrainz from "./providers/musicbrainz";
import providers from "./providers/providers";
import logger from "../../utils/logger";
import normalizeVars from "../../utils/normalizeVars";
import { FullProvider, Provider } from "./providers/provider-types";

export default async function handler(req, res) {
    try {
        let { provider_id, provider, url } = normalizeVars(req.query);
        if (!provider_id && !url) {
            return res.status(400).json({ error: "Parameter `id` or `url` is required" });
        }
        if (provider_id && !provider) {
            return res.status(400).json({ error: "Parameter `provider` is required when using `id`" });
        }
        let sourceProvider: FullProvider | null | false = null;
        if (url) {
            let urlInfo = providers.getUrlInfo(url);
            if (!urlInfo) {
                return res.status(404).json({ error: "Invalid provider URL" });
            }
            if (urlInfo.type !== "album") {
                return res.status(400).json({ error: `Invalid URL type. Expected an album URL.` });
            }
            provider_id = urlInfo.id;
            provider = urlInfo.provider.namespace;
            sourceProvider = providers.parseProvider(urlInfo.provider.namespace, ["getAlbumById", "getAlbumUPCs"]);
        } else {
            sourceProvider = providers.parseProvider(provider, ["getAlbumById", "getAlbumUPCs"]);
        }
        if (!sourceProvider) {
            return res.status(400).json({ error: `Provider \`${provider}\` does not support this operation` });
        }
        let results = await sourceProvider.getAlbumById(provider_id);
        let upcs = sourceProvider.getAlbumUPCs(results);
        if (upcs == null) {
            return res.status(404).json({ error: "Album not found!" });
        }
        // if (upcs == -1) {
        //     return res.status(200).json({ upcs: [] });
        // }
        res.status(200).json({ upcs });
    } catch (error) {
        logger.error("Error in getAlbumUPCs API:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}