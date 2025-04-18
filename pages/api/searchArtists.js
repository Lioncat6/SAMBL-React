import spotify  from "./providers/spotify";
import musicbrainz from "./providers/musicbrainz";

export default async function handler(req, res) {
    const { query } = req.query;
    let results = await spotify.searchByArtistName(query);
    let artistUrls = [];
    for(let artist of results.artists.items){
        artistUrls.push(artist.external_urls.spotify)
    }
    console.log(artistUrls)
    let mbids = await musicbrainz.getIdsBySpotifyUrls(artistUrls);
    let urls = {}
    console.log(mbids)
    for (let url of artistUrls){
        urls[url] = mbids[url]
    }
    res.status(200).json(urls);
}