import type { ArtistObject, AlbumObject, TrackObject, AlbumData, AlbumArtistObject } from "./provider-types";
import logger from "../../../utils/logger";
import withCache from "../../../utils/cache";
import ErrorHandler from "../../../utils/errorHandler";
import Soundcloud, { SoundcloudUser, SoundcloudUserSearch } from "soundcloud.ts"
import { getRawAsset } from "node:sea";

const namespace = "soundcloud";

const err = new ErrorHandler(namespace);

const soundcloudClientId: string = process.env.SOUNDCLOUD_CLIENT_ID ?? "";
const soundcloudOauthToken: string = process.env.SOUNDCLOUD_OAUTH_TOKEN ?? "";

if (!soundcloudClientId || !soundcloudOauthToken) {
    throw new Error("TIDAL_CLIENT_ID and SOUNDCLOUD_OAUTH_TOKEN must be set in environment variables.");
}

const scApi = new Soundcloud(soundcloudClientId, soundcloudOauthToken)

async function searchByArtistName(artistName: string) {
    try {
        // Fetch artist data
        const data = await scApi.users.search({ q: artistName })
        return data;
    } catch (error) {
        err.handleError("Error searching for artist:", error);

    }
}

async function getArtistById(id: number) {
    try {
        const data = scApi.users.get(id)
        return data;
    } catch (error) {
        err.handleError("Error fetching artist:", error);

    }
}

function formatArtistLookupData(rawData:SoundcloudUser) {
	return rawData;
}

function formatArtistSearchData(rawData: SoundcloudUserSearch) {
    return rawData.collection;
}

function getArtistUrl(artist: SoundcloudUser) {
    return `https://soundcloud.com/${artist.permalink}`;
}

function formatArtistObject(rawObject: SoundcloudUser): ArtistObject {
    const countries = new Intl.DisplayNames(["en"], { type: 'region' });

    return {
        name: rawObject.username,
        url: `https://soundcloud.com/${rawObject.permalink}`,
        imageUrl: rawObject.avatar_url?.includes("default_avatar") ? rawObject.avatar_url : rawObject.avatar_url?.replace("large", "t500x500") || "",
        imageUrlSmall: rawObject.avatar_url?.replace("large", "t500x500") || "",
        bannerUrl: rawObject.visuals?.visuals[0]?.visual_url,
        relevance: `${rawObject.followers_count} Followers`,
        info:  `${rawObject.city ? rawObject.city+(rawObject.country_code ? ", " : ""):""}${rawObject.country_code ? countries.of(rawObject.country_code.toString().toUpperCase()): ""}`,
        genres: null,
        followers: rawObject.followers_count,
        popularity: null,
        id: rawObject.id.toString(),
        provider: namespace,
    };
}

function createUrl(type, id) {
	return null;
}

const soundcloud = {
    namespace,
    searchByArtistName: withCache(searchByArtistName, { ttl: 60 * 30, namespace: namespace }),
    getArtistById: withCache(getArtistById, { ttl: 60 * 30, namespace: namespace }),
    formatArtistSearchData,
    formatArtistObject,
    formatArtistLookupData,
    getArtistUrl,
    createUrl
}

export default soundcloud;