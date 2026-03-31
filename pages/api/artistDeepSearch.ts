import musicbrainz from "../../lib/providers/musicbrainz";
import providers from "../../lib/providers/providers";
import logger from "../../utils/logger";
import { AlbumObject, ArtistObject, ExtendedAlbumObject, PartialArtistObject, ProviderWithCapabilities } from "../../types/provider-types";
import { DeepSearchArtist, DeepSearchData, DeepSearchMethod, SAMBLApiError } from "../../types/api-types"
import { IArtist } from "musicbrainz-api";
import { NextApiRequest, NextApiResponse } from "next";
import stringSimilarity  from 'string-similarity';
import normalizeVars from "../../utils/normalizeVars";
import processAlbumData from "../../utils/processAlbumData";
import text from "../../utils/text";

//TODO: Implement URL based deep search as a preliminary check before checking UPCs
export default async function handler(req: NextApiRequest, res: NextApiResponse) {;
    try {
        let { provider_id, provider, url, count, searchURLs, searchUPCs, trackArtists } = normalizeVars(req.query);

        if (!provider_id && !url) {
            return res.status(400).json({ error: "Parameter `id` or `url` is required" } as SAMBLApiError);
        }
        if (provider_id && !provider) {
            return res.status(400).json({ error: "Parameter `provider` is required when using `provider_id`" } as SAMBLApiError);
        }
        const albumCount = count && Number.parseInt(count) || 5;
        let parsed_id: string | null;
        let sourceProvider: ProviderWithCapabilities<["getAlbumById", "formatAlbumObject", "getArtistAlbums", "getArtistById", "formatAlbumGetData", "formatAlbumObject", "formatArtistObject", "formatArtistLookupData"]> | false | null = null;
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
            sourceProvider = providers.parseProvider(urlInfo.provider, ["getAlbumById", "formatAlbumObject", "getArtistAlbums", "getArtistById", "formatAlbumGetData", "formatAlbumObject", "formatArtistObject", "formatArtistLookupData"]);
        } else if (provider_id && provider) {
            sourceProvider = providers.parseProvider(provider, ["getAlbumById", "formatAlbumObject", "getArtistAlbums", "getArtistById", "formatAlbumGetData", "formatAlbumObject", "formatArtistObject", "formatArtistLookupData"]);
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

        let useUPCs = true;
        if (searchUPCs == "false") {
            useUPCs = false;
        }
        let useURLs = false;
        if (searchURLs == "true") {
            useURLs = true;
        }
        let useTrackArtists = false;
        if (trackArtists == "true"){
            useTrackArtists = true;
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
                const rawAlbum = await sourceProvider.getAlbumById(album.id);
                const fullAlbum = sourceProvider.formatAlbumObject(rawAlbum);
                albumData.push(fullAlbum);
            }
            upcs = albumData.map(album => album.upc);
        }
        upcs = albumData.map(album => album.upc).filter(upc => upc);
        let mbAlbums: ExtendedAlbumObject[] = [];
        let artists: PartialArtistObject[] = []
        let upcArtistArray: Map<string, PartialArtistObject[]> = new Map();
        if (albumData.length > albumCount) {
            albumData.length = albumCount;
        }
        for (const album of albumData) {
            const upc = album.upc;
            if (!upc) continue;
            const mbMatch = await musicbrainz.getAlbumByUPC(upc);
            if (mbMatch && mbMatch.length > 0){
                if (!upcArtistArray.has(upc)) {
                    upcArtistArray.set(upc, []);
                }
                const artistArray = upcArtistArray.get(upc)!;
                for (const release of mbMatch) {
                    let formattedAlbum = release;
                    if (useTrackArtists){
                        const fullAlbum = await musicbrainz.getAlbumByMBID(release.id, ['artist-credits', 'recordings']);
                        formattedAlbum = musicbrainz.formatAlbumObject(fullAlbum);
                    }
                    mbAlbums.push(formattedAlbum);
                    formattedAlbum.albumArtists.forEach((artist) => {
                        artistArray.push(artist);
                        artists.push(artist);
                    })  
                    formattedAlbum.albumTracks.forEach((track) => track.trackArtists.forEach((artist) => {
                        artistArray.push(artist);
                        artists.push(artist);
                    }))
                }
            }
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
        const mostCommonIds = mostCommonArtists.map(artist => artist.id)
        // let mostCommonArtist: IArtist;
        // let mostCommonMbid: string | null = null;
        // let bestArtist: IArtist | null = null;
        // let method: DeepSearchMethod | null = null;
        // let nameSimilarity: number | null = null;
        // if (mostCommonArtists.length > 1) {
        //     method = "name_similarity";
        //     mostCommonMbid = "tie";
        //     const candidateNames = mostCommonArtists.map(a => a.name.toLowerCase());
        //     const matches = stringSimilarity.findBestMatch(artistName.toLowerCase(), candidateNames);
        //     const bestMatchIndex: number = matches.bestMatchIndex;
        //     mostCommonArtist = mostCommonArtists[bestMatchIndex];
        //     bestArtist = mostCommonArtist;
        // } else {
        //     method = "most_common";
        //     mostCommonMbid = mostCommonArtists[0].id;
        //     bestArtist = mostCommonArtists[0];
        //     mostCommonArtist = mostCommonArtists[0]; // single artist
        // }

        function getSimilarity(name: string){
            return stringSimilarity.compareTwoStrings(text.normalizeText(artistName), text.normalizeText(name));
        }

        const formattedAlbumData = processAlbumData(albumData, mbAlbums, undefined, undefined, sourceProvider.namespace);

        let finalArtists: DeepSearchArtist[] = []

        artists.forEach((artist) => {
            if (finalArtists.some((fa) => fa.id == artist.id)) return;
            finalArtists.push({
                ...artist,
                nameSimilarity: getSimilarity(artist.name),
                occurrences: mbidCounts[artist.id].count || null,
                mostCommonMBID: mostCommonIds.includes(artist.id)
            })
        })

        finalArtists = finalArtists.sort((a, b) => {
            const aIsCommon = mostCommonIds.includes(a.id) ? 0 : 1;
            const bIsCommon = mostCommonIds.includes(b.id) ? 0 : 1;
            return aIsCommon !== bIsCommon ? aIsCommon - bIsCommon : b.nameSimilarity - a.nameSimilarity;
        })

        const dsData: DeepSearchData = { 
            provider: sourceProvider.namespace, 
            mbArtists: finalArtists,
            albums: formattedAlbumData.albumData,
            sourceArtist: formattedArtistInfo
        };

        res.status(200).json(dsData);
    } catch (error) {
        logger.error("Error in artistDeepSearch API:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message } as SAMBLApiError);
    }
}