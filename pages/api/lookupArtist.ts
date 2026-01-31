import providers from "./providers/providers";
import musicbrainz from "./providers/musicbrainz";
import logger from "../../utils/logger";
import { NextApiRequest, NextApiResponse } from "next";
import { FullProvider, ProviderWithCapabilities } from "../../types/provider-types";
import normalizeVars from "../../utils/normalizeVars";
import { ArtistLookupData } from "../../types/api-types";
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        var { provider_id, provider, url } = normalizeVars(req.query);
        const forceRefresh = Object.prototype.hasOwnProperty.call(req.query, "forceRefresh");
        if (provider_id && !provider) {
            return res.status(400).json({ error: "Provider must be specified when provider_id is provided" });
        }
        if (!provider_id && !url) {
            return res.status(400).json({ error: "Either `provider_id` or `url` must be provided" });
        }
        let sourceProvider: ProviderWithCapabilities<["getArtistById", "formatArtistLookupData", "formatArtistObject", "createUrl"]> | false | null = null;
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
            sourceProvider = providers.parseProvider(urlInfo.provider.namespace, ["getArtistById", "formatArtistLookupData", "formatArtistObject", "createUrl"]);
        } else if (provider_id && provider) {
            sourceProvider = providers.parseProvider(provider, ["getArtistById", "formatArtistLookupData", "formatArtistObject", "createUrl"]);
            parsed_id = provider_id
        } else {
            return res.status(400).json({ error: "Parameters `provider_id` and `provider` are required when not using `url`" });
        }
        if (!sourceProvider) {
            return res.status(400).json({ error: `Provider \`${provider}\` does not support this operation` });
        }
        const artist = await sourceProvider.getArtistById(parsed_id, { noCache: forceRefresh });
        if (!artist) {
            return res.status(404).json({ error: "Artist not found" });
        }
        let providerData = sourceProvider.formatArtistLookupData(artist)
        providerData = sourceProvider.formatArtistObject(providerData);
        const providerUrl = sourceProvider.createUrl("artist", parsed_id)
        if (!providerUrl) {
            return res.status(400).json({ error: "Provider id invalid or missing" });
        }
        let mbData = await musicbrainz.getArtistByUrl(providerUrl, ["artist-rels", "url-rels"], { noCache: forceRefresh });
        let mbid = mbData?.id || null;
        return res.status(200).json({ mbid, provider: sourceProvider.namespace, provider_id } as ArtistLookupData);
    } catch (error) {
        logger.error("Error in lookupArtist API", error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}