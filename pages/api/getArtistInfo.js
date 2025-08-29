import providers from "./providers/providers";
import musicbrainz from "./providers/musicbrainz";
import logger from "../../utils/logger"

export default async function handler(req, res) {
    try {
        var { provider_id, provider, url } = req.query;
        const incMBData = Object.prototype.hasOwnProperty.call(req.query, "mbData");
        const forceRefresh = Object.prototype.hasOwnProperty.call(req.query, "forceRefresh");
        if (provider_id && !provider) {
            return res.status(400).json({ error: "Provider must be specified when provider_id is provided" });
        }
        if (!provider_id && !url) {
            return res.status(400).json({ error: "Either `provider_id` or `url` must be provided" });
        }
        if (url) {
            const urlInfo = providers.getUrlInfo(url);
            if (!urlInfo) {
                return res.status(400).json({ error: "Invalid URL" });
            }
            provider_id = urlInfo.id;
            provider = urlInfo.provider.namespace;
        }
        const providerObj = providers.parseProvider(provider, ["getArtistById"]);
        if (!providerObj) {
            return res.status(400).json({ error: "Provider doesn't exist or doesn't support this operation" });
        }
        const artist = await providerObj.getArtistById(provider_id, { noCache: forceRefresh });
        if (!artist) {
            return res.status(404).json({ error: "Artist not found" });
        }
        let providerData = providerObj.formatArtistLookupData(artist)
        providerData = providerObj.formatArtistObject(providerData);
        const providerUrl = providerObj.createUrl("artist", provider_id)
        let mbData = null;
        if (incMBData) {
            mbData = await musicbrainz.getArtistByUrl(providerUrl, ["url-rels"], { noCache: forceRefresh });
            return res.status(200).json({ providerData, mbData });
        }
        return res.status(200).json({ providerData });
    } catch (error) {
		logger.error("Error in getArtistInfo API", error)
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}