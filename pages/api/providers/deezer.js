const DeezerPublicApi = require('deezer-public-api');
import logger from "../../../utils/logger";

let deezerApi = new DeezerPublicApi();

async function getTrackByISRC(isrc) {
    try {
        const data = await deezerApi.track(`isrc:${isrc}`);
        if (data.title) {
            return data;
        } else {
            return null;
        }
    } catch (error) {
        logger.error("Error fetching track by ISRC:", error);
        throw error;
    }
}

async function getAlbumByUPC(upc) {
    try {
        const data = await deezerApi.album(`upc:${upc.replace(/^0+/, '')}`);
        if (data.title) {
            return data;
        } else {
            return null;
        }
    } catch (error) {
        logger.error("Error fetching album by UPC:", error);
        throw error;
    }
}

const deezer = {
    getTrackByISRC,
    getAlbumByUPC,
};

export default deezer;