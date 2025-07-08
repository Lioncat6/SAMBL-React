import spotify from "./providers/spotify";
import musicbrainz from "./providers/musicbrainz";

export default async function handler(req, res) {
    try {
        var { spotifyId } = req.query;
        if (!spotifyId || !spotify.validateSpotifyId(spotifyId)) {
			return res.status(400).json({ error: "Parameter `spotifyId` is missing or malformed" });
		} else {
            spotifyId = spotify.extractSpotifyIdFromUrl(spotifyId);
        }
        let spArtist = await spotify.getArtistById(spotifyId)
        if (spArtist != null) {
            let mbid = await musicbrainz.getIdBySpotifyId(spotifyId)
            if (mbid != null) {
                res.status(200).json(mbid);
            } else {
                res.status(200).json(null);
            }
        } else {
            res.status(404).json({ error: "Spotify artist not found" });
        }
	} catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}