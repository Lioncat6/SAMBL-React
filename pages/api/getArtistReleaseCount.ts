import musicbrainz from "./providers/musicbrainz";
import logger from "../../utils/logger";
import normalizeVars
 from "../../utils/normalizeVars";
import { NextApiRequest, NextApiResponse } from "next";
import { SAMBLApiError } from "../../types/api-types";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { mbid } = normalizeVars(req.query);
        const featured = Object.prototype.hasOwnProperty.call(req.query, "featured");

        if (!mbid || !musicbrainz.validateMBID(mbid)) {
            return res.status(400).json({ error: "Parameter `mbid` is missing or malformed" } as SAMBLApiError);
        }

        let ownCount = await musicbrainz.getArtistReleaseCount(mbid);
        let releaseCount = ownCount;
        if (releaseCount === null || ownCount == null) {
            return res.status(404).json({ error: "Artist not found" } as SAMBLApiError);
        }
        let featuredCount: number | null = 0;
        if (featured) {
            featuredCount = await musicbrainz.getArtistFeaturedReleaseCount(mbid); 
            if (featuredCount === null) {
                return res.status(404).json({ error: "Artist not found" } as SAMBLApiError);
            }
            releaseCount += featuredCount;
        }

        return res.status(200).json({ releaseCount, ownCount, featuredCount });
    } catch (error) {
        logger.error("Error in getArtistReleaseCount API", error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message } as SAMBLApiError);
    }
}