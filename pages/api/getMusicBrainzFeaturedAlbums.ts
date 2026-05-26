import musicbrainz from "../../lib/providers/musicbrainz";
import logger from "../../utils/logger";
import normalizeVars from "../../utils/normalizeVars";
import { SAMBLApiError } from "../../types/api-types";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		const { mbid, offset, limit } = normalizeVars(req.query);
		const forceRefresh: boolean = Object.prototype.hasOwnProperty.call(req.query, "forceRefresh");
		if (!mbid || !musicbrainz.validateMBID(mbid)) {
			return res.status(400).json({ error: "Parameter `mbid` is missing or malformed" } as SAMBLApiError);
		}
		const data = await musicbrainz.getArtistFeaturedAlbums(mbid, offset, limit ? Number(limit) : undefined, ["url-rels", "recordings", "isrcs", "recording-level-rels", "artist-credits"], { noCache: forceRefresh || undefined });
		const formattedData = musicbrainz.formatAlbumGetData(data);
		res.status(200).json(formattedData);
	} catch (error) {
		if (error.message == "Not Found") {
			return res.status(404).json({ error: "Artist not found" } as SAMBLApiError);
		}
		logger.error("Error in getMusicBrainzFeaturedAlbums API", error);
		res.status(500).json({ error: "Internal Server Error", details: error.message } as SAMBLApiError);
	}
}
