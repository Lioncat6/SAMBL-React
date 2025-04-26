import spotify from "./providers/spotify";
import musicbrainz from "./providers/musicbrainz";

export default async function handler(req, res) {
    try {
        const { query } = req.query;
        let results = await spotify.searchByArtistName(query);
        let artistUrls = [];
        let artistData = {}
        for (let artist of results.artists.items) {
            artistUrls.push(artist.external_urls.spotify)
            artistData[artist.external_urls.spotify] = {
                name: artist.name,
                imageUrl: artist.images[0]?.url || "",
                genres: artist.genres.join(", "), // Convert genres array to a string
                followers: artist.followers.total,
                spotifyId: artist.id,
            }
        }
        let mbids = await musicbrainz.getIdsBySpotifyUrls(artistUrls);
        for (let url of artistUrls) {
            artistData[url].mbid = mbids[url] || null
        }
        res.status(200).json(artistData);
	} catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}