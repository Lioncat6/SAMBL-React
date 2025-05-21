const DeezerPublicApi = require('deezer-public-api');
import logger from "../../../utils/logger";

let deezerApi = new DeezerPublicApi();

async function getTrackByISRC(isrc) {
    try {
        const data = await deezerApi.track(`isrc:${isrc}`);
        return data;
    } catch (error) {
        logger.error("Error fetching track by ISRC:", error);
        throw error;
    }
}


const deezer = {
    getTrackByISRC
};

export default deezer;