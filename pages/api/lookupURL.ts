import providers from "./providers/providers";
import musicbrainz from "./providers/musicbrainz";
import logger from "../../utils/logger";
import { NextApiRequest, NextApiResponse } from "next";
import { AlbumObject, ArtistObject, ExtendedAlbumObject, ExtendedTrackObject, GenericObject, ProviderWithCapabilities, TrackObject } from "../../types/provider-types";
import normalizeVars from "../../utils/normalizeVars";
import { ArtistLookupData, URLLookupData } from "../../types/api-types";
import { SAMBLApiError } from "../../types/api-types";
import { IRecording } from "musicbrainz-api";
import parsers from "../../lib/parsers/parsers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        var { url } = normalizeVars(req.query);
        if (!url) {
            return res.status(500).json(<SAMBLApiError>{ error: "Missing required paramter `url`", parameters: ['url'], code: 500 })
        }
        const forceRefresh = Object.prototype.hasOwnProperty.call(req.query, "forceRefresh");
        const data = await musicbrainz.getAlbumsBySourceUrls(url, ["recording-rels", "release-rels", "url-rels", "artist-rels"], { noCache: forceRefresh })
        let albums: AlbumObject[] = []
        let tracks: TrackObject[] = []
        let artists: ArtistObject[] = []
        const urlData = parsers.getUrlInfo(url)
        if (urlData?.provider && urlData?.id){
            if (urlData.type=="album"){
                const provider = providers.parseProvider(urlData?.provider, ["getAlbumById", "formatAlbumObject"]);
                if (provider){
                    const albumData = await provider.getAlbumById(urlData.id);
                    if (albumData){
                        const formattedAlbumData = provider.formatAlbumObject(albumData);
                        if (formattedAlbumData) albums.push(formattedAlbumData);
                    }
                }
            } else if (urlData.type == "track"){
                const provider = providers.parseProvider(urlData?.provider, ["getTrackById", "formatTrackObject"]);
                if (provider){
                    const trackData = await provider.getTrackById(urlData.id);
                    if (trackData){
                        const formattedTrackData = provider.formatTrackObject(trackData);
                        if (formattedTrackData) tracks.push(formattedTrackData);
                    }
                }
            }
        }
        
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
        }

        function deduplicate<T extends GenericObject>(a: T[]): T[] {
            var seen = {};
            return a.filter(function(item) {
                return seen.hasOwnProperty(item.id || '') ? false : (seen[item.id || ''] = true);
            });
        }

        albums = deduplicate(albums);
        tracks = deduplicate(tracks);
        artists = deduplicate(artists);
        return res.status(200).json({ albums, tracks, artists } as URLLookupData);
    } catch (error) {
        logger.error("Error in lookupArtist API", error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message } as SAMBLApiError);
    }
}