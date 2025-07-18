const DeezerPublicApi = require('deezer-public-api');
import logger from "../../../utils/logger";
import withCache from "../../../utils/cache";

let deezerApi = new DeezerPublicApi();
let lastRefreshed = Date.now();

async function refreshApi() {
    const timeout = 60 * 60 * 1000 * 6;
    if (Date.now() - lastRefreshed > timeout) {
        deezerApi = new DeezerPublicApi();
        lastRefreshed = Date.now();
        logger.debug("Deezer API refreshed");
    }
}

async function getTrackByISRC(isrc) {
    await refreshApi();
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
    await refreshApi();
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
    getTrackByISRC: withCache(getTrackByISRC, { ttl: 60 * 30 }),
    getAlbumByUPC: withCache(getAlbumByUPC, { ttl: 60 * 30 }),
};

export default deezer;