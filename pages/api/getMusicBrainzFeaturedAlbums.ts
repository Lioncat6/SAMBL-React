import musicbrainz from "../../lib/providers/musicbrainz";
import logger from "../../utils/logger";
import normalizeVars from "../../utils/normalizeVars";
import { SAMBLApiError } from "../../types/api-types";
import { NextApiRequest, NextApiResponse } from "next";
import { Stages } from "../../utils/timings";
import ServerAPIHandler from "../../utils/serverAPIHandler";
import { ExtendedAlbumData } from "../../types/provider-types";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	const stages = new Stages();
	const api = new ServerAPIHandler('getMusicBrainzFeaturedAlbums', res, stages, ['mbid', 'offset, limit', 'forceRefresh'])
	try {
		const { mbid, offset, limit } = normalizeVars(req.query);
		const forceRefresh: boolean = Object.prototype.hasOwnProperty.call(req.query, "forceRefresh");
		if (!mbid || !musicbrainz.validateMBID(mbid)) {
			return api.response(400, { error: { error: "Parameter `mbid` is missing or malformed", parameters: ['mbid'] } });
		}
		stages.start('Get target artist featured albums', 'musicbrainz');
		const data = await musicbrainz.getArtistFeaturedAlbums(mbid, offset, limit ? Number(limit) : undefined, ["url-rels", "recordings", "isrcs", "recording-level-rels", "artist-credits"], { noCache: forceRefresh || undefined });
		stages.end('Get target artist featured albums');
		const formattedData = musicbrainz.formatAlbumGetData(data);
		api.response<ExtendedAlbumData>(200, { data: formattedData });
	} catch (error) {
		if (error.message == "Not Found") {
			return api.response(404, { error: { error: "Artist not found" } });
		}
		logger.error("Error in getMusicBrainzFeaturedAlbums API", error);
		api.response(500, { error: { error: "Internal Server Error", details: error.message } });
	}
}
