import spotify from "./providers/spotify";
import musicbrainz from "./providers/musicbrainz";

export default async function handler(req, res) {
	const { spotifyId, offset, limit } = req.query;
	try {
		const data = await spotify.getArtistAlbums(spotifyId, offset, limit);
		res.status(200).json(data);
	} catch (error) {
		console.error("Error: " + error);
		res.status(500).json({ error: "Failed to fetch artist albums" });
	}
    
}
