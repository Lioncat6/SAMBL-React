import MusixMatchAPI from "./lib/musixmatch-alt";
import logger from "../../../utils/logger";
import withCache from "../../../utils/cache";
import ErrorHandler from "../../../utils/errorHandler";
import { ExtendedTrackObject, PartialProvider, TrackObject } from "../../../types/provider-types";
import { AxiosBasicCredentials, AxiosProxyConfig } from "axios";
import parsers from "../../../lib/parsers/parsers";
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

async function getTrackByISRC(isrc: string): Promise<ExtendedTrackObject[] | null> {
	try {
		await refreshApi();
		const trackData = await withRetry(() => mxmAPI.get_track(null, isrc));
		if (trackData.message.body?.track) {
			const lyricsData = await withRetry(() => mxmAPI.get_track_lyrics(null, isrc));
			if (lyricsData.message.body) {
				trackData.message.body.lyrics = lyricsData.message.body.lyrics;
			}
			const appleMusicParser = parsers.getParser("applemusic")
			const spotifyParser = parsers.getParser("spotify")
			const mxmData = trackData.message.body;
			let externalUrls: (string | null)[] = []
			if (mxmData.track?.commontrack_spotify_ids) mxmData.track.commontrack_spotify_ids.forEach((id) => externalUrls.push(spotifyParser.createUrl("track", id)))
			if (mxmData.track?.commontrack_itunes_ids) mxmData.track.commontrack_itunes_ids.forEach((id) => externalUrls.push(appleMusicParser.createUrl("track", id)))
			const filteredUrls = externalUrls.filter((url) => url != null);
			const extraInfo = {
				lyrics_id: mxmData.lyrics?.lyrics_id,
				album_id: mxmData.track.album_id,
				album_vanity_id: mxmData.track.album_vanity_id,
				artist_id: mxmData.track.artist_id,
				artist_mbid: mxmData.track.artist_mbid,
				commontrack_id: mxmData.track.commontrack_id,
				track_mbid: mxmData.track.track_mbid,
				track_spotify_id: mxmData.track.track_spotify_id,
				commontrack_spotify_ids: mxmData.track.commontrack_spotify_ids,
				commontrack_itunes_ids: mxmData.track.commontrack_itunes_ids,
				explicit: mxmData.track.explicit,
				updated_time: mxmData.track.updated_time,
				instrumental: mxmData.lyrics?.instrumental,
				hasLyrics: !((mxmData.track.has_lyrics == 0 && mxmData.lyrics?.instrumental != 1) || !mxmData.lyrics),
				verified: !mxmData.lyrics?.published_status.toString().includes("5"),
				restricted: mxmData.lyrics?.restricted
			}
			const trackObject: ExtendedTrackObject = {
				id: mxmData.track.track_id,
				extraInfo,
				comment: [
					!extraInfo.verified ? "Not Verified" : null,
					!extraInfo.hasLyrics ? "Missing Lyrics" : null,
					!extraInfo.instrumental ? "Instrumental" : null
				].filter((infoStr) => infoStr).join(" • "),
				url: `https://www.musixmatch.com/lyrics/${mxmData.track.commontrack_vanity_id}`,
				externalUrls: filteredUrls,
				provider: namespace,
				name: mxmData.track.track_name,
				imageUrl: mxmData.track.album_coverart_500x500 || mxmData.track.album_coverart_100x100 || "",
				imageUrlSmall: mxmData.track.album_coverart_100x100 || mxmData.track.album_coverart_500x500 || "",
				artistNames: [mxmData.track.artist_name],
				trackArtists: [{
					name: mxmData.track.artist_name,
					url: `https://www.musixmatch.com/artist/${mxmData.track.artist_id}`,
					id: mxmData.track.artist_id,
					provider: namespace,
					imageUrl: null,
					imageUrlSmall: null
				}],
				albumName: mxmData.track?.album_name || mxmData.track.album_vanity_id,
				releaseDate: null,
				trackNumber: null,
				duration: null,
				isrcs: [isrc]

			}
			return [trackObject];
		} else {
			if (trackData.message?.header?.status_code === 404) {
				return null;
			}
			if (trackData.message?.header?.status_code === 401) {
				logger.warn(`Recieved 401 from MusixMatch. Reason: ${trackData.message.header?.hint || "Unknown"}`);
				throw new Error(`Recieved 401 from MusixMatch. Reason: ${trackData.message.header?.hint || "Unknown"}`);
			}
			throw new Error(`Recieved error from MusixMatch. Reason: ${trackData.message.header?.hint || "Unknown"}`);
			return null;
		}
	} catch (error) {
		logger.error("Error fetching track by ISRC:", error);
		throw error;
		return null;
	}
}



const musixmatch: PartialProvider = {
	namespace,
	getTrackByISRC: withCache(getTrackByISRC, { ttl: 60 * 10, namespace: namespace }),
};

export default musixmatch;
