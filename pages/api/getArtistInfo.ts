import providers from "./providers/providers";
import musicbrainz from "./providers/musicbrainz";
import logger from "../../utils/logger"
import { IArtist } from "musicbrainz-api";
import { ArtistData } from "../../types/api-types";
import { NextApiRequest, NextApiResponse } from "next";
import normalizeVars from "../../utils/normalizeVars";
import { ProviderWithCapabilities } from "../../types/provider-types";
import { SAMBLApiError } from "../../types/api-types";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        var { provider_id, provider, url } = normalizeVars(req.query);
        const incMBData = Object.prototype.hasOwnProperty.call(req.query, "mbData");
        const forceRefresh = Object.prototype.hasOwnProperty.call(req.query, "forceRefresh");
        if (provider_id && !provider) {
            return res.status(400).json({ error: "Provider must be specified when provider_id is provided" } as SAMBLApiError);
        }
        if (!provider_id && !url) {
            return res.status(400).json({ error: "Either `provider_id` or `url` must be provided" } as SAMBLApiError);
        }
        let sourceProvider: ProviderWithCapabilities<["getArtistById", "formatArtistObject", "formatArtistLookupData", "createUrl"]> | false | null = null;
        let parsed_id: string | null;
        if (url) {
            let urlInfo = providers.getUrlInfo(url);
            if (!urlInfo) {
                return res.status(404).json({ error: "Invalid provider URL" } as SAMBLApiError);
            }
            if (urlInfo.type !== "artist") {
                return res.status(400).json({ error: `Invalid URL type. Expected an artist URL.` } as SAMBLApiError);
            }
            parsed_id = urlInfo.id;
            if (!parsed_id) {
                return res.status(500).json({ error: "Failed to extract provider id from URL" } as SAMBLApiError);
            }
            provider = urlInfo.provider;
            sourceProvider = providers.parseProvider(urlInfo.provider, ["getArtistById", "formatArtistObject", "formatArtistLookupData", "createUrl"]);
        } else if (provider_id && provider) {
            sourceProvider = providers.parseProvider(provider, ["getArtistById", "formatArtistObject", "formatArtistLookupData", "createUrl"]);
            parsed_id = provider_id
        } else {
            return res.status(400).json({ error: "Parameters `provider_id` and `provider` are required when not using `url`" } as SAMBLApiError);
        }
        if (!sourceProvider) {
            return res.status(400).json({ error: `Provider \`${provider}\` does not support this operation` } as SAMBLApiError);
        }
        const artist = await sourceProvider.getArtistById(parsed_id, { noCache: forceRefresh });
        if (!artist) {
            return res.status(404).json({ error: "Artist not found" } as SAMBLApiError);
        }
        let providerData = sourceProvider.formatArtistLookupData(artist)
        let formattedData = sourceProvider.formatArtistObject(providerData);
        const providerUrl = sourceProvider.createUrl("artist", parsed_id)
        let mbData: IArtist | null = null;
        if (incMBData && providerUrl) {
            mbData = await musicbrainz.getArtistByUrl(providerUrl, ["url-rels", "artist-rels"], { noCache: forceRefresh });
            const fullArtist = mbData ? await musicbrainz.getArtistById(mbData.id, { noCache: forceRefresh }): null;
            const formattedMbData = fullArtist ? musicbrainz.formatArtistObject(fullArtist) : null;
            return res.status(200).json({ providerData: formattedData, mbData: formattedMbData } as ArtistData);
        }
        return res.status(200).json({ providerData: formattedData } as ArtistData);
    } catch (error) {
        logger.error("Error in getArtistInfo API", error)
        return res.status(500).json({ error: "Internal Server Error", details: error.message } as SAMBLApiError);
    }
}