import musicbrainz from "./providers/musicbrainz";
import providers from "./providers/providers";
import logger from "../../utils/logger";
import normalizeVars from "../../utils/normalizeVars";
import { FullProvider, Provider, ProviderWithCapabilities } from "../../types/provider-types";

export default async function handler(req, res) {
    try {
        var { provider_id, provider, url } = normalizeVars(req.query);
        const forceRefresh = Object.prototype.hasOwnProperty.call(req.query, "forceRefresh");
        if (provider_id && !provider) {
            return res.status(400).json({ error: "Provider must be specified when provider_id is provided" });
        }
        if (!provider_id && !url) {
            return res.status(400).json({ error: "Either `provider_id` or `url` must be provided" });
        }
        let sourceProvider: ProviderWithCapabilities<["getAlbumById", "getAlbumUPCs"]> | false | null = null;
        let parsed_id: string | null;
        if (url) {
            let urlInfo = providers.getUrlInfo(url);
            if (!urlInfo) {
                return res.status(404).json({ error: "Invalid provider URL" });
            }
            if (urlInfo.type !== "track") {
                return res.status(400).json({ error: `Invalid URL type. Expected a track URL.` });
            }
            parsed_id = urlInfo.id;
            if (!parsed_id) {
                return res.status(500).json({ error: "Failed to extract provider id from URL" });
            }
            provider = urlInfo.provider.namespace;
            sourceProvider = providers.parseProvider(urlInfo.provider.namespace, ["getAlbumById", "getAlbumUPCs"]);
        } else if (provider_id && provider) {
            sourceProvider = providers.parseProvider(provider, ["getAlbumById", "getAlbumUPCs"]);
            parsed_id = provider_id
        } else {
            return res.status(400).json({ error: "Parameters `provider_id` and `provider` are required when not using `url`" });
        }
        if (!sourceProvider) {
            return res.status(400).json({ error: `Provider \`${provider}\` does not support this operation` });
        }
        let results = await sourceProvider.getAlbumById(parsed_id, { noCache: forceRefresh });
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