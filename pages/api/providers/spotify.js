import SpotifyWebApi from "spotify-web-api-node";
import logger from "../../../utils/logger";
import withCache from "../../../utils/cache";

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,

});

let accessToken = null;
let tokenExpirationTime = null;

function validateSpotifyId(spotifyId) {
    const spfPattern = /[A-Za-z0-9]{22}/;
    return spfPattern.test(spotifyId); 
}

function extractSpotifyIdFromUrl(url) {
    const spfPattern = /[A-Za-z0-9]{22}$/;
    const match = url.match(spfPattern);
    if (match && match[0]) {
        return match[0]; 
    }
}


async function withRetry(apiCall, retries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await apiCall();
        } catch (error) {
            if (attempt < retries) {
                logger.warn(`Retrying API call (attempt ${attempt} of ${retries})...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
                logger.error("API call failed after retries:", error);
                throw error;
            }
        }
    }
}

async function checkAccessToken() {
    const currentTime = Date.now();



    if (accessToken && tokenExpirationTime && currentTime < tokenExpirationTime) {
        // logger.debug("Using cached access token");
        // spotifyApi.setAccessToken(accessToken);
        // This doesn't need to be set again 
        return;
    }

    try {
        const tokenData = await spotifyApi.clientCredentialsGrant();
        accessToken = tokenData.body["access_token"];
        const expiresIn = tokenData.body["expires_in"];
        tokenExpirationTime = currentTime + expiresIn * 1000;

        spotifyApi.setAccessToken(accessToken);
        logger.debug("Spotify access token refreshed successfully");
    } catch (error) {
        logger.error("Error refreshing Spotify access token:", error);
        // throw new Error("Failed to refresh access token");
    }
}

async function getArtistById(spotifyId) {
    try {
        await checkAccessToken();

        // Fetch artist data
        const data = await spotifyApi.getArtist(spotifyId);
        if (data.statusCode === 404) {
            return null;
        }
        return data.body;
    } catch (error) {
        logger.error("Error fetching artist data:", error);
        throw new Error("Failed to fetch artist data");
    }
}

async function searchByArtistName(artistName) {
    try {
        await checkAccessToken();

        // Fetch artist data
        const data = await spotifyApi.searchArtists(artistName);
        return data.body;
    } catch (error) {
        logger.error("Error searching for artist:", error);
        throw new Error("Failed to search for artist");
    }
}

async function getArtistAlbums(spotifyId, offset = 0, limit = 50) {
    try {
        await checkAccessToken();

        // Fetch artist albums
        const data = await spotifyApi.getArtistAlbums(spotifyId, { limit: limit, offset: offset });
        return data.body;
    } catch (error) {
        logger.error("Error fetching artist albums:", error);
        throw new Error("Failed to fetch artist albums");
    }
}

async function getAlbumByUPC(upc) {
    try {
        await checkAccessToken();

        const data = await spotifyApi.searchAlbums(`upc:${upc}`, { limit: 20 });
        return data.body;
    } catch (error) {
        logger.error("Error fetching album data:", error);
        throw new Error("Failed to fetch album data");
    }
}

async function getTrackByISRC(isrc) {
    try {
        await checkAccessToken();

        const data = await spotifyApi.searchTracks(`isrc:${isrc}`, { limit: 20 });
        return data.body;
    } catch (error) {
        logger.error("Error fetching track data:", error);
        throw new Error("Failed to fetch track data");
    }
}


const spotify = {
    getArtistById: withCache(getArtistById, { ttl: 60 * 30 }),
    searchByArtistName: withCache(searchByArtistName, { ttl: 60 * 30 }),
    getArtistAlbums: withCache(getArtistAlbums, { ttl: 60 * 30 }),
    getAlbumByUPC: withCache(getAlbumByUPC, { ttl: 60 * 30 }),
    getTrackByISRC: withCache(getTrackByISRC, { ttl: 60 * 30 }),
    validateSpotifyId,
    extractSpotifyIdFromUrl
};

export default spotify;