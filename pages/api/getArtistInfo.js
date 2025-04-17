import spotify  from "./providers/spotify";
import musicbrainz from "./providers/musicbrainz";

export default async function handler(req, res) {
    const { spotifyId } = req.query;
    let spArtist = await spotify.getArtistById(spotifyId)
    if (spArtist != null){
        return res.status(200).json(spArtist);
    } else {
        res.status(404).json({error: "Spotify artist not found"});
    }
}