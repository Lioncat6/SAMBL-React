import MusixMatchAPI from './lib/musixmatch-alt';
import logger from "../../../utils/logger";

const mxmAPI = new MusixMatchAPI(null, process.env.MUSIXMATCH_API_KEY);
async function getTrackByISRC(isrc) {
    try {
        const trackData = await mxmAPI.get_track(null, isrc);
        if (trackData.message.body?.track) {
            if (trackData.message.body.track.has_lyrics == 1) {
                const lyricsData = await mxmAPI.get_track_lyrics(null, isrc);
                if (lyricsData.message.body) {
                    trackData.message.body.lyrics = lyricsData.message.body.lyrics;
                }
            }
            return trackData.message.body;
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