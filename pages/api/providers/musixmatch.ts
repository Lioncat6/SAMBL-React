import { Musixmatch } from 'node-musixmatch-api';
import logger from "../../../utils/logger";
import musixmatchAlternate from "./musixmatch-alt"
import withCache from "../../../utils/cache";
import { PartialProvider } from "../../../types/provider-types";

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

async function getTrackByISRC(isrc) {
    if (!mxm) {
        logger.warn("Musixmatch API client is not initialized. Cannot fetch track by ISRC.");
        return null;
    }
    try {
        const data = await mxm.matcherTrackGet(isrc);
        if (data.message.body.track) {
            const track = data.message.body.track;
            return track;
        } else {
            return null;
        }
    } catch (error) {
        logger.error("Error fetching track by ISRC:", error);
        throw error;
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
    };
}

export default musixmatch;