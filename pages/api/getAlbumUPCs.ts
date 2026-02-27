import providers from "./providers/providers";
import logger from "../../utils/logger";
import normalizeVars from "../../utils/normalizeVars";
import { ProviderWithCapabilities } from "../../types/provider-types";
import { SAMBLApiError, UPCData } from "../../types/api-types";

export default async function handler(req, res) {
    try {
        var { provider_id, provider, url } = normalizeVars(req.query);
        const forceRefresh = Object.prototype.hasOwnProperty.call(req.query, "forceRefresh");
        if (provider_id && !provider) {
            return res.status(400).json({ error: "Provider must be specified when provider_id is provided" } as SAMBLApiError);
        }
        if (!provider_id && !url) {
            return res.status(400).json({ error: "Either `provider_id` or `url` must be provided" } as SAMBLApiError);
        }
        let sourceProvider: ProviderWithCapabilities<["getAlbumById", "getAlbumUPCs"]> | false | null = null;
        let parsed_id: string | null;
        if (url) {
            let urlInfo = providers.getUrlInfo(url);
            if (!urlInfo) {
                return res.status(404).json({ error: "Invalid provider URL" } as SAMBLApiError);
            }
            if (urlInfo.type !== "album") {
                return res.status(400).json({ error: `Invalid URL type. Expected a track URL.` } as SAMBLApiError);
            }
            parsed_id = urlInfo.id;
            if (!parsed_id) {
                return res.status(500).json({ error: "Failed to extract provider id from URL" } as SAMBLApiError);
            }
            provider = urlInfo.provider;
            sourceProvider = providers.parseProvider(urlInfo.provider, ["getAlbumById", "getAlbumUPCs"]);
        } else if (provider_id && provider) {
            sourceProvider = providers.parseProvider(provider, ["getAlbumById", "getAlbumUPCs"]);
            parsed_id = provider_id
        } else {
            return res.status(400).json({ error: "Parameters `provider_id` and `provider` are required when not using `url`" } as SAMBLApiError);
        }
        if (!sourceProvider) {
            return res.status(400).json({ error: `Provider \`${provider}\` does not support this operation` } as SAMBLApiError);
        }
        let results = await sourceProvider.getAlbumById(parsed_id, { noCache: forceRefresh });
        if (!results){
            return res.status(404).json({ error: "Album not found!" } as SAMBLApiError);
        }
        let upcs = sourceProvider.getAlbumUPCs(results);
        if (upcs == null) {
            return res.status(404).json({ error: "Album not found!" } as SAMBLApiError);
        }
        // if (upcs == -1) {
        //     return res.status(200).json({ upcs: [] });
        // }
        res.status(200).json({ upcs } as UPCData);
    } catch (error) {
        logger.error("Error in getAlbumUPCs API:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message } as SAMBLApiError);
    }
}