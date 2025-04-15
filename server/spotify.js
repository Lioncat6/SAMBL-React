import SpotifyWebApi from 'spotify-web-api-node';
import config from 'config.js';

const { clientId, clientSecret, redirectUri } = config;

// Initialize the Spotify API immediately when this file is loaded
console.log("Initializing Spotify API");
const spotifyApi = new SpotifyWebApi({
    clientId: clientId,
    clientSecret: clientSecret,
    redirectUri: redirectUri
});

// Export the initialized Spotify API instance
export default spotifyApi;