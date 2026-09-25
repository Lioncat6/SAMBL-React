import providers from "../../lib/providers/providers";
import musicbrainz from "../../lib/providers/musicbrainz";
import logger from "../../utils/logger";
import { NextApiRequest, NextApiResponse } from "next";
import { AlbumObject, ArtistObject, GenericObject, TrackObject } from "../../types/provider-types";
import normalizeVars from "../../utils/normalizeVars";
import { URLLookupData } from "../../types/api-types";
import { SAMBLApiError } from "../../types/api-types";
import { IRecording } from "musicbrainz-api";
import parsers from "../../lib/parsers/parsers";
import objectUtils from "../../utils/objectUtils";
import { Stages } from "../../utils/timings";
import ServerAPIHandler from "../../utils/serverAPIHandler";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const stages = new Stages()
    const api = new ServerAPIHandler('lookupURL', res, stages, ['url'])
    try {
        var { url } = normalizeVars(req.query);
        if (!url) {
            return api.response(500, {error: { error: "Missing required paramter `url`", parameters: ['url'] }})
        }
        const forceRefresh = Object.prototype.hasOwnProperty.call(req.query, "forceRefresh");
        let albums: AlbumObject[] = []
        let tracks: TrackObject[] = []
        let artists: ArtistObject[] = []
        const urlData = parsers.getUrlInfo(url)
        if (urlData?.provider && urlData?.id){
            if (urlData.type=="album"){
                const provider = providers.parseProvider(urlData?.provider, ["getAlbumById", "formatAlbumObject"]);
                if (provider){
                    stages.start('Get source album by ID', provider.namespace);
                    const albumData = await provider.getAlbumById(urlData.id);
                    stages.end('Get source album by ID');
                    if (albumData){
                        const formattedAlbumData = provider.formatAlbumObject(albumData);
                        if (formattedAlbumData) albums.push(formattedAlbumData);
                    }
                }
            } else if (urlData.type == "track"){
                const provider = providers.parseProvider(urlData?.provider, ["getTrackById", "formatTrackObject"]);
                if (provider){
                    stages.start('Get source track by ID', provider.namespace);
                    const trackData = await provider.getTrackById(urlData.id);
                    stages.end('Get source track by ID');
                    if (trackData){
                        const formattedTrackData = provider.formatTrackObject(trackData);
                        if (formattedTrackData) tracks.push(formattedTrackData);
                    }
                }
            } else if (urlData.type == "artist"){
                const provider = providers.parseProvider(urlData?.provider, ["getArtistById", "formatArtistObject"]);
                if (provider){
                    stages.start('Get source artisd by ID', provider.namespace);
                    const artistData = await provider.getArtistById(urlData.id);
                    stages.end('Get source artisd by ID');
                    if (artistData){
                        const formattedArtistData = provider.formatArtistObject(artistData);
                        if (formattedArtistData) artists.push(formattedArtistData);
                    }
                }
            }
        }
        if (urlData?.provider) { // Clean URL if possible
            const provider = providers.parseProvider(urlData.provider, ["createUrl"]);
            if (provider && urlData.id && urlData.type) {
                const createdUrl = provider.createUrl( urlData.type, urlData.id);
                if (createdUrl) {
                    url = createdUrl.url;
                }
            }
        }
        stages.start('Lookup URL on target', 'musicbrainz');
        const data = await musicbrainz.getAlbumsBySourceUrls(url, ["recording-rels", "release-rels", "url-rels", "artist-rels"], { noCache: forceRefresh })
        stages.end('Lookup URL on target');
        if (data?.relations) {
            if (data?.relations) {
                for (const relation of data.relations) {
                    if (relation.release) {
                        const stage = stages.start('Lookup album metadata', 'musicbrainz');
                        const release = await musicbrainz.getAlbumByMBID(
                            relation.release.id,
                            ["artist-credits", "isrcs", "recording-rels", "recording-level-rels", "artist-rels", "recordings"]
                        );
                        stage.end();
                        albums.push(musicbrainz.formatAlbumObject(release));
                    }
                    if ("recording" in relation && relation.recording) {
                        const stage = stages.start('Lookup track metadata', 'musicbrainz');
                        const recording = await musicbrainz.getTrackByMBID(
                            (relation.recording as IRecording).id,
                            ["artist-credits", "area-rels", "isrcs", "recording-rels"]
                        );
                        stage.end();
                        tracks.push(musicbrainz.formatTrackObject(recording));
                    }
                    if (relation.artist) {
                        artists.push(musicbrainz.formatArtistObject(relation.artist));
                    }
                }
            }
        }

        albums = objectUtils.deduplicate(albums);
        tracks = objectUtils.deduplicate(tracks);
        artists = objectUtils.deduplicate(artists);
        const lookupData: URLLookupData = {
            albums,
            tracks,
            artists,
            query: url
        }
        return api.response<URLLookupData>(200, {data: lookupData});
    } catch (error) {
        logger.error("Error in lookupArtist API", error);
        return api.response(500, { error: { error: "Internal Server Error", details: error.message }}
        );
    }
}