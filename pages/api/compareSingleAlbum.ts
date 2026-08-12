import logger from "../../utils/logger";
import providers from "../../lib/providers/providers"
import musicbrainz from "../../lib/providers/musicbrainz";
import processData from "../../utils/processAlbumData";
import { NextApiRequest, NextApiResponse } from "next";
import normalizeVars from "../../utils/normalizeVars";
import { IRelease } from "musicbrainz-api";
import { ArtistSearchData, SAMBLApiError } from "../../types/api-types";
import { AlbumObject, ArtistObject, PartialArtistObject, ProviderNamespace, TrackObject } from "../../types/provider-types";
import medium from "../../utils/medium";
import { AlbumStack } from "../../types/aggregated-types";
import objectUtils from "../../utils/objectUtils";

async function lookupArtists(artists: PartialArtistObject[], provider: ProviderNamespace): Promise<Map<string, string|null>> {
    let regexProvider = provider ? providers.parseProvider(provider, ["searchByArtistName", "formatArtistSearchData", "formatArtistObject", "buildUrlSearchQuery"]) : false;
    let idMap: Map<string, string|null> = new Map();
    if (regexProvider) {
        let urlQuery = regexProvider.buildUrlSearchQuery("artist", artists.map((artist) => artist.url.url));
        if (urlQuery) {
            const urlResults = await musicbrainz.getIdsByUrlQuery(urlQuery);
            if (urlResults) {
                for (let artist of artists) {
                   idMap.set(artist.id, urlResults[artist.url.url] || null);
                }
            }
            return idMap;
        }
    }
    let mbids = await musicbrainz.getIdsByExternalUrls(artists.map((artist) => artist.url.url));
    if (mbids) {
        for (let artist of artists) {
            idMap.set(artist.id, mbids[artist.url.url] || null);
        }
    }
    return idMap;
}

