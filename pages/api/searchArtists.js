import musicbrainz from "./providers/musicbrainz";
import providers from "./providers/providers";
import logger from "../../utils/logger";

export default async function handler(req, res) {
    try {
        const { query, provider } = req.query;
        if (!query) {
            return res.status(400).json({ error: "Parameter `query` is required" });
        }
        let sourceProvider = providers.parseProvider(provider, ["searchByArtistName", "formatArtistSearchData", "formatArtistObject", "getArtistUrl"]);
        if (!sourceProvider) {
            return res.status(400).json({ error: `Provider \`${provider}\` does not support this operation` });
        }
        let results = await sourceProvider.searchByArtistName(query);
        let artistUrls = [];
        let artistData = {}
        for (let artist of sourceProvider.formatArtistSearchData(results)) {
            artistUrls.push(sourceProvider.getArtistUrl(artist))
            artistData[sourceProvider.getArtistUrl(artist)] = sourceProvider.formatArtistObject(artist);
        }
        if (artistUrls.length == 0) {
            res.status(200).json({})
        }
        let mbids = await musicbrainz.getIdsBySpotifyUrls(artistUrls);
        for (let url of artistUrls) {
            artistData[url].mbid = mbids[url] || mbids[url+"/"] || null
        }
        res.status(200).json(artistData);
	} catch (error) {
        logger.error("Error in searchArtists API:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}