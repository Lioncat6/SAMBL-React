import spotify from "./providers/spotify";
import musicbrainz from "./providers/musicbrainz";

export default async function handler(req, res) {
	const { spotifyId } = req.query;
	spotify.getArtistAlbums(spotifyId).then(
		function (data) {
			console.log(data.body);
		},
		function (error) {
			console.error("Error: " + error);
		}
	);
    res.status(200).json({ message: "ok" });
}
