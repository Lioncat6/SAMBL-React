import musicbrainz from "../../lib/providers/musicbrainz";
import logger from "../../utils/logger";
import normalizeVars
    from "../../utils/normalizeVars";
import { NextApiRequest, NextApiResponse } from "next";
import { ReleaseCountData, SAMBLApiError } from "../../types/api-types";
import { Stages } from "../../utils/timings";
import ServerAPIHandler from "../../utils/serverAPIHandler";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const stages = new Stages();
    const api = new ServerAPIHandler('getArtistReleaseCount', res, stages, ['mbid', 'featured'])
    try {
        const { mbid } = normalizeVars(req.query);
        const featured = Object.prototype.hasOwnProperty.call(req.query, "featured");

        if (!mbid || !musicbrainz.validateMBID(mbid)) {
            return api.response(400, { error: { error: "Parameter `mbid` is missing or malformed" } });
        }

        stages.start('Get target artist release count', 'musicbrainz');
        let ownCount = await musicbrainz.getArtistReleaseCount(mbid);
        stages.end('Get target artist release count');
        let releaseCount = ownCount;
        if (releaseCount === null || ownCount == null) {
            return api.response(404, { error: { error: "Artist not found" } });
        }
        let featuredCount: number | null = 0;
        if (featured) {
            stages.start('Get target artist featured release count', 'musicbrainz');
            featuredCount = await musicbrainz.getArtistFeaturedReleaseCount(mbid);
            stages.end('Get target artist featured release count');
            if (featuredCount === null) {
                return api.response(404, { error: { error: "Artist not found" } });
            }
            releaseCount += featuredCount;
        }

        return api.response<ReleaseCountData>(200, { data: { releaseCount, ownCount, featuredCount } });
    } catch (error) {
        logger.error("Error in getArtistReleaseCount API", error);
        return api.response(500, { error: { error: "Internal Server Error", details: error.message } });
    }
}