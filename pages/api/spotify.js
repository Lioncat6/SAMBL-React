import SpotifyWebApi from "spotify-web-api-node";
import config from "../../config";

const { clientId, clientSecret, redirectUri } = config();
console.log("Client ID:", clientId);
const spotifyApi = new SpotifyWebApi({
    clientId: clientId,
    clientSecret: clientSecret,
    redirectUri: redirectUri,
});

spotifyApi.clientCredentialsGrant().then(
    function(data) {
      console.log('The access token expires in ' + data.body['expires_in']);
      console.log('The access token is ' + data.body['access_token']);
  
      spotifyApi.setAccessToken(data.body['access_token']);
    },
    function(err) {
      console.log('Something went wrong when retrieving an access token', err);
    }
  );

export default async function handler(req, res) {
    const { artistId } = req.query;

    try {
        const data = await spotifyApi.getArtist(artistId);
        res.status(200).json(data.body);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch artist data" });
    }
}