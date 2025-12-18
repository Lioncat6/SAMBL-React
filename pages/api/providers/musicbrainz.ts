import { MusicBrainzApi, CoverArtArchiveApi, IRelation, RelationsIncludes, IArtist, EntityType, IBrowseReleasesQuery, IRelease, IEntity, IRecording, ICoverInfo, ICoversInfo, IReleaseList, IUrlList, IUrlLookupResult, IUrl, IBrowseReleasesResult, IRecordingList, IArtistList, IArtistMatch, ITrack, IBrowseRecordingsQuery, UrlIncludes, ReleaseIncludes } from "musicbrainz-api";
import { UrlInfo, UrlMBIDDict, UrlData, Provider, TrackObject, ArtistObject, PartialArtistObject, AlbumObject, ExtendedAlbumObject, MusicBrainzProvider, AlbumData, ExtendedAlbumData } from "./provider-types";
import logger from "../../../utils/logger";
import withCache from "../../../utils/cache";
import ErrorHandler from "../../../utils/errorHandler";
import { format } from "path";
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

async function searchByArtistName(name: string): Promise<IArtistList | null | undefined> {
	try {
		const data = await mbApi.search("artist", { query: name, inc: ["url-rels"] });
		return data;
	} catch (error) {
		err.handleError("Failed to search by artist name", error);
	}
}

