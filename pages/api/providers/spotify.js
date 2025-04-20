import SpotifyWebApi from "spotify-web-api-node";
import config from "../../../config";
import logger from "../../../utils/logger";

const { clientId, clientSecret, redirectUri } = config();

const spotifyApi = new SpotifyWebApi({
    clientId: clientId,
    clientSecret: clientSecret,
    redirectUri: redirectUri,
});

let accessToken = null;
let tokenExpirationTime = null;

// refresh the access token if needed
async function checkAccessToken() {
    const currentTime = Date.now();

    // Check if the token is still valid
    if (accessToken && tokenExpirationTime && currentTime < tokenExpirationTime) {
        logger.debug("Using cached access token");
        spotifyApi.setAccessToken(accessToken);
        return;
    }

    try {
        const tokenData = await spotifyApi.clientCredentialsGrant();
        accessToken = tokenData.body["access_token"];
        const expiresIn = tokenData.body["expires_in"];
        tokenExpirationTime = currentTime + expiresIn * 1000;

        spotifyApi.setAccessToken(accessToken);
        logger.debug("Access token refreshed successfully");
    } catch (error) {
        logger.error("Error refreshing access token:", error);
        throw new Error("Failed to refresh access token");
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

const spotify = {
    getArtistById,
    searchByArtistName,
    getArtistAlbums
};

export default spotify;