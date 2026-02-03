import musicbrainz from "./providers/musicbrainz";
import providers from "./providers/providers";
import logger from "../../utils/logger";
import { AlbumObject, ExtendedAlbumObject, PartialArtistObject, ProviderWithCapabilities } from "../../types/provider-types";
import { DeepSearchData, DeepSearchMethod, SAMBLApiError } from "../../types/api-types"
import { IArtist } from "musicbrainz-api";
import { NextApiRequest, NextApiResponse } from "next";
import stringSimilarity  from 'string-similarity';
import normalizeVars from "../../utils/normalizeVars";
import processAlbumData from "../../utils/processAlbumData";

//TODO: Implement URL based deep search as a preliminary check before checking UPCs
export default async function handler(req: NextApiRequest, res: NextApiResponse) {;
    try {
        let { provider_id, provider, url, count } = normalizeVars(req.query);
        if (!provider_id && !url) {
            return res.status(400).json({ error: "Parameter `id` or `url` is required" } as SAMBLApiError);
        }
        if (provider_id && !provider) {
            return res.status(400).json({ error: "Parameter `provider` is required when using `provider_id`" } as SAMBLApiError);
        }
        const albumCount = count && Number.parseInt(count) || 5;
        let parsed_id: string | null;
        let sourceProvider: ProviderWithCapabilities<["getAlbumById", "getAlbumUPCs", "getArtistAlbums", "getArtistById", "formatAlbumGetData", "formatAlbumObject", "formatArtistObject", "formatArtistLookupData"]> | false | null = null;
        if (url) {
            let urlInfo = providers.getUrlInfo(url);
            if (!urlInfo) {
                return res.status(404).json({ error: "Invalid provider URL" } as SAMBLApiError);
            }
            if (urlInfo.type !== "artist") {
                return res.status(400).json({ error: `Invalid URL type. Expected an artist URL.` } as SAMBLApiError);
            }
            parsed_id = urlInfo.id;
            if (!parsed_id) {
                return res.status(500).json({ error: "Failed to extract provider id from URL" } as SAMBLApiError);
            }
            provider = urlInfo.provider;
            sourceProvider = providers.parseProvider(urlInfo.provider, ["getAlbumById", "getAlbumUPCs", "getArtistAlbums", "getArtistById", "formatAlbumGetData", "formatAlbumObject", "formatArtistObject", "formatArtistLookupData"]);
        } else if (provider_id && provider) {
            sourceProvider = providers.parseProvider(provider, ["getAlbumById", "getAlbumUPCs", "getArtistAlbums", "getArtistById", "formatAlbumGetData", "formatAlbumObject", "formatArtistObject", "formatArtistLookupData"]);
            parsed_id = provider_id
        } else {
            return res.status(400).json({ error: "Parameters `provider_id` and `provider` are required when not using `url`" } as SAMBLApiError);
        }
        if (!sourceProvider) {
            return res.status(400).json({ error: `Provider \`${provider}\` does not support this operation` } as SAMBLApiError);
        }
        let artistInfo = await sourceProvider.getArtistById(parsed_id);
        if (artistInfo == null) {
            return res.status(404).json({ error: "Artist not found!" } as SAMBLApiError);
        }

        let formattedArtistInfo = sourceProvider.formatArtistObject(sourceProvider.formatArtistLookupData(artistInfo));
        let artistName = formattedArtistInfo.name;
        let results = await sourceProvider.getArtistAlbums(parsed_id);
        //TODO: Implement paging here (in case people want to just check the whole discography for some reason)
        let data = sourceProvider.formatAlbumGetData(results);
        if (data == null) {
            return res.status(404).json({ error: "Artist albums not found!" } as SAMBLApiError);
        }
        let albumData: AlbumObject[] = data?.albums?.map(album => sourceProvider.formatAlbumObject(album)) || [];
        let upcs = albumData.map(album => album.upc).filter(upc => upc);
        if (albumData.some((album) => album.upc && album.upc?.length > 0)) {
            upcs = albumData.map(album => album.upc);
        } else {  
            const albums = [ ...albumData];
            albumData.length = 0;
            for (let i = 0; i < albums.length && i < albumCount; i++) {
                let album = albums[i]
                const rawAlbum = await sourceProvider.getAlbumById((album.provider == "bandcamp" ? album.url : album.id));
                const fullAlbum = sourceProvider.formatAlbumObject(rawAlbum);
                albumData.push(fullAlbum);
            }
            upcs = albumData.map(album => album.upc);
        }
        if (upcs.length === 0) {
            return res.status(404).json({ error: "No UPCs found!" } as SAMBLApiError);
        }
        let mbAlbums: ExtendedAlbumObject[] = [];
        let artists: PartialArtistObject[] = []
        let upcArtistArray: Map<string, IArtist[]> = new Map();
        if (albumData.length > albumCount) {
            albumData.length = albumCount;
        }
        for (const album of albumData) {
            const upc = album.upc;
            if (!upc) continue;
            const mbMatch = await musicbrainz.getAlbumByUPC(upc);
            if (mbMatch && mbMatch.releases?.length > 0){
                if (!upcArtistArray.has(upc)) {
                    upcArtistArray.set(upc, []);
                }
                const artistArray = upcArtistArray.get(upc)!;
                for (const release of mbMatch?.releases) {
                    mbAlbums.push(musicbrainz.formatAlbumObject(release));
                    if (!release["artist-credit"]) continue;
                    for (const credit of release["artist-credit"]) {
                        artistArray.push(credit.artist);
                        artists.push(musicbrainz.formatPartialArtistObject(credit.artist));
                    }
                }
            }
        }

        if (artists.length === 0) {
            return res.status(404).json({ error: "No artists found!" } as SAMBLApiError);
        }
        const mbidCounts = artists.reduce((acc: {[mbid: string]: {count: number, artist: IArtist}}, artist) => {
            acc[artist.id] = acc[artist.id] || { count: 0, artist };
            acc[artist.id].count += 1;
            return acc;
        }, {});

        const maxCount = Math.max(...Object.values(mbidCounts).map(obj => obj.count));
        const mostCommonArtists = Object.values(mbidCounts)
            .filter(obj => obj.count === maxCount)
            .map(obj => obj.artist);

        let mostCommonArtist: IArtist;
        let mostCommonMbid: string | null = null;
        let bestArtist: IArtist | null = null;
        let method: DeepSearchMethod | null = null;
        let nameSimilarity: number | null = null;
        if (mostCommonArtists.length > 1) {
            method = "name_similarity";
            mostCommonMbid = "tie";
            const candidateNames = mostCommonArtists.map(a => a.name.toLowerCase());
            const matches = stringSimilarity.findBestMatch(artistName.toLowerCase(), candidateNames);
            const bestMatchIndex: number = matches.bestMatchIndex;
            mostCommonArtist = mostCommonArtists[bestMatchIndex];
            bestArtist = mostCommonArtist;
        } else {
            method = "most_common";
            mostCommonMbid = mostCommonArtists[0].id;
            bestArtist = mostCommonArtists[0];
            mostCommonArtist = mostCommonArtists[0]; // single artist
        }

        nameSimilarity = stringSimilarity.compareTwoStrings(artistName, bestArtist.name);

        const formattedAlbumData = processAlbumData(albumData, mbAlbums);

        const dsData: DeepSearchData = { 
            provider: sourceProvider.namespace, 
            mbid: bestArtist.id, 
            nameSimilarity: nameSimilarity, 
            sourceName: artistName, 
            mbName: bestArtist.name, 
            method: method, 
            mostCommonMbid: mostCommonMbid, 
            artists: artists,
            albums: formattedAlbumData.albumData 
        };

        res.status(200).json(dsData);
    } catch (error) {
        logger.error("Error in artistDeepSearch API:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message } as SAMBLApiError);
    }
}