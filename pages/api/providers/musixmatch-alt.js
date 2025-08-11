import MusixMatchAPI from "./lib/musixmatch-alt";
import logger from "../../../utils/logger";
import withCache from "../../../utils/cache";

const namespace = "musixmatch";

let proxies = {};
if (
	process.env.MXM_PROXY_HOST &&
	process.env.MXM_PROXY_PORT
) {
	proxies = {
		protocol: 'http',
		host: process.env.MXM_PROXY_HOST,
		port: parseInt(process.env.MXM_PROXY_PORT, 10),
		auth: {
			username: process.env.MXM_PROXY_USERNAME,
			password: process.env.MXM_PROXY_PASSWORD
		}
	};
}

function initMxM(proxies) { 
	if (proxies != {}) {
		return new MusixMatchAPI(proxies, process.env.MUSIXMATCH_API_KEY);
	} else {
		return new MusixMatchAPI(null, process.env.MUSIXMATCH_API_KEY);
	}
}

let mxmAPI = initMxM(proxies);
let lastRefreshed = Date.now();

async function refreshApi() {
    const timeout = 60 * 60 * 1000 * 12;
    if (Date.now() - lastRefreshed > timeout) {
        mxmAPI = initMxM(proxies);
        lastRefreshed = Date.now();
        logger.debug("MusixMatch Alt API refreshed");
    }
}

async function getTrackByISRC(isrc) {
	try {

		await refreshApi();

		const trackData = await mxmAPI.get_track(null, isrc);
		if (trackData.message.body?.track) {
			const lyricsData = await mxmAPI.get_track_lyrics(null, isrc);
			if (lyricsData.message.body) {
				trackData.message.body.lyrics = lyricsData.message.body.lyrics;
			}
			return trackData.message.body;
		} else {
			if (trackData.message.header?.status_code === 401) {
				logger.warn(`Recieved 401 from MusixMatch. Reason: ${trackData.message.header?.hint}`);
				throw new Error(`Recieved 401 from MusixMatch. Reason: ${trackData.message.header?.hint}`);
			}
			return null;
		}
	} catch (error) {
		logger.error("Error fetching track by ISRC:", error);
		throw error;
	}
}

const musixmatch = {
	getTrackByISRC: withCache(getTrackByISRC, { ttl: 60 * 10,  namespace: namespace }),
};

export default musixmatch;