function formatArtistSearchData(rawData: IArtistList): IArtistMatch[] {
	return rawData.artists;
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

async function getArtistByUrl(url: string, inc:UrlIncludes[] = ["artist-rels"]): Promise<IArtist | null | undefined> {
	try {
		if (parseUrl(url)?.type == "artist" && validateMBID(parseUrl(url)?.id)){
			return await musicbrainz.getArtistById(parseUrl(url)?.id || "")
		}
		const data = await mbApi.lookupUrl(url, inc );
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

async function getAlbumsBySourceUrls(sourceUrls: string[], inc?: UrlIncludes[]): Promise<IUrlLookupResult | null | undefined>;
async function getAlbumsBySourceUrls(sourceUrls: string, inc?: UrlIncludes[]): Promise<IUrl | null | undefined>;
async function getAlbumsBySourceUrls(sourceUrls: string | string[], inc: UrlIncludes[] = ["release-rels"]): Promise<IUrlLookupResult | IUrl | null | undefined> {
	try {
		if (Array.isArray(sourceUrls)) {
			const data = await mbApi.lookupUrl(sourceUrls as string[], inc as UrlIncludes[]);
			if (data["url-count"] === 0) {
				return null;
			}
			return data as IUrlLookupResult;
		} else {
			const data = await mbApi.lookupUrl(sourceUrls as string, inc as UrlIncludes[]);
			if (!data.relations || data.relations.length === 0) {
				return null;
			}
			return data as IUrl;
		}
	} catch (error) {
		err.handleError("Failed to fetch albums by Source URL(s)", error);
	}
}

async function getArtistAlbums(mbid: string, offset = 0, limit = 100, inc: ReleaseIncludes[] = ["url-rels", "recordings", "isrcs", "recording-level-rels", "artist-credits"]): Promise<IBrowseReleasesResult | null | undefined> {
	try {
		// const data = await mbApi.browse('release', {artist: mbid, limit: limit, offset: offset});
		const data = await mbApi.browse("release" as "release", { artist: mbid, limit: limit, offset: offset }, inc);
		checkError(data);
		return data;
	} catch (error) {
		err.handleError("Failed to fetch artist albums", error);
	}
}

async function getArtistFeaturedAlbums(mbid: string, offset = 0, limit = 100, inc:ReleaseIncludes[] = ["url-rels", "recordings", "isrcs", "recording-level-rels", "artist-credits"]): Promise<IBrowseReleasesResult | null | undefined> {
	try {
		// const data = await mbApi.browse('release', {track_artist: mbid, limit: limit, offset: offset});
		const data = await mbApi.browse('release' as 'release', { track_artist: mbid, limit: limit, offset: offset } as IBrowseReleasesQuery, inc);
		checkError(data);
		return data;
	} catch (error) {
		err.handleError("Failed to fetch artist featured albums", error);
	}
}

async function getAlbumByUPC(upc: string): Promise<IReleaseList | null | undefined> {
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

async function searchForAlbumByArtistAndTitle(mbid: string, title: string): Promise<IReleaseList | null | undefined> {
	try {
		const data = await mbApi.search("release", { query: `arid:${mbid} AND release:${title}`, inc: ["artist-rels"], limit: 20 });
		checkError(data);
		return data;
	} catch (error) {
		err.handleError("Failed to search for album by artist and title", error);
	}
}

async function getAlbumByMBID(mbid: string, inc: ReleaseIncludes[] = ["artist-rels", "recordings", "isrcs"]): Promise<IRelease | null | undefined> {
	try {
		const data = await mbApi.lookup("release" as "release", mbid, inc);
		checkError(data);
		return data;
	} catch (error) {
		err.handleError("Failed to fetch album by MBID", error);
	}
}

async function getAlbumById(mbid: string): Promise<IRelease | null | undefined> {
	try {
		const data = await mbApi.lookup("release" as "release", mbid, ["artist-rels", "recordings", "isrcs"] as RelationsIncludes[]);
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

function formatAlbumGetData(rawData: IReleaseList): ExtendedAlbumData {
	return {
		count: rawData["release-count"] || null,
		current: rawData.releases ? rawData.releases.length : null,
		next: null,
		albums: rawData.releases.map(release => formatAlbumObject(release)),
	}
}

function formatAlbumObject(album: IRelease): ExtendedAlbumObject {
	let trackCount: number | null = null;
	if (album.media.length > 0) {
		let numTracks = 0
		album.media.forEach(media => {
			numTracks += media["track-count"];
		})
		trackCount = numTracks
	}

	return {
		provider: namespace,
		id: album.id,
		name: album.title,
		comment: album.disambiguation || null,
		url: createUrl('release', album.id),
		imageUrl: null,
		imageUrlSmall: null,
		albumArtists: album["artist-credit"] ? album["artist-credit"].map(ac => formatArtistObject(ac.artist)) : [],
		artistNames: album["artist-credit"] ? album["artist-credit"].map(ac => ac.name) : [],
		releaseDate: album.date || null,
		upc: album.barcode || null,
		trackCount: trackCount,
		albumType: album["release-group"] ? album["release-group"]["primary-type"] : null,
		albumTracks: album.media && album.media.length > 0 ? album.media.flatMap(medium => medium.tracks.map(track => formatTrackObject(track))) : [],
		externalUrls: album.relations ? album.relations.filter(rel => rel.url && rel.url?.resource).map(rel => rel.url?.resource).filter(url => typeof url == 'string') : [],
		hasImage: album["cover-art-archive"].artwork
	}
}


function formatTrackObject(track: IRecording | ITrack): TrackObject {
	let trackNumber: number | null = null;
	let recording: IRecording = track as IRecording;
	if (!('isrcs' in track)) {
		let releaseTrack: ITrack = track as unknown as ITrack
		trackNumber = releaseTrack.position || null;
		recording = releaseTrack.recording;
	}
	return {
		provider: namespace,
		id: recording.id,
		name: recording.title,
		url: createUrl('recording', recording.id),
		duration: recording.length || 0,
		imageUrl: null,
		imageUrlSmall: null,
		trackArtists: recording["artist-credit"] ? recording["artist-credit"].map(ac => formatArtistObject(ac.artist)) : [],
		artistNames: recording["artist-credit"] ? recording["artist-credit"].map(ac => ac.name) : [],
		albumName: recording.releases && recording.releases.length > 0 ? recording.releases[0].title : '',
		releaseDate: recording["first-release-date"] || null,
		trackNumber: trackNumber || null,
		isrcs: recording.isrcs || [],
	}
}

function getArtistImage(artist: IArtist): string | null {
	if (!artist || !artist.relations) return null;
	const imageRel = artist.relations.find((rel) => rel.type.toLowerCase() === "image" && rel["target-type"] === "url");
	if (imageRel && imageRel.url && imageRel.url.resource) {
		return imageRel.url.resource;
	}
	return null;
}

function formatArtistLookupData(artist: IArtist): IArtist {
	return artist;
}

function formatArtistObject(artist: IArtist): ArtistObject {
	return {
		provider: namespace,
		id: artist.id,
		name: artist.name,
		url: createUrl('artist', artist.id),
		imageUrl: getArtistImage(artist),
		imageUrlSmall: getArtistImage(artist),
		bannerUrl: null,
		relevance: artist.country || '',
		info: artist.disambiguation || '',
		genres: null, // Library is missing feature for now
		followers: null,
		popularity: null,
	}
}

function formatPartialArtistObject(artist: IArtist): PartialArtistObject {
	return {
		provider: namespace,
		id: artist.id,
		name: artist.name,
		url: createUrl('artist', artist.id),
		imageUrl: null,
		imageUrlSmall: null,
	}
}

function getArtistUrl(artist: IArtist): string | null {
	return createUrl('artist', artist.id);
}

const musicbrainz: MusicBrainzProvider = {
	namespace,
	getIdBySpotifyId: withCache(getIdBySpotifyId, { ttl: 60 * 15, namespace: namespace }),
	getIdsBySpotifyUrls: withCache(getIdsBySpotifyUrls, { ttl: 60 * 15, namespace: namespace }),
	getArtistAlbums: withCache(getArtistAlbums, { ttl: 60 * 15, namespace: namespace }),
	getMBArtistAlbums: withCache(getArtistAlbums, { ttl: 60 * 15, namespace: namespace }),
	getArtistFeaturedAlbums: withCache(getArtistFeaturedAlbums, { ttl: 60 * 15, namespace: namespace }),
	getAlbumByUPC: withCache(getAlbumByUPC, { ttl: 60 * 15, namespace: namespace }),
	getTrackByISRC: withCache(getTrackByISRC, { ttl: 60 * 15, namespace: namespace }),
	getCoverByMBID: withCache(getCoverByMBID, { ttl: 60 * 15, namespace: namespace }),
	getAlbumsBySourceUrls: withCache(getAlbumsBySourceUrls, { ttl: 60 * 15, namespace: namespace }),
	searchForAlbumByArtistAndTitle: withCache(searchForAlbumByArtistAndTitle, { ttl: 60 * 15, namespace: namespace }),
	getArtistFeaturedReleaseCount: withCache(getArtistFeaturedReleaseCount, { ttl: 60 * 60, namespace: namespace }),
	getArtistReleaseCount: withCache(getArtistReleaseCount, { ttl: 60 * 60, namespace: namespace }),
	getTrackById: withCache(getTrackById, { ttl: 60 * 15, namespace: namespace }),
	getAlbumByMBID: withCache(getAlbumByMBID, { ttl: 60 * 15, namespace: namespace }),
	getAlbumById: withCache(getAlbumByMBID, { ttl: 60 * 15, namespace: namespace }),
	getArtistByUrl: withCache(getArtistByUrl, { ttl: 60 * 15, namespace: namespace }),
	getArtistById: withCache(getArtistById, { ttl: 60 * 15, namespace: namespace }),
	searchByArtistName: withCache(searchByArtistName, { ttl: 60 * 15, namespace: namespace }),
	formatArtistSearchData,
	getArtistUrl,
	formatTrackObject,
	formatArtistObject,
	formatArtistLookupData,
	formatPartialArtistObject,
	formatAlbumObject,
	formatAlbumGetData,
	parseUrl,
	createUrl,
	validateMBID,
	getTrackISRCs,
	getAlbumUPCs
};

export default musicbrainz;
