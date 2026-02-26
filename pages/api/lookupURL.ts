import providers from "./providers/providers";
import musicbrainz from "./providers/musicbrainz";
import logger from "../../utils/logger";
import { NextApiRequest, NextApiResponse } from "next";
import { ArtistObject, ExtendedAlbumObject, ExtendedTrackObject, ProviderWithCapabilities } from "../../types/provider-types";
import normalizeVars from "../../utils/normalizeVars";
import { ArtistLookupData, URLLookupData } from "../../types/api-types";
import { SAMBLApiError } from "../../types/api-types";
import { IRecording } from "musicbrainz-api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        var { url } = normalizeVars(req.query);
        if (!url) {
            return res.status(500).json(<SAMBLApiError>{ error: "Missing required paramter `url`", parameters: ['url'], code: 500 })
        }
        const forceRefresh = Object.prototype.hasOwnProperty.call(req.query, "forceRefresh");
        const data = await musicbrainz.getAlbumsBySourceUrls(url, ["recording-rels", "release-rels", "url-rels", "artist-rels"], { noCache: forceRefresh })
        let albums: ExtendedAlbumObject[] = []
        let tracks: ExtendedTrackObject[] = []
        let artists: ArtistObject[] = []
        if (data?.relations) {
            if (data?.relations) {
                for (const relation of data.relations) {
                    if (relation.release) {
                        const release = await musicbrainz.getAlbumByMBID(
                            relation.release.id,
                            ["artist-credits", "isrcs", "recording-rels", "recording-level-rels", "artist-rels", "recordings"]
                        );
                        albums.push(musicbrainz.formatAlbumObject(release));
                    }
                    if ("recording" in relation && relation.recording) {
                        const recording = await musicbrainz.getTrackByMBID(
                            (relation.recording as IRecording).id,
                            ["artist-credits", "area-rels", "isrcs", "recording-rels"]
                        );
                        tracks.push(musicbrainz.formatTrackObject(recording));
                    }
                    if (relation.artist) {
                        artists.push(musicbrainz.formatArtistObject(relation.artist));
                    }
                }
            }
            return res.status(200).json({ albums, tracks, artists } as URLLookupData);
        }
        return res.status(200).json({ albums, tracks, artists } as URLLookupData);
    } catch (error) {
        logger.error("Error in lookupArtist API", error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message } as SAMBLApiError);
    }
}