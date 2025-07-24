import spotify from "./providers/spotify";
import musicbrainz from "./providers/musicbrainz";

export default async function handler(req, res) {
	try {
		var { spotifyId, offset, limit } = req.query;
		const forceRefresh = Object.prototype.hasOwnProperty.call(req.query, "forceRefresh");
		if (!spotifyId || !spotify.validateSpotifyId(spotifyId)) {
			return res.status(400).json({ error: "Parameter `spotifyId` is missing or malformed" });
		} else {
            spotifyId = spotify.extractSpotifyIdFromUrl(spotifyId);
        }
		const data = await spotify.getArtistAlbums(spotifyId, offset, limit, { noCache: forceRefresh });
		res.status(200).json(data);
	} catch (error) {
		res.status(500).json({ error: "Internal Server Error", details: error.message });
	}
}