async function resovleArtistMBIDs(album: AlbumStack) {
    let artistProviderMap: Map<ProviderNamespace, PartialArtistObject[]> = new Map();
    
    const allAlbums = [...album.albums.map((match) => match.album), album.aggregated]
    // Get all artists
    // The flattest of flatmaps
    const allArtists = allAlbums.flatMap((album) => {
        return [
            ...album.albumArtists,
            ...album.mediums.flatMap((medium) => medium.tracks.flatMap((track) => track.trackArtists))
        ]
    })
    // Split by provider
    allArtists.forEach((artist) => {
        const list = artistProviderMap.get(artist.provider) || [];
        list.push(artist);
        artistProviderMap.set(artist.provider, list);
    });
    let idProviderMBIDMap: Map<string, string> = new Map();
    // Run lookups
    for (const providerMap of artistProviderMap) {
        let artists = providerMap[1]
        let provider = providerMap[0]
        let idData = await lookupArtists(objectUtils.deduplicate(artists), provider)
        idData.forEach((mbid, artistId) => {
            if (mbid) {
                idProviderMBIDMap.set(`${provider}/${artistId}`, mbid);
            }
        });
    }
    allArtists.forEach((artist) => {
        const mbid = idProviderMBIDMap.get(`${artist.provider}/${artist.id}`);
        if (mbid) {
            artist.mbid = mbid;
        }
    });
    return album;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        var { provider_id, provider, url, mbid, artist_id } = normalizeVars(req.query);

        const fetchISRCs: boolean = Object.prototype.hasOwnProperty.call(req.query, "fetchISRCs");
        const resolveArtists: boolean = Object.prototype.hasOwnProperty.call(req.query, "resolveArtists");

        if (provider_id && !provider) {
            return res.status(400).json({ error: "Provider must be specified when provider_id is provided" } as SAMBLApiError);
        }
        if (!provider_id && !url) {
            return res.status(400).json({ error: "Either `provider_id` or `url` must be provided" } as SAMBLApiError);
        }
        let parsed_id: string | null = null;

        if (url) {
            const urlInfo = providers.getUrlInfo(url);
            if (!urlInfo) {
                return res.status(400).json({ error: "Invalid URL" } as SAMBLApiError);
            }
            parsed_id = urlInfo.id;
            if (!parsed_id) {
                return res.status(500).json({ error: "Failed to extract provider id from URL" } as SAMBLApiError);
            }
            provider = urlInfo.provider;
        } else if (provider && provider_id) {
            parsed_id = provider_id;
        } else {
            return res.status(400).json({ error: "Parameters `provider_id` and `provider` are required when not using `url`" } as SAMBLApiError);
        }
        const providerObj = providers.parseProvider(provider || "", ["getAlbumById", "formatAlbumObject", "getTrackById", "formatTrackObject", "getArtistById", "formatArtistObject"]);

        if (!providerObj) {
            return res.status(400).json({ error: "Provider doesn't exist or doesn't support this operation" } as SAMBLApiError);
        }

        // if (!mbid || !musicbrainz.validateMBID(mbid)) {
        // 	return res.status(400).json({ error: "Parameter `mbid` is missing or malformed" } as SAMBLApiError);
        // }

        if (!providerObj) {
            return res.status(400).json({ error: "Provider doesn't exist or doesn't support this operation" } as SAMBLApiError);
        }

        const rawAlbum = await providerObj.getAlbumById(parsed_id, { noCache: true });
        if (!rawAlbum) {
            return res.status(404).json({ error: "Album not found" } as SAMBLApiError);
        }
        const sourceAlbum = providerObj.formatAlbumObject(rawAlbum);
        let mbAlbum: IRelease | null = null;
        let urlResults = (await musicbrainz.getAlbumsBySourceUrls([sourceAlbum.url.url], ["release-rels"], { noCache: true }))?.urls[0];
        let barcodeResults = sourceAlbum.upc ? (await musicbrainz.getAlbumByUPC(sourceAlbum.upc, { noCache: true })) : [];
        if (urlResults?.relations?.[0]?.release?.id || barcodeResults?.[0]?.id) {
            mbAlbum = await musicbrainz.getAlbumByMBID((urlResults?.relations?.[0]?.release?.id || barcodeResults?.[0]?.id)!, ["url-rels", "recordings", "isrcs", "recording-level-rels", "artist-credits", "label-rels", "artist-rels", "genres", "tags", "labels"], { noCache: true });
        } else if (mbid && musicbrainz.validateMBID(mbid)) {
            let mbSearch = await musicbrainz.searchForAlbumByArtistAndTitle(mbid, sourceAlbum.name, { noCache: true })
            if (mbSearch && mbSearch?.releases?.length > 0) {
                mbAlbum = await musicbrainz.getAlbumByMBID(mbSearch.releases[0].id, ["url-rels", "recordings", "isrcs", "recording-level-rels", "artist-credits", "label-rels", "artist-rels", "genres", "tags", "labels"], { noCache: true });
            }
        }
        mbAlbum = null; // Debug
        const formattedMBAlbum = mbAlbum ? musicbrainz.formatAlbumObject(mbAlbum) : null;
        let albumArtist: ArtistObject | null = null;
        if (artist_id) {
            const rawArtist = await providerObj.getArtistById(artist_id, { noCache: true });
            if (rawArtist) {
                albumArtist = providerObj.formatArtistObject(rawArtist);
            }
        }
        let albumData = processData([sourceAlbum], [], formattedMBAlbum ? [formattedMBAlbum] : [], providerObj.namespace, albumArtist);
        let album = albumData.albumData?.[0]
        if (!album) return res.status(500).json({ error: "Error processing album data" } as SAMBLApiError)
        const ISRCConfig = providerObj.config?.capabilities.isrcs;
        if (fetchISRCs && ISRCConfig?.availability != "never" && ISRCConfig?.presence == "onTrackRefresh") {
            let tracks: (TrackObject | null)[] = [];
            const sourceAlbum = album.albums.find((albumMatch) => albumMatch.type === "source")?.album as AlbumObject | null;
            const albumTracks = sourceAlbum?.mediums.flatMap((medium) => medium.tracks) || [];
            for (const track of albumTracks) {
                const rawTrack = track.id ? await providerObj.getTrackById(track.id) : null
                const formattedTrack = rawTrack ? providerObj.formatTrackObject(rawTrack) : null;
                tracks.push(formattedTrack)
            }
            let finalTracks: TrackObject[] = [];
            for (const newTrack in tracks) {
                finalTracks.push(tracks[newTrack] || albumTracks[newTrack]);
            }
            tracks.filter((track) => (track));
            const newAlbum: AlbumObject = {
                ...sourceAlbum!,
                mediums: medium.convertTrackList(finalTracks)
            }
            let finalAlbum = processData([newAlbum], [], formattedMBAlbum ? [formattedMBAlbum] : [], providerObj.namespace, albumArtist);
            let albumResult = finalAlbum.albumData[0];
            if (resolveArtists) albumResult = await resovleArtistMBIDs(albumResult);
            return res.status(200).json(albumResult);
        }
        if (resolveArtists) album = await resovleArtistMBIDs(album);
        return res.status(200).json(album);
    } catch (error) {
        logger.error("Error in CompareSingleAlbum API", error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message } as SAMBLApiError);
    }
}