import MusixMatchAPI from './lib/musixmatch-alt';
import logger from "../../../utils/logger";

const mxmAPI = new MusixMatchAPI(null, process.env.MUSIXMATCH_API_KEY);
async function getTrackByISRC(isrc) {
    try {
        const data = await mxmAPI.get_track(null, isrc);
        if (data.message.body) {
            return data.message.body;
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