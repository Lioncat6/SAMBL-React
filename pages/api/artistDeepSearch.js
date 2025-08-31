import musicbrainz from "./providers/musicbrainz";
import providers from "./providers/providers";
import logger from "../../utils/logger";
const stringSimilarity = require('string-similarity');

export default async function handler(req, res) {
    try {
        let { provider_id, provider, url } = req.query;
        if (!provider_id && !url) {
            return res.status(400).json({ error: "Parameter `id` or `url` is required" });
        }
        if (provider_id && !provider) {
            return res.status(400).json({ error: "Parameter `provider` is required when using `id`" });
        }
        let sourceProvider = null;
        if (url) {
            let urlInfo = providers.getUrlInfo(url);
            if (!urlInfo) {
                return res.status(404).json({ error: "Invalid provider URL" });
            }
            if (urlInfo.type !== "artist") {
                return res.status(400).json({ error: `Invalid URL type. Expected an artist URL.` });
            }
            provider_id = urlInfo.id;
            provider = urlInfo.provider.namespace;
            sourceProvider = providers.parseProvider(urlInfo.provider, ["getAlbumById", "getAlbumUPCs", "getArtistAlbums", "getArtistById", "formatAlbumGetData", "formatAlbumObject"]);
        } else {
            sourceProvider = providers.parseProvider(provider, ["getAlbumById", "getAlbumUPCs", "getArtistAlbums", "getArtistById"]);
        }
        if (!sourceProvider) {
            return res.status(400).json({ error: `Provider \`${provider}\` does not support this operation` });
        }
        let artistInfo = await sourceProvider.getArtistById(provider_id);
        if (artistInfo == null) {
            return res.status(404).json({ error: "Artist not found!" });
        }

        let formattedArtistInfo = sourceProvider.formatArtistObject(sourceProvider.formatArtistLookupData(artistInfo));
        let artistName = formattedArtistInfo.name;
        let results = await sourceProvider.getArtistAlbums(provider_id);
        let data = sourceProvider.formatAlbumGetData(results);
        if (data == null) {
            return res.status(404).json({ error: "Artist albums not found!" });
        }
		data.albums = data?.albums?.map(album => sourceProvider.formatAlbumObject(album)) || [];
        let albumData = []
        if (data.albums[0]?.albumbarcode) {
            upcs = data.albums.map(album => album.albumbarcode);
        } else {  
            for (let i = 0; i < data.albums.length && i < 5; i++) {
                let album = data.albums[i];
                let fullAlbum = await sourceProvider.getAlbumById((album.provider == "bandcamp" ? album.url : album.id));
                fullAlbum = sourceProvider.formatAlbumObject(fullAlbum);
                albumData.push(fullAlbum);
            }
        }
        let upcs = albumData.map(album => album.upc).filter(upc => upc);
        if (upcs.length === 0) {
            return res.status(404).json({ error: "No UPCs found!" });
        }
        let artists = []
        for (const album of albumData) {
            let upc = album.upc;
            if (upc){
                let mbAlbum = await musicbrainz.getAlbumByUPC(upc);
                if (mbAlbum.releases.length > 0) {
                    album.mbArtists = [];
                    for (const credit of mbAlbum.releases[0]["artist-credit"]) {
                        album.mbArtists.push(credit.artist);
                        artists.push(credit.artist);
                    }
                }
            }
        }
        if (artists.length === 0) {
            return res.status(404).json({ error: "No artists found!" });
        }
        const mbidCounts = artists.reduce((acc, artist) => {
            acc[artist.id] = acc[artist.id] || { count: 0, artist };
            acc[artist.id].count += 1;
            return acc;
        }, {});

        const maxCount = Math.max(...Object.values(mbidCounts).map(obj => obj.count));
        const mostCommonArtists = Object.values(mbidCounts)
            .filter(obj => obj.count === maxCount)
            .map(obj => obj.artist);

        let mostCommonArtist;
        let mostCommonMbid = null;
        let bestArtist = null;
        let method = null;
        let nameSimilarity = null;
        if (mostCommonArtists.length > 1) {
            method = "name_similarity";
            mostCommonMbid = "tie";
            const candidateNames = mostCommonArtists.map(a => a.name.toLowerCase());
            const matches = stringSimilarity.findBestMatch(artistName.toLowerCase(), candidateNames);
            const bestMatchIndex = matches.bestMatchIndex;
            mostCommonArtist = mostCommonArtists[bestMatchIndex];
            bestArtist = mostCommonArtist;
        } else {
            method = "most_common";
            mostCommonMbid = mostCommonArtists[0].id;
            bestArtist = mostCommonArtists[0];
            mostCommonArtist = mostCommonArtists[0]; // single artist
        }

        nameSimilarity = stringSimilarity.compareTwoStrings(artistName, bestArtist.name);

        const formattedAlbumData = albumData.map(album => ({
            title: album.name,
            url: album.url,
            upc: album.upc,
            artists: album.mbArtists
        }));

        res.status(200).json({ provider: provider, mbid: bestArtist.id, nameSimilarity: nameSimilarity, sourceName: artistName, mbName: bestArtist.name, method: method, mostCommonMbid: mostCommonMbid, artists: artists, albums: formattedAlbumData });
    } catch (error) {
        logger.error("Error in artistDeepSearch API:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}