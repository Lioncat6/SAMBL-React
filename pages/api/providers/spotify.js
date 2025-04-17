import  SpotifyWebApi  from "spotify-web-api-node";
import config from "../../../config";
import logger from "../../../utils/logger";

const { clientId, clientSecret, redirectUri } = config();

const spotifyApi = new SpotifyWebApi({
    clientId: clientId,
    clientSecret: clientSecret,
    redirectUri: redirectUri,
});

async function refreshAccessToken() {
    try {
        const tokenData = await spotifyApi.clientCredentialsGrant();
        const accessToken = tokenData.body["access_token"];
        spotifyApi.setAccessToken(accessToken);
        logger.info("Access token refreshed");
    } catch (error) {
        console.error("Error refreshing access token:", error);
        throw new Error("Failed to refresh access token");
    }
}

async function getArtistById(spotifyId) {
    try {
        await refreshAccessToken();

        // Fetch artist data
        const data = await spotifyApi.getArtist(spotifyId);
        if (data.statusCode == 404) {
            return null;
        }
        return data.body;
    } catch (error) {
        console.error("Error fetching artist data:", error);
        throw new Error("Failed to fetch artist data");
    }
}

async function searchByArtistName(artistName) {
    try {
        await refreshAccessToken();

        // Fetch artist data
        const data = await spotifyApi.searchArtists(artistName);

        return data.body;
    } catch (error) {
        console.error("Error searching for artist:", error);
        throw new Error("Failed to search for artist");
    }
}

const spotify = {
    getArtistById,
    searchByArtistName
};

export default spotify;