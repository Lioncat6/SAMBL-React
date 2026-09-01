import musicbrainz from "../../lib/providers/musicbrainz";
import providers from "../../lib/providers/providers";
import logger from "../../utils/logger";
import { AlbumObject, ArtistObject, ExtendedAlbumObject, PartialArtistObject, ProviderWithCapabilities, UrlMBIDDict } from "../../types/provider-types";
import { DeepSearchArtist, DeepSearchData, DeepSearchMethod, SAMBLApiError, SAMBLAPIResponse } from "../../types/api-types"
import { IArtist } from "musicbrainz-api";
import { NextApiRequest, NextApiResponse } from "next";
import stringSimilarity from 'string-similarity';
import normalizeVars from "../../utils/normalizeVars";
import processAlbumData from "../../utils/processAlbumData";
import text from "../../utils/text";
import parsers from "../../lib/parsers/parsers";
import medium from "../../utils/medium";
import { Stages } from "../../utils/timings";

//TODO: Implement URL based deep search as a preliminary check before checking UPCs
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const stages = new Stages()
    try {
        let { provider_id, provider, url, count, searchURLs, searchUPCs, trackArtists } = normalizeVars(req.query);

        if (!provider_id && !url) {
            return res.status(400).json({ error: { error: "Parameter `id` or `url` is required" }, timings: stages.finish() } as SAMBLAPIResponse<DeepSearchData>);
        }
        if (provider_id && !provider) {
            return res.status(400).json({ error: { error: "Parameter `provider` is required when using `provider_id`" }, timings: stages.finish() } as SAMBLAPIResponse<DeepSearchData>);
        }
        const albumCount = count && Number.parseInt(count) || 5;
        let parsed_id: string | null;
        let sourceProvider: ProviderWithCapabilities<["getAlbumById", "formatAlbumObject", "getArtistAlbums", "getArtistById", "formatAlbumGetData", "formatAlbumObject", "formatArtistObject", "formatArtistLookupData"]> | false | null = null;
        if (url) {
            let urlInfo = providers.getUrlInfo(url);
            if (!urlInfo) {
                return res.status(404).json({ error: { error: "Invalid provider URL" }, timings: stages.finish() } as SAMBLAPIResponse<DeepSearchData>);
            }
            if (urlInfo.type !== "artist") {
                return res.status(400).json({ error: { error: `Invalid URL type. Expected an artist URL.` }, timings: stages.finish() } as SAMBLAPIResponse<DeepSearchData>);
            }
            parsed_id = urlInfo.id;
            if (!parsed_id) {
                return res.status(500).json({ error: { error: "Failed to extract provider id from URL" }, timings: stages.finish() } as SAMBLAPIResponse<DeepSearchData>);
            }
            provider = urlInfo.provider;
            sourceProvider = providers.parseProvider(urlInfo.provider, ["getAlbumById", "formatAlbumObject", "getArtistAlbums", "getArtistById", "formatAlbumGetData", "formatAlbumObject", "formatArtistObject", "formatArtistLookupData"]);
        } else if (provider_id && provider) {
            sourceProvider = providers.parseProvider(provider, ["getAlbumById", "formatAlbumObject", "getArtistAlbums", "getArtistById", "formatAlbumGetData", "formatAlbumObject", "formatArtistObject", "formatArtistLookupData"]);
            parsed_id = provider_id
        } else {
            return res.status(400).json({ error: { error: "Parameters `provider_id` and `provider` are required when not using `url`" }, timings: stages.finish() } as SAMBLAPIResponse<DeepSearchData>);
        }
        if (!sourceProvider) {
            return res.status(400).json({ error: { error: `Provider \`${provider}\` does not support this operation` }, timings: stages.finish() } as SAMBLAPIResponse<DeepSearchData>);
        }
        let artistInfo = await stages.await('Get artist info', sourceProvider.getArtistById(parsed_id), sourceProvider.namespace);
        if (artistInfo == null) {
            return res.status(404).json({ error: { error: "Artist not found!" }, timings: stages.finish() } as SAMBLAPIResponse<DeepSearchData>);
        }

        let useUPCs = !(searchUPCs == "false");
        let useURLs = (searchURLs == "true");
        let useTrackArtists = (trackArtists == "true");

        let formattedArtistInfo = sourceProvider.formatArtistObject(sourceProvider.formatArtistLookupData(artistInfo));
        let artistName = formattedArtistInfo.name;
        let results = await stages.await('Get artist albums', sourceProvider.getArtistAlbums(parsed_id), sourceProvider.namespace);
        //TODO: Implement paging here (in case people want to just check the whole discography for some reason)
        let data = sourceProvider.formatAlbumGetData(results);
        if (data == null) {
            return res.status(404).json({ error: { error: "Artist albums not found!" }, timings: stages.finish() } as SAMBLAPIResponse<DeepSearchData>);
        }
        let albumData: AlbumObject[] = data?.albums?.map(album => sourceProvider.formatAlbumObject(album)) || [];
        let upcs = albumData.map(album => album.upc).filter(upc => upc);
        if (albumData.some((album) => album.upc && album.upc?.length > 0)) {
            upcs = albumData.map(album => album.upc);
        } else {
            stages.start('Fetch album UPCs', sourceProvider.namespace);
            const albums = [...albumData];
            albumData.length = 0;
            for (let i = 0; i < albums.length && i < albumCount; i++) {
                let album = albums[i]
                const rawAlbum = await sourceProvider.getAlbumById(album.id);
                const fullAlbum = sourceProvider.formatAlbumObject(rawAlbum);
                albumData.push(fullAlbum);
            }
            upcs = albumData.map(album => album.upc);
            stages.end('Fetch album UPCs')
        }
        upcs = albumData.map(album => album.upc).filter(upc => upc);
        let mbAlbums: ExtendedAlbumObject[] = [];
        let artists: PartialArtistObject[] = []
        let upcArtistArray: Map<string, PartialArtistObject[]> = new Map();
        let urlArtistArray: Map<string, PartialArtistObject[]> = new Map();
        if (albumData.length > albumCount) {
            albumData.length = albumCount;
        }
        let albumMBIDs: string[] = [];
        if (useURLs) {
            stages.start('Lookup provider URLs', 'musicbrainz');
            const regexProvider = providers.parseProvider(sourceProvider, ['buildUrlSearchQuery'])
            const parser = parsers.getParser(sourceProvider.namespace);
            let urlResults: UrlMBIDDict | null = null;
            if (regexProvider) {
                let albumIDMap: Map<string, AlbumObject[]> = new Map();
                albumData.forEach((album) => {
                    const id = album.id;
                    if (!id) return
                    if (!albumIDMap.has(id)) albumIDMap.set(id, []);
                    albumIDMap.get(id)?.push(album);
                });
                let albumUrlMap: Map<string, AlbumObject[]> = new Map();
                albumData.forEach((album) => {
                    const url = album.url.url;
                    if (!url) return
                    if (!albumUrlMap.has(url)) albumUrlMap.set(url, []);
                    albumUrlMap.get(url)?.push(album);
                });
                let regexQuery = regexProvider.buildUrlSearchQuery('album', Array.from(albumUrlMap.keys()))
                if (regexQuery) {
                    urlResults = await musicbrainz.getIdsByUrlQuery(regexQuery, 'release', ["release-rels", "artist-rels", "url-rels"]);
                }
            } else {
                urlResults = await musicbrainz.getIdsByExternalUrls(albumData.map((album) => album.url.url), 'release', ["release-rels", "artist-rels", "url-rels"]);
            }
            stages.end('Lookup provider URLs');
            if (urlResults) {
                stages.start('Get full MusicBrainz album data from URLs', 'musicbrainz')
                for (const urlOrId of Object.keys(urlResults)) {
                    const mbid = urlResults[urlOrId]!;
                    albumMBIDs.push(mbid);
                    let url = regexProvider ? parser.createUrl('album', urlOrId).url : urlOrId;
                    const fullAlbum = await musicbrainz.getAlbumByMBID(mbid, ['artist-credits', 'recordings']);
                    const formattedAlbum = musicbrainz.formatAlbumObject(fullAlbum);
                    if (!urlArtistArray.has(url)) {
                        urlArtistArray.set(url, []);
                    }
                    const artistArray = urlArtistArray.get(url)!;
                    mbAlbums.push(formattedAlbum);
                    formattedAlbum.albumArtists.forEach((artist) => {
                        artistArray.push(artist);
                        artists.push(artist);
                    })
                    if (useTrackArtists) {
                        formattedAlbum.mediums.flatMap(medium => medium.tracks).forEach((track) => track.trackArtists.forEach((artist) => {
                            artistArray.push(artist);
                            artists.push(artist);
                        }))
                    }
                }
                stages.end('Get full MusicBrainz album data from URLs')
            }
        }
        if (useUPCs) {
            stages.start('Lookup provider UPCs', sourceProvider.namespace);
            for (const album of albumData) {
                if (album.upc) {
                    const upc = album.upc;
                    const mbMatch = await musicbrainz.getAlbumByUPC(upc);
                    if (mbMatch && mbMatch.length > 0) {
                        if (!upcArtistArray.has(upc)) {
                            upcArtistArray.set(upc, []);
                        }
                        const artistArray = upcArtistArray.get(upc)!;
                        for (const release of mbMatch) {
                            if (!albumMBIDs.includes(release.id)) {
                                let formattedAlbum = release;
                                if (useTrackArtists) {
                                    const fullAlbum = await musicbrainz.getAlbumByMBID(release.id, ['artist-credits', 'recordings']);
                                    formattedAlbum = musicbrainz.formatAlbumObject(fullAlbum);
                                }
                                mbAlbums.push(formattedAlbum);
                                formattedAlbum.albumArtists.forEach((artist) => {
                                    artistArray.push(artist);
                                    artists.push(artist);
                                })
                                formattedAlbum.mediums.flatMap(medium => medium.tracks).forEach((track) => track.trackArtists.forEach((artist) => {
                                    artistArray.push(artist);
                                    artists.push(artist);
                                }))
                            }
                        }
                    }
                }
            }
            stages.end('Lookup provider UPCs');
        }
        const mbidCounts = artists.reduce((acc: { [mbid: string]: { count: number, artist: IArtist } }, artist) => {
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

        function getSimilarity(name: string) {
            return stringSimilarity.compareTwoStrings(text.normalizeText(artistName), text.normalizeText(name));
        }

        const formattedAlbumData = processAlbumData(albumData, [], mbAlbums, sourceProvider.namespace, formattedArtistInfo);

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


        let topArtists = finalArtists.filter(artist => artist.mostCommonMBID);

        topArtists = topArtists.sort((a, b) => b.nameSimilarity - a.nameSimilarity);

        let remainingArtists = finalArtists.filter(artist => !artist.mostCommonMBID);

        remainingArtists = remainingArtists.sort((a, b) => b.nameSimilarity - a.nameSimilarity);

        finalArtists = [...topArtists, ...remainingArtists];

        const dsData: DeepSearchData = {
            provider: sourceProvider.namespace,
            mbArtists: finalArtists,
            albums: formattedAlbumData.albumData,
            sourceArtist: formattedArtistInfo
        };

        res.status(200).json({ data: dsData, timings: stages.finish() } as SAMBLAPIResponse<DeepSearchData>);
    } catch (error) {
        logger.error("Error in artistDeepSearch API:", error);
        res.status(500).json({ error: { error: "Internal Server Error", details: error.message }, timings: stages.finish() } as SAMBLAPIResponse<DeepSearchData>);
    }
}