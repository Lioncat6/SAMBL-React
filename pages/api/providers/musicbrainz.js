import { MusicBrainzApi } from 'musicbrainz-api';
import config from "../../../config";
import logger from "../../../utils/logger";

const { appName, appVersion, appContactInfo } = config();

const mbApi = new MusicBrainzApi({
    appName: appName,
    appVersion: appVersion,
    appContactInfo: appContactInfo
});


async function getIdBySpotifyId(spotifyId) {
    try {
        const data = await mbApi.search('url', {query: {url: `https://open.spotify.com/artist/${spotifyId}`}}, {inc: ['artist-rels']}, {limit: 1});
        if (data.count === 0) {
            return null; // No artist found
        }
        return data.urls[0]['relation-list'][0].relations[0].artist.id;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to fetch artist data");
    }
}

async function getIdsBySpotifyUrls(spotifyUrls) {
    try {
        const data = await mbApi.lookupUrl(spotifyUrls, ['artist-rels']);
        // console.log(data)
        if (data.count === 0) {
            return null; // No artist found
        }
        let mbids = {}
        for (let url of data.urls){
            mbids[url.resource] = url.relations[0].artist.id
        }
        return mbids;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to fetch artist data");
    }
}

const musicbrainz = {
    getIdBySpotifyId: getIdBySpotifyId,
    getIdsBySpotifyUrls: getIdsBySpotifyUrls
};

export default musicbrainz;