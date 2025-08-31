import musicbrainz from "./providers/musicbrainz";
import logger from "../../utils/logger";
export default async function handler(req, res) {
    try {
        const { mbid } = req.query;
        const featured = Object.prototype.hasOwnProperty.call(req.query, "featured");

        if (!mbid || !musicbrainz.validateMBID(mbid)) {
            return res.status(400).json({ error: "Parameter `mbid` is missing or malformed" });
        }

        let ownCount = await musicbrainz.getArtistReleaseCount(mbid);
        let releaseCount = ownCount;
        if (releaseCount === null) {
            return res.status(404).json({ error: "Artist not found" });
        }
        let featuredCount = 0;
        if (featured) {
            featuredCount = await musicbrainz.getArtistFeaturedReleaseCount(mbid); 
            releaseCount += featuredCount;
        }

        res.status(200).json({ releaseCount, ownCount, featuredCount });
    } catch (error) {
        logger.error("Error in getArtistReleaseCount API", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}