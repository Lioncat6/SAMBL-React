const { Musixmatch } = require('node-musixmatch-api');
import logger from "../../../utils/logger";
let mxm = null;

if (!process.env.MUSIXMATCH_API_KEY) {
    logger.warn("MUSIXMATCH_API_KEY is not set. Musixmatch API client will not be initialized.");
} else {
    try {
        mxm = new Musixmatch(process.env.MUSIXMATCH_API_KEY);
        testInfo = await mxm.artistGet(artist_id=37602084); //Rachie
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

const musixmatch = {
    getTrackByISRC
};

export default musixmatch;