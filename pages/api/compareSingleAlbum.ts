import logger from "../../utils/logger";
import providers from "../../lib/providers/providers"
import musicbrainz from "../../lib/providers/musicbrainz";
import processData from "../../utils/processAlbumData";
import { NextApiRequest, NextApiResponse } from "next";
import normalizeVars from "../../utils/normalizeVars";
import { IRelease } from "musicbrainz-api";
import { APITimingStage, ArtistSearchData, SAMBLAPIResponse, SingleAlbumData } from "../../types/api-types";
import { AlbumObject, ArtistObject, MediumObject, PartialArtistObject, ProviderNamespace, TrackObject } from "../../types/provider-types";
import medium from "../../utils/medium";
import { AggregatedAlbum, AlbumStack } from "../../types/aggregated-types";
import objectUtils from "../../utils/objectUtils";
import scriptAndLanguage from "../../utils/scriptAndLanguage";
import { Stages } from "../../utils/timings";
import ServerAPIHandler from "../../utils/serverAPIHandler";

async function lookupArtists(artists: PartialArtistObject[], provider: ProviderNamespace): Promise<Map<string, string | null>> {
    let regexProvider = provider ? providers.parseProvider(provider, ["searchByArtistName", "formatArtistSearchData", "formatArtistObject", "buildUrlSearchQuery"]) : false;
    let idMap: Map<string, string | null> = new Map();
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

async function detectLanguageAndScript(album: AggregatedAlbum): Promise<AggregatedAlbum> {
    return {
        ...album,
        language: scriptAndLanguage.detectLanguage(album.name) ?? undefined,
        script: scriptAndLanguage.detectScript(album.name) ?? undefined
    }
}

async function getReleaseISRCs(album: AlbumObject): Promise<AlbumObject | null> {
    const providerObj = providers.parseProvider(album.provider ?? "", ["getTrackById", "formatTrackObject"]);
    if (!providerObj) return null;
    let mediums: MediumObject[] = []
    const sourceMediums = album.mediums;
    for (const medium of sourceMediums) {
        const sourceTracks = medium.tracks;
        let tracks: TrackObject[] = [];
        for (const track of sourceTracks) {
            const rawTrack = track.id ? await providerObj.getTrackById(track.id) : null
            const formattedTrack = rawTrack ? providerObj.formatTrackObject(rawTrack) : null;
            if (formattedTrack) tracks.push(formattedTrack)
        }
        mediums.push({
            ...medium,
            tracks
        }
        )
    }
    const newAlbum: AlbumObject = {
        ...album!,
        mediums
    }
    return newAlbum;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const stages = new Stages()
    const api = new ServerAPIHandler('compareSingleAlbum', res, stages, ['provider_id', 'provider', 'url', 'mbid', 'artist_id', 'fetchISRCs', 'resolveArtists', 'detectLanguage', 'ignoreTarget']);
    try {
        var { provider_id, provider, url, mbid, artist_id } = normalizeVars(req.query);
        const fetchISRCs: boolean = Object.prototype.hasOwnProperty.call(req.query, "fetchISRCs");
        const resolveArtists: boolean = Object.prototype.hasOwnProperty.call(req.query, "resolveArtists");
        const detectLanguage: boolean = Object.prototype.hasOwnProperty.call(req.query, "detectLanguage");
        const ignoreTarget: boolean = Object.prototype.hasOwnProperty.call(req.query, "ignoreTarget");

        if (provider_id && !provider) {
            return api.response(400, { error: { error: "Provider must be specified when provider_id is provided", parameters: ['provider'] } });
        }
        if (!provider_id && !url) {
            return api.response(400, { error: { error: "Either `provider_id` or `url` must be provided", parameters: ['provider_id', 'url'] } });
        }
        let parsed_id: string | null = null;

        if (url) {
            const urlInfo = providers.getUrlInfo(url);
            if (!urlInfo) {
                return api.response(400, { error: { error: "Invalid URL" } });
            }
            parsed_id = urlInfo.id;
            if (!parsed_id) {
                return api.response(500, { error: { error: "Failed to extract provider id from URL" } });
            }
            provider = urlInfo.provider;
        } else if (provider && provider_id) {
            parsed_id = provider_id;
        } else {
            return api.response(400, { error: { error: "Parameters `provider_id` and `provider` are required when not using `url`", parameters: ['provider_id', 'provider'] } });
        }
        const providerObj = providers.parseProvider(provider || "", ["getAlbumById", "formatAlbumObject", "getTrackById", "formatTrackObject", "getArtistById", "formatArtistObject"]);

        if (!providerObj) {
            return api.response(400, { error: { error: "Provider doesn't exist or doesn't support this operation", parameters: ['provider'] } })
        }
        stages.start('Album fetch')
        const rawAlbum = await providerObj.getAlbumById(parsed_id, { noCache: true });
        stages.end('Album fetch')
        if (!rawAlbum) {
            return api.response(404, { error: { error: "Album not found", provider: providerObj.namespace } })
        }
        let sourceAlbum = providerObj.formatAlbumObject(rawAlbum);
        let mbAlbum: IRelease | null = null;
        if (!ignoreTarget) {
            stages.start('MusicBrainz album Lookup')
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
            stages.end('MusicBrainz album Lookup')
        }
        const formattedMBAlbum = mbAlbum ? musicbrainz.formatAlbumObject(mbAlbum) : null;
        let albumArtist: ArtistObject | null = null;
        if (artist_id) {
            stages.start('Source artist lookup')
            const rawArtist = await providerObj.getArtistById(artist_id);
            if (rawArtist) {
                albumArtist = providerObj.formatArtistObject(rawArtist);
            }
            stages.end('Source artist lookup')
        }
        const ISRCConfig = providerObj.config?.capabilities.isrcs;
        // Fetch ISRCs if needed
        if (fetchISRCs && ISRCConfig?.availability != "never" && ISRCConfig?.presence == "onTrackRefresh") {
            stages.start('Fetch ISRCs')
            sourceAlbum = (await getReleaseISRCs(sourceAlbum)) ?? sourceAlbum;
            stages.end('Fetch ISRCs')
        }
        let albumData = processData([sourceAlbum], [], formattedMBAlbum ? [formattedMBAlbum] : [], providerObj.namespace, albumArtist);
        let album = albumData.albumData?.[0]
        if (!album) return api.response(500, { error: { error: 'Error processing album data' } });
        if (detectLanguage) {
            stages.start('Detect language')
            album.aggregated = await detectLanguageAndScript(album.aggregated);
            stages.end('Detect language')
        };
        if (resolveArtists) {
            stages.start('Resolve artists');
            album = await resovleArtistMBIDs(album);
            stages.end('Resolve artists')
        }
        return api.response<SingleAlbumData>(200, { data: album });
    } catch (error) {
        logger.error("Error in CompareSingleAlbum API", error);
        return api.response(500, { error: { error: "Internal Server Error", details: error.message } });
    }
}