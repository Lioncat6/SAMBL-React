import MusixMatchAPI from "./lib/musixmatch-alt";
import logger from "../../../utils/logger";
import withCache from "../../../utils/cache";
import ErrorHandler from "../../../utils/errorHandler";
import { PartialProvider } from "../../../types/provider-types";
import { AxiosBasicCredentials, AxiosProxyConfig } from "axios";
const namespace = "musixmatch";

const err = new ErrorHandler(namespace);

let proxy: AxiosProxyConfig | null = null;
if (
	process.env.MXM_PROXY_HOST &&
	process.env.MXM_PROXY_PORT
) {
	let auth: AxiosBasicCredentials | undefined = undefined;
	if (process.env.MXM_PROXY_USERNAME && process.env.MXM_PROXY_PASSWORD) {
		auth = {
			username: process.env.MXM_PROXY_USERNAME,
			password: process.env.MXM_PROXY_PASSWORD
		}
	}
	proxy = {
		protocol: 'http',
		host: process.env.MXM_PROXY_HOST,
		port: parseInt(process.env.MXM_PROXY_PORT, 10),
		auth
	};
}

const hostname = process.env.MUSIXMATCH_HOSTNAME || "https://www.musixmatch.com";

function initMxM(proxy?: AxiosProxyConfig | null) { 
	if (proxy) {
		return new MusixMatchAPI(proxy, process.env.MUSIXMATCH_API_KEY, hostname);
	} else {
		return new MusixMatchAPI(null, process.env.MUSIXMATCH_API_KEY, hostname);
	}
}

let mxmAPI = initMxM(proxy);
let lastRefreshed = Date.now();

async function refreshApi() {
    const timeout = 60 * 60 * 1000 * 12;
    if (Date.now() - lastRefreshed > timeout) {
        mxmAPI = initMxM(proxy);
        lastRefreshed = Date.now();
        logger.debug("MusixMatch Alt API refreshed");
    }
}

async function withRetry(apiCall: () => Promise<any>, retries = 3, delay = 250) {
	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			return await apiCall();
		} catch (error) {
			if (attempt < retries) {
				// logger.warn(`Retrying API call (attempt ${attempt} of ${retries})...`);
				await new Promise((resolve) => setTimeout(resolve, delay));
			} else {
				err.handleError("API call failed after retries:", error);
				throw error;
			}
		}
	}
}

async function getTrackByISRC(isrc: string) {
	try {

		await refreshApi();
		const trackData = await withRetry(() => mxmAPI.get_track(null, isrc));
		if (trackData.message.body?.track) {
			const lyricsData = await withRetry(() => mxmAPI.get_track_lyrics(null, isrc));
			if (lyricsData.message.body) {
				trackData.message.body.lyrics = lyricsData.message.body.lyrics;
			}
			return trackData.message.body;
		} else {
			if (trackData.message?.header?.status_code === 401) {
				logger.warn(`Recieved 401 from MusixMatch. Reason: ${trackData.message.header?.hint || "Unknown"}`);
				throw new Error(`Recieved 401 from MusixMatch. Reason: ${trackData.message.header?.hint || "Unknown"}`);
			}
			return null;
		}
	} catch (error) {
		logger.error("Error fetching track by ISRC:", error);
		throw error;
	}
}



const musixmatch: PartialProvider = {
	namespace,
	getTrackByISRC: withCache(getTrackByISRC, { ttl: 60 * 10,  namespace: namespace }),
};

export default musixmatch;
