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

async function getArtistAlbums(mbid, offset = 0, limit = 100) {
    try {
        // const data = await mbApi.browse('release', {artist: mbid, limit: limit, offset: offset});
        const data = await mbApi.browse('release', {artist: mbid, limit: limit, offset: offset}, ['url-rels', 'recordings', 'isrcs']);
        // console.log(data)
        return data;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to fetch artist albums");
    }
}

async function getArtistFeaturedAlbums(mbid, offset = 0, limit = 100) {
    try {
        // const data = await mbApi.browse('release', {track_artist: mbid, limit: limit, offset: offset});
        const data = await mbApi.browse('release', {track_artist: mbid, limit: limit, offset: offset}, ['url-rels', 'recordings', 'isrcs']);

        return data;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to fetch artist albums");
    }
}

async function getAlbumByUPC(upc) {
    try {
        const data = await mbApi.search('release', {query: upc, inc: ['artist-rels']}, {limit: 20});
        return data;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to fetch album data");
    }
}

async function getTrackByISRC(isrc) {
    try {
        const data = await mbApi.search('recording', {query: isrc, inc: ['artist-rels']}, {limit: 20});
        return data;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to fetch album data");
    }
}

const musicbrainz = {
    getIdBySpotifyId: getIdBySpotifyId,
    getIdsBySpotifyUrls: getIdsBySpotifyUrls,
    getArtistAlbums,
    getArtistFeaturedAlbums,
    getAlbumByUPC,
    getTrackByISRC
};

export default musicbrainz;