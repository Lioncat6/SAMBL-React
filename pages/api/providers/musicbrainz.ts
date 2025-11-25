import { MusicBrainzApi, CoverArtArchiveApi, IRelation, RelationsIncludes, IArtist, EntityType, IBrowseReleasesQuery, IRelease, IEntity, IRecording, ICoverInfo, ICoversInfo, IReleaseList, IUrlList, IUrlLookupResult, IUrl, IBrowseReleasesResult, IRecordingList } from "musicbrainz-api";
import { UrlInfo, UrlMBIDDict, UrlData, Provider } from "./provider-types";
import logger from "../../../utils/logger";
import withCache from "../../../utils/cache";
import ErrorHandler from "../../../utils/errorHandler";
const namespace = "musicbrainz";

const err = new ErrorHandler(namespace);

const coverArtArchiveApiClient = new CoverArtArchiveApi();
const mbApi = new MusicBrainzApi({
	appName: process.env.REACT_APP_NAME,
	appVersion: process.env.REACT_APP_VERSION,
	appContactInfo: process.env.CONTACT_INFO,
});

function checkError(data) {
	if (data.error) {
		throw new Error(data.error);
	}
}

function validateMBID(mbid) {
	const mbidPattern = /.*[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}.*/i;
	return mbidPattern.test(mbid);
}

async function getIdBySpotifyId(spotifyId: string): Promise<string | null | undefined> {
	try {
		const data = await mbApi.lookupUrl(`https://open.spotify.com/artist/${spotifyId}`, ["artist-rels"]);
		if (!data.relations || data.relations?.length == 0) {
			return null; // No artist found
		}
		return data.relations[0].artist?.id || null;
	} catch (error) {
		err.handleError("Failed to fetch artist data", error);
	}
}

async function getArtistById(mbid: string): Promise<IArtist | null | undefined> {
	try {
		const data = await mbApi.lookup('artist', mbid, ["url-rels", "tags", "aliases"])
		if (!data.name) {
			return null;
		}
		return data;
	} catch (error) {
		err.handleError("Failed to fetch artist data", error);
	}
}

async function getArtistByUrl(url: string): Promise<IArtist | null | undefined> {
	try {
		const data = await mbApi.lookupUrl(url, ["artist-rels"]);
		if (!data.relations || data.relations?.length == 0) {
			return null; // No artist found
		}
		return data.relations[0].artist;
	} catch (error) {
		err.handleError("Failed to fetch artist data", error);
	}
}

async function getIdsBySpotifyUrls(spotifyUrls: string[]): Promise<UrlMBIDDict | null | undefined> {
	try {
		const data = await mbApi.lookupUrl(spotifyUrls, ["artist-rels"]);
		if (data["url-count"] === 0) {
			return null; // No artist found
		}
		let mbids: UrlMBIDDict = {};
		for (let url of data.urls) {
			if (url && url.relations) {
				if (url.relations?.length > 0) {
					mbids[url.resource] = url.relations[0]?.artist?.id;
				}
			}
		}
		return mbids;
	} catch (error) {
		err.handleError("Failed to get ids", error);
	}
}

async function getAlbumsBySourceUrls(sourceUrls: string[], inc?: RelationsIncludes[]): Promise<IUrlLookupResult | null | undefined>;
async function getAlbumsBySourceUrls(sourceUrls: string, inc?: RelationsIncludes[]): Promise<IUrl | null | undefined>;
async function getAlbumsBySourceUrls(sourceUrls: string | string[], inc: RelationsIncludes[] = ["release-rels"]): Promise<IUrlLookupResult | IUrl | null | undefined> {
	try {
		if (Array.isArray(sourceUrls)) {
			const data = await mbApi.lookupUrl(sourceUrls as string[], inc as RelationsIncludes[]);
			if (data["url-count"] === 0) {
				return null;
			}
			return data as IUrlLookupResult;
		} else {
			const data = await mbApi.lookupUrl(sourceUrls as string, inc as RelationsIncludes[]);
			if (!data.relations || data.relations.length === 0) {
				return null;
			}
			return data as IUrl;
		}
	} catch (error) {
		err.handleError("Failed to fetch albums by Source URL(s)", error);
	}
}

async function getArtistAlbums(mbid:string, offset = 0, limit = 100, inc = ["url-rels", "recordings", "isrcs"] as any): Promise<IBrowseReleasesResult | null | undefined> {
	try {
		// const data = await mbApi.browse('release', {artist: mbid, limit: limit, offset: offset});
		const data = await mbApi.browse("release" as "release", { artist: mbid, limit: limit, offset: offset }, inc);
		checkError(data);
		return data;
	} catch (error) {
		err.handleError("Failed to fetch artist albums", error);
	}
}

async function getArtistFeaturedAlbums(mbid:string, offset = 0, limit = 100, inc = ["url-rels", "recordings", "isrcs"] as any): Promise<IBrowseReleasesResult | null | undefined> {
	try {
		// const data = await mbApi.browse('release', {track_artist: mbid, limit: limit, offset: offset});
		const data = await mbApi.browse('release' as 'release', { track_artist: mbid, limit: limit, offset: offset } as any, inc);
		checkError(data);
		return data;
	} catch (error) {
		err.handleError("Failed to fetch artist featured albums", error);
	}
}

async function getAlbumByUPC(upc:string): Promise<IReleaseList | null | undefined> {
	try {
		const data = await mbApi.search("release", { query: `barcode:${upc}`, inc: ["artist-rels"], limit: 20 });
		checkError(data);
		return data;
	} catch (error) {
		err.handleError("Failed to fetch album", error);
	}
}

