import logger from "../../utils/logger";
import providers from "./providers/providers"
import musicbrainz from "./providers/musicbrainz";
import processData from "../../utils/processAlbumData";
import { NextApiRequest, NextApiResponse } from "next";
import normalizeVars from "../../utils/normalizeVars";
import { IRelease } from "musicbrainz-api";
import { SAMBLApiError } from "../../types/api-types";
import { AlbumObject, TrackObject } from "../../types/provider-types";

export default async function handler(req:NextApiRequest, res:NextApiResponse) {
    try {
		var { provider_id, provider, url, mbid, artist_id } = normalizeVars(req.query);

        const fetchISRCs: boolean = Object.prototype.hasOwnProperty.call(req.query, "fetchISRCs");

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
        const providerObj = providers.parseProvider(provider || "", ["getAlbumById", "formatAlbumObject", "getTrackById", "formatTrackObject"]);

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
        let urlResults = (await musicbrainz.getAlbumsBySourceUrls([sourceAlbum.url], ["release-rels"], { noCache: true }))?.urls[0];
        let barcodeResults = sourceAlbum.upc ? (await musicbrainz.getAlbumByUPC(sourceAlbum.upc, {noCache: true})) : [];
        if (urlResults?.relations?.[0]?.release?.id || barcodeResults?.[0]?.id) {
            mbAlbum = await musicbrainz.getAlbumByMBID((urlResults?.relations?.[0]?.release?.id || barcodeResults?.[0]?.id)!, ["url-rels", "recordings", "isrcs", "recording-level-rels", "artist-credits"], { noCache: true });
        } else if (mbid && musicbrainz.validateMBID(mbid)){
            let mbSearch = await musicbrainz.searchForAlbumByArtistAndTitle(mbid, sourceAlbum.name, { noCache: true })
            if (mbSearch && mbSearch?.releases?.length > 0) {
                mbAlbum = await musicbrainz.getAlbumByMBID(mbSearch.releases[0].id, ["url-rels", "recordings", "isrcs", "recording-level-rels", "artist-credits"], { noCache: true });
            }
        }
        const formattedMBAlbum = mbAlbum ? musicbrainz.formatAlbumObject(mbAlbum) : null;
        let albumData = processData([sourceAlbum], formattedMBAlbum ? [formattedMBAlbum] : [], mbid, artist_id, providerObj.namespace);
        let album = albumData.albumData?.[0]
        if (!album) return res.status(500).json({error: "Error processing album data"} as SAMBLApiError)
        const ISRCConfig = providerObj.config?.capabilities.isrcs;
        if (fetchISRCs && ISRCConfig?.availability != "never" && ISRCConfig?.presence == "onTrackRefresh") {
            let tracks: (TrackObject | null)[] = [];
            for (const track of album.albumTracks) {
                const rawTrack = track.id ? await providerObj.getTrackById(track.id) : null
                const formattedTrack = rawTrack ? providerObj.formatTrackObject(rawTrack): null;
                tracks.push(formattedTrack)
            }
            let finalTracks: TrackObject[] = [];
            for (const newTrack in tracks){
                finalTracks.push(tracks[newTrack] || album.albumTracks[newTrack]);
            }
            tracks.filter((track) => (track));
            const newAlbum: AlbumObject = {
                ...sourceAlbum,
                albumTracks: finalTracks
            }
            let finalAlbum = processData([newAlbum], formattedMBAlbum ? [formattedMBAlbum] : [], mbid, artist_id, providerObj.namespace);
            return res.status(200).json(finalAlbum.albumData[0]);
        }
        return res.status(200).json(album);
    } catch (error) {
		logger.error("Error in CompareSingleAlbum API", error);
		return res.status(500).json({ error: "Internal Server Error", details: error.message } as SAMBLApiError);
	}
}