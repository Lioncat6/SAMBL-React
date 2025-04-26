import spotify  from "./providers/spotify";
import musicbrainz from "./providers/musicbrainz";

export default async function handler(req, res) {
    try {
        const { spotifyId } = req.query;
        let spArtist = await spotify.getArtistById(spotifyId);
        if (spArtist != null) {
            return res.status(200).json(spArtist);
        } else {
            res.status(404).json({ error: "Spotify artist not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}