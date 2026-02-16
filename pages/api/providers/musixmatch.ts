import { MatcherTrack, Musixmatch } from 'node-musixmatch-api';
import logger from "../../../utils/logger";
import musixmatchAlternate from "./musixmatch-alt"
import withCache from "../../../utils/cache";
import { PartialArtistObject, PartialProvider, TrackObject, UrlType } from "../../../types/provider-types";

const namespace = "musixmatch";

let mxm: null | Musixmatch  = null;

if (!process.env.MUSIXMATCH_API_KEY) {
    logger.warn("MUSIXMATCH_API_KEY is not set. Musixmatch API client will not be initialized.");
} else if (process.env.MUSIXMATCH_ALTERNATE === "1") {

} else {
    try {
        mxm = new Musixmatch(process.env.MUSIXMATCH_API_KEY);
        const testInfo = await mxm.artistGet("37602084"); //Rachie
    } catch (error) {
        mxm = null;
        logger.error("Error initializing Musixmatch API client:", error);
    }
}

async function getTrackByISRC(isrc: string): Promise<MatcherTrack["message"]["body"]["track"][] | null> {
    if (!mxm) {
        logger.warn("Musixmatch API client is not initialized. Cannot fetch track by ISRC.");
        return null;
    }
    try {
        const data = await mxm.matcherTrackGet(isrc);
        if (data.message.body.track) {
            const track = data.message.body.track;
            return [track];
        } else {
            return null;
        }
    } catch (error) {
        logger.error("Error fetching track by ISRC:", error);
        throw error;
    }
}

function getArtistFromUrl(url: string): string | null{
    const urlRegex = /https:\/\/www\.musixmatch\.com\/(lyrics|album)\/(YonKaGor-2)\/[^\/]*/
    return url.match(urlRegex)?.[2] || null
}

function createUrl(type: UrlType, id: string): string {
    return `https://musixmatch.com/artist${id}`
}

function formatTrackObject(rawTrack: MatcherTrack["message"]["body"]["track"]): TrackObject {
    return {
        provider: namespace,
        id: String(rawTrack.track_id),
        name: rawTrack.track_name,
        url: rawTrack.track_share_url,
        imageUrl: null,
        imageUrlSmall: null,
        artistNames: [rawTrack.artist_name],
        trackArtists: [{
            provider: namespace,
            id: String(rawTrack.artist_id),
            name: rawTrack.artist_name,
            url: createUrl("artist", getArtistFromUrl(rawTrack.track_share_url) || ""),
            imageUrl: null,
            imageUrlSmall: null
        }],
        albumName: rawTrack.album_name,
        releaseDate: null,
        trackNumber: null,
        duration: null,
        isrcs: []
    }
}


let musixmatch: PartialProvider;

if (process.env.MUSIXMATCH_ALTERNATE === "1") {
    logger.debug("Using alternate Musixmatch implementation (musixmatch-alt).");
    musixmatch = musixmatchAlternate;
} else {
    musixmatch = {
        namespace,
        getTrackByISRC: withCache(getTrackByISRC, { ttl: 60 * 10,  namespace: namespace }),
        formatTrackObject
    };
}

export default musixmatch;