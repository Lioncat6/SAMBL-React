import logger from "../../utils/logger";
import spotify from "./providers/spotify";
import musicbrainz from "./providers/musicbrainz";

import processData from "../../utils/processAlbumData";

export default async function handler(req, res) {
    try {
		var { spotifyId, mbid } = req.query;
        if (!spotifyId || !spotify.validateSpotifyId(spotifyId)) {
			return res.status(400).json({ error: "Parameter `spotifyId` is missing or malformed" });
		} else {
			spotifyId = spotify.extractSpotifyIdFromUrl(spotifyId);
		}

		if (mbid & !musicbrainz.validateMBID(mbid)) {
			return res.status(400).json({ error: "Parameter `mbid` is missing or malformed" });
		}

        let spotifyAlbum = await spotify.getAlbumBySpotifyId(spotifyId, { noCache: true });
        if (!spotifyAlbum) {
            return res.status(404).json({ error: "Spotify album not found" });
        }
        let mbAlbum = null;
        let urlResults = (await musicbrainz.getAlbumsBySourceUrls([spotifyAlbum.external_urls.spotify], ["release-rels"], { noCache: true })).urls[0];
        if (urlResults && urlResults?.relations.length > 0) {
            mbAlbum = await musicbrainz.getAlbumByMBID(urlResults.relations[0].release.id, ["artist-rels", "recordings", "isrcs"], { noCache: true });
            console.log(mbAlbum)
        } else {
            let mbSearch = await musicbrainz.serachForAlbumByArtistAndTitle(mbid, spotifyAlbum.name)
            if (mbSearch && mbSearch?.releases.length > 0) {
                mbAlbum = await musicbrainz.getAlbumByMBID(mbSearch.releases[0].id, ["artist-rels", "recordings", "isrcs"], { noCache: true });
            }
        }

        let albumData = processData([spotifyAlbum], [mbAlbum], mbid);
        if (albumData?.albumData && albumData?.albumData.length > 0) {
            res.status(200).json(albumData.albumData[0]);
        }
    } catch (error) {
		logger.error("Error in CompareSingleAlbum API", error);
		res.status(500).json({ error: "Internal Server Error", details: error.message });
	}
}