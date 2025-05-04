import spotify from "./providers/spotify";
import musicbrainz from "./providers/musicbrainz";

export default async function handler(req, res) {
	try {
		const { mbid, offset, limit } = req.query;
		if (!mbid || !musicbrainz.validateMBID(mbid)) {
			return res.status(400).json({ error: "Parameter `mbid` is missing or malformed" });
		}
		const data = await musicbrainz.getArtistFeaturedAlbums(mbid, offset, limit);
		res.status(200).json(data);
	} catch (error) {
		console.error("Error: " + error);
		res.status(500).json({ error: "Internal Server Error", details: error.message });
	}
}