async function getTrackByISRC(isrc: string): Promise<IRecordingList | null | undefined> {
	try {
		const data = await mbApi.search("recording", { query: `isrc:${isrc}`, inc: ["artist-rels"], limit: 20 });
		checkError(data);
		return data;
	} catch (error) {
		err.handleError("Failed to fetch album", error);
	}
}

async function getCoverByMBID(mbid: string): Promise<ICoversInfo | undefined> {
	try {
		const coverInfo = await coverArtArchiveApiClient.getReleaseCovers(mbid);
		return coverInfo;
	} catch (error) {
		err.handleError("Failed to fetch cover", error);
	}
}

async function serachForAlbumByArtistAndTitle(mbid: string, title: string): Promise<IReleaseList | null | undefined> {
	try {
		const data = await mbApi.search("release", { query: `arid:${mbid} AND release:${title}`, inc: ["artist-rels"], limit: 20 });
		checkError(data);
		return data;
	} catch (error) {
		err.handleError("Failed to search for album by artist and title", error);
	}
}

async function getAlbumByMBID(mbid: string, inc = ["artist-rels", "recordings", "isrcs"]): Promise<IRelease | null | undefined> {
	try {
		const data = await mbApi.lookup("release" as "release", mbid, inc as any);
		checkError(data);
		return data;
	} catch (error) {
		err.handleError("Failed to fetch album by MBID", error);
	}
}

async function getArtistFeaturedReleaseCount(mbid: string): Promise<number | null | undefined> {
	try {
		const data = await mbApi.browse("release" as "release", { track_artist: mbid, limit: 1 } as IBrowseReleasesQuery);
		checkError(data);
		if (!data["release-count"]) {
			return null;
		}
		return data["release-count"];
	} catch (error) {
		err.handleError("Failed to fetch artist featured release count", error);
	}
}

async function getArtistReleaseCount(mbid: string): Promise<number | null | undefined> {
	try {
		const data = await mbApi.browse("release" as "release", { artist: mbid, limit: 1 } as IBrowseReleasesQuery);
		checkError(data);
		if (data["release-count"] == undefined || data["release-count"] == null) {
			return null;
		}
		return data["release-count"];
	} catch (error) {
		err.handleError("Failed to fetch artist release count", error);
	}
}

async function getTrackById(mbid: string): Promise<IRecording | null | undefined> {
	try {
		const data = await mbApi.lookup("recording", mbid, ["artist-rels", "isrcs", "url-rels"]);
		checkError(data);
		return data;
	} catch (error) {
		err.handleError("Failed to fetch track by ID", error);
	}
}

function getTrackISRCs(track: IRecording): string[] | null {
	if (!track) return null;
	let isrcs = track?.isrcs || [];
	return isrcs;
}

function getAlbumUPCs(album: IRelease): string[] | null {
	if (!album) return null;
	let upcs = album?.barcode ? [album.barcode] : [];
	return upcs;
}

function parseUrl(url: string): UrlData | null {
	const regex = /musicbrainz\.org\/([a-z\-]+)\/([0-9a-fA-F\-]{36})/;
	const match = url.match(regex);
	if (match) {
		const typeDict = { 'release': 'album', 'recording': 'track', 'artist': 'artist' };
		return {
			type: typeDict[match[1]],
			id: match[2],
		};
	}
	return null;
}

function createUrl(type: string, id: string): string {
	return `https://musicbrainz.org/${type}/${id}`;
}

const musicbrainz = {
	namespace,
	getIdBySpotifyId: withCache(getIdBySpotifyId, { ttl: 60 * 15, namespace: namespace }),
	getIdsBySpotifyUrls: withCache(getIdsBySpotifyUrls, { ttl: 60 * 15, namespace: namespace }),
	getArtistAlbums: withCache(getArtistAlbums, { ttl: 60 * 15, namespace: namespace }),
	getArtistFeaturedAlbums: withCache(getArtistFeaturedAlbums, { ttl: 60 * 15, namespace: namespace }),
	getAlbumByUPC: withCache(getAlbumByUPC, { ttl: 60 * 15, namespace: namespace }),
	getAlbumByMBID: withCache(getAlbumByMBID, { ttl: 60 * 15, namespace: namespace }),
	getTrackByISRC: withCache(getTrackByISRC, { ttl: 60 * 15, namespace: namespace }),
	getCoverByMBID: withCache(getCoverByMBID, { ttl: 60 * 15, namespace: namespace }),
	getAlbumsBySourceUrls: withCache(getAlbumsBySourceUrls, { ttl: 60 * 15, namespace: namespace }),
	serachForAlbumByArtistAndTitle: withCache(serachForAlbumByArtistAndTitle, { ttl: 60 * 15, namespace: namespace }),
	getArtistFeaturedReleaseCount: withCache(getArtistFeaturedReleaseCount, { ttl: 60 * 60, namespace: namespace }),
	getArtistReleaseCount: withCache(getArtistReleaseCount, { ttl: 60 * 60, namespace: namespace }),
	getTrackById: withCache(getTrackById, { ttl: 60 * 15, namespace: namespace }),
	getAlbumById: withCache(getAlbumByMBID, { ttl: 60 * 15, namespace: namespace }),
	getArtistByUrl: withCache(getArtistByUrl, { ttl: 60 * 15, namespace: namespace }),
	getArtistById: withCache(getArtistById, { ttl: 60 * 15, namespace: namespace }),
	parseUrl,
	createUrl,
	validateMBID,
	getTrackISRCs,
	getAlbumUPCs
};

export default musicbrainz;
