import providers from "./providers/providers";
import musicbrainz from "./providers/musicbrainz";
import logger from "../../utils/logger";
import { NextApiRequest, NextApiResponse } from "next";
import { ExtendedAlbumObject, ExtendedTrackObject, ProviderWithCapabilities } from "../../types/provider-types";
import normalizeVars from "../../utils/normalizeVars";
import { ArtistLookupData, URLLookupData } from "../../types/api-types";
import { SAMBLApiError } from "../../types/api-types";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        var { url } = normalizeVars(req.query);
        if (!url){
            return res.status(500).json(<SAMBLApiError>{error: "Missing required paramter `url`", parameters: ['url'], code: 500})
        }
        const forceRefresh = Object.prototype.hasOwnProperty.call(req.query, "forceRefresh");
        const data = await musicbrainz.getAlbumsBySourceUrls(url, ["recording-rels", "release-rels", "url-rels"])
        let albums: ExtendedAlbumObject[] = []
        let tracks: ExtendedTrackObject[] = []
        if (data?.relations){
            data.relations.forEach((relation)=>{
                if (relation.release){
                    albums.push(musicbrainz.formatAlbumObject(relation.release))
                }
                if (relation.recording)
            })
        }
        return res.status(200).json({albums, tracks} as URLLookupData);
    } catch (error) {
        logger.error("Error in lookupArtist API", error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message } as SAMBLApiError);
    }
}