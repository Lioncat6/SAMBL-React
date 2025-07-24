import spotify from "./providers/spotify";
import musicbrainz from "./providers/musicbrainz";

export default async function handler(req, res) {
	try {
		const { mbid, offset, limit } = req.query;
		const forceRefresh = Object.prototype.hasOwnProperty.call(req.query, "forceRefresh");
		if (!mbid || !musicbrainz.validateMBID(mbid)) {
			return res.status(400).json({ error: "Parameter `mbid` is missing or malformed" });
		}
		const data = await musicbrainz.getArtistAlbums(mbid, offset, limit, { noCache: forceRefresh });
		res.status(200).json(data);
	} catch (error) {
		if (error.message == "Not Found") {
			return res.status(404).json({ error: "Artist not found" });
		}
		res.status(500).json({ error: "Internal Server Error", details: error.message });
	}
}
