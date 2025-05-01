import spotify from "./providers/spotify";
import musicbrainz from "./providers/musicbrainz";

function createDataObject(source, imageUrl, title, artists, info, link) {
    return {
        source: source,
        imageUrl: imageUrl,
        title: title,
        artists: artists,
        info: info,
        link: link
    };
}

export default async function handler(req, res) {
    const { query, type } = req.query;
    try {
        let data = [];
        if (type === "UPC") {
            const spotifyData = await spotify.getAlbumByUPC(query);
            const mbData = await musicbrainz.getAlbumByUPC(query);
            if (spotifyData.albums.items) {
                spotifyData.albums.items.forEach(album => {
                    data.push(createDataObject(
                        "spotify",
                        album.images[0].url,
                        album.name,
                        album.artists.map(artist => ({ name: artist.name, link: artist.external_urls.spotify })),
                        [album.release_date, `${album.total_tracks} tracks`, album.type],
                        album.external_urls.spotify
                    ));
                });
            }
            if (mbData.releases) {
                mbData.releases.forEach(album => {
                    data.push(createDataObject(
                        "musicbrainz",
                        null,
                        album.title,
                        album["artist-credit"].map(artist => ({ name: artist.name, link: `https://musicbrainz.org/artist/${artist.artist.id}` })),
                        [album.date, `${album["track-count"]} tracks`, album["release-group"]["primary-type"]],
                        `https://musicbrainz.org/release/${album.id}`
                    ));
                });
            }

        } else if (type === "ISRC") {
            const spotifyData = await spotify.getTrackByISRC(query);
            const mbData = await musicbrainz.getAlbumByUPC(query);
        } else {
            return res.status(400).json({ error: "Invalid type parameter" });
        }
        res.status(200).json(data);
    } catch (error) {
        console.error("Error: " + error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}