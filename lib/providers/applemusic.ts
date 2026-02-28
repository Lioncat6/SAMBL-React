import withCache from "../../utils/cache";
import ErrorHandler from "../../utils/errorHandler";
import { AlbumObject, ArtistObject, FullProvider, PartialArtistObject, RawAlbumData, RegexArtistUrlQuery, TrackObject, UrlType } from "../../types/provider-types";
import { URL } from "url";
import parsers from "../../lib/parsers/parsers";

interface Artwork {
	url: string;
	width: number;
	height: number;
}

interface ArtistAttributes {
	artwork?: Artwork;
	name: string;
	genreNames: string[];
	origin: string;
	hero?: {
		content: {
			artwork: Artwork;
		}[]
	}[];
	url: string;
}

interface AlbumAttributes {
	artistName: string;
	artwork: Artwork;
	genreNames: string[];
	name: string;
	trackCount: number;
	releaseDate: string;
	recordLabel?: string;
	isSingle: boolean;
	isCompilation: boolean;
	isPrerelease: boolean;
	copyright?: string;
	upc?: string;
	url: string;
}

interface SongAttributes {
	artistName: string;
	albumName?: string;
	composerName: string;
	discNumber: number;
	trackNumber: number;
	name: string;
	isrc: string;
	releaseDate?: string;
	url: string;
	artwork?: Artwork;
	durationInMillis: number;
}

interface Resource<TAttributes> {
	id: string;
	type: string;
	attributes: TAttributes;
	relationships: {
		artists?: ResourceResponse<Resource<ArtistAttributes>>;
		tracks?: ResourceResponse<Resource<SongAttributes>>;
	};
}

interface ResourceResponse<TResource> {
	data: TResource[];
}

interface SearchResponse {
	results: {
		artists?: {
			data: Resource<ArtistAttributes>[];
		};
	};
}

const HEADERS = {
	"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0",
	"Referer": "https://music.apple.com/",
	"Origin": "https://music.apple.com"
};

const namespace = "applemusic";

const {createUrl, parseUrl} = parsers.getParser(namespace);

const err = new ErrorHandler(namespace);

let cachedToken = {
	value: "",
	expires: new Date(0)
};

async function getToken(): Promise<string> {
	if (cachedToken.expires.getTime() > new Date().getTime()) {
		return cachedToken.value;
	}

	const homeRes = await fetch("http://music.apple.com", {
		headers: HEADERS
	});

	const homeBody = await homeRes.text();
	const scriptMatch = homeBody.match(/<script.*type="module".*src="(.+?)"/);
	if (!scriptMatch) throw new Error("Could not locate script");

	const scriptRes = await fetch(new URL(scriptMatch[1], "http://music.apple.com"), {
		headers: HEADERS
	});

	const scriptBody = await scriptRes.text();
	const tokenMatch = scriptBody.match(/(?<=")eyJhbGciOiJ.+?(?=")/);
	if (!tokenMatch) throw new Error("Could not locate token");

	const token = tokenMatch[0];
	const tokenParts = token.split(".");
	const tokenEncodedPayload = tokenParts[1];
	const tokenPayload = JSON.parse(atob(tokenEncodedPayload));
	const expires = new Date((tokenPayload.exp - 86400) * 1000);

	cachedToken = {
		value: token,
		expires
	};

	return token;
}

async function get<T>(path: string, params?: Record<string, any>): Promise<T | null> {
	const url = new URL(path, "https://amp-api.music.apple.com/v1/catalog/us/");
	if (params) url.search = new URLSearchParams(params).toString();

	const res = await fetch(url, {
		headers: {
			...HEADERS,
			Authorization: `Bearer ${await getToken()}`
		}
	});

	if (res.status === 404) return null;

	return await res.json() as any;
}

function getOriginalImageUrl(url: null | undefined): null;
function getOriginalImageUrl(url: string): string;
function getOriginalImageUrl(url: string | null | undefined): string | null
function getOriginalImageUrl(url: string | null | undefined): string | null {
	if (url == null) return null;
	return url.replace(/is\d-ssl/, "a1").replace(/\/{w}x{h}.+/, "").replace("image/thumb", "r40");
}

function getResizedImageUrl(url: null | undefined, width: number, height: number): null;
function getResizedImageUrl(url: string, width: number, height: number): string;
function getResizedImageUrl(url: string | null | undefined, width: number, height: number): string | null
function getResizedImageUrl(url: string | null | undefined, width: number, height: number): string | null {
	if (url == null) return null;
	return url.replace("{w}x{h}", `${width}x${height}`).replace("ac.", "bb.");
}

function getArtistImageUrls(artist: Resource<ArtistAttributes>): { imageUrl: string | null, imageUrlSmall: string | null } {
	const noImage = artist.attributes.artwork?.url.includes("AMCArtistImages") ?? true;
	const imageUrl = artist.attributes.artwork?.url;
	const alternateUrl = artist.attributes.hero?.[0]?.content[0]?.artwork?.url;
	return {
		imageUrl: !noImage ? getOriginalImageUrl(imageUrl) : getResizedImageUrl(alternateUrl, 4000, 4000),
		imageUrlSmall: !noImage ? getResizedImageUrl(imageUrl, 250, 250) : getResizedImageUrl(alternateUrl, 250, 250) 
	};
}

async function getTrackByISRC(isrc: string): Promise<TrackObject[] | null> {
	try {
		const resourceResponse = await get<ResourceResponse<Resource<SongAttributes>>>("songs", {
			"include": "artists",
			"include[songs]": "artists",
			"filter[isrc]": isrc
		});
		return resourceResponse?.data.map(formatTrackObject) ?? [];
	} catch (error) {
		err.handleError("Error fetching track data:", error);
		return null;
	}
}

async function getAlbumByUPC(upc: string): Promise<AlbumObject[] | null> {
	try {
		const resourceResponse = await get<ResourceResponse<Resource<AlbumAttributes>>>("albums", {
			"include": "artists",
			"include[albums]": "tracks",
			"include[songs]": "artists",
			"include[music-videos]": "artists",
			"filter[upc]": upc
		});

		return resourceResponse?.data.map(formatAlbumObject) ?? null;
	} catch (error) {
		err.handleError("Error fetching album data:", error);
		return null;
	}
}

async function searchByArtistName(query: string): Promise<Resource<ArtistAttributes>[] | null> {
	try {
		const searchResponse = await get<SearchResponse>("search", { term: query, types: "artists", limit: 50, extend: "hero,origin" });
		return searchResponse?.results.artists?.data ?? [];
	} catch (error) {
		err.handleError("Error searching for artist:", error);
		return null;
	}
}

async function getAlbumById(id: string): Promise<Resource<AlbumAttributes> | null> {
	try {
		const resourceResponse = await get<ResourceResponse<Resource<AlbumAttributes>>>(`albums/${id}`, {
			"include": "artists,tracks",
			"include[songs]": "artists",
			"include[music-videos]": "artists"
		});

		return resourceResponse?.data[0] ?? null;
	} catch (error) {
		err.handleError("Error fetching album by ID:", error);
		return null;
	}
}

async function getTrackById(id: string): Promise<Resource<SongAttributes> | null> {
	try {
		const resourceResponse = await get<ResourceResponse<Resource<SongAttributes>>>(`songs/${id}`, {
			"include": "artists"
		});

		return resourceResponse?.data[0] ?? null;
	} catch (error) {
		err.handleError("Error fetching track by ID:", error);
		return null;
	}
}

async function getArtistById(id: string): Promise<any | null> {
	try {
		const resourceResponse = await get<ResourceResponse<Resource<ArtistAttributes>>>(`artists/${id}`, {
			extend: "hero,origin"
		});

		return resourceResponse?.data[0] ?? null;
	} catch (error) {
		err.handleError("Error fetching artist by ID:", error);
		return null;
	}
}

async function getArtistAlbums(artistId: string, offset: number, limit: number): Promise<any | null> {
	offset = Number(offset);
	limit = Number(limit);
	if (isNaN(offset)) offset = 0
	if (isNaN(limit) || limit == 0) limit = 100

	try {
		const resourceResponse = await get<ResourceResponse<Resource<AlbumAttributes>>>(`artists/${artistId}/albums`, {
			"offset": offset,
			"limit": limit,
			"include": "artists,tracks",
			"include[songs]": "artists",
			"include[music-videos]": "artists"
		});

		const albums = resourceResponse?.data ?? [];
		return {
			current: offset,
			next: albums.length < limit ? null : offset + limit,
			count: albums.length < limit ? albums.length + offset : null,
			albums
		};
	} catch (error) {
		err.handleError("Error fetching artist albums:", error);
		return null;
	}
}

function formatArtistSearchData(rawData: Resource<ArtistAttributes>[]): Resource<ArtistAttributes>[] {
	return rawData;
}

function formatArtistLookupData(rawData: any): any {
	return rawData;
}

function formatArtistObject(artist: Resource<ArtistAttributes>): ArtistObject {
	const imageUrls = getArtistImageUrls(artist);
	return {
		name: artist.attributes.name,
		url: createUrl("artist", artist.id)!,
		imageUrl: imageUrls.imageUrl,
		imageUrlSmall: imageUrls.imageUrlSmall,
		bannerUrl: null,
		relevance: artist.attributes.origin,
		info: artist.attributes.genreNames.join(", "),
		genres: artist.attributes.genreNames,
		followers: null,
		popularity: null,
		id: artist.id,
		provider: namespace,
		type: "artist"
	};
}

function formatPartialArtistObject(artist: Resource<ArtistAttributes>): PartialArtistObject {
	const imageUrls = getArtistImageUrls(artist);

	return {
		name: artist.attributes.name,
		url: createUrl("artist", artist.id)!,
		imageUrl: imageUrls.imageUrl,
		imageUrlSmall: imageUrls.imageUrlSmall,
		id: artist.id,
		provider: namespace,
		type: "partialArtist"
	};
}

function formatAlbumGetData(rawData: any): RawAlbumData {
	return rawData;
}

function formatAlbumObject(album: Resource<AlbumAttributes>): AlbumObject {
	return {
		id: album.id,
		name: album.attributes.name.replace(/ - (Single|EP)$/, ""),
		url: createUrl("album", album.id)!,
		imageUrl: getOriginalImageUrl(album.attributes.artwork.url),
		imageUrlSmall: getResizedImageUrl(album.attributes.artwork.url, 250, 250),
		albumArtists: album.relationships.artists?.data.map(formatPartialArtistObject) ?? [],
		artistNames: album.relationships.artists?.data.map(artist => artist.attributes.name) ?? [],
		releaseDate: album.attributes.releaseDate,
		trackCount: album.attributes.trackCount,
		albumType: album.attributes.name.endsWith(" - Single")
			? "Single"
			: album.attributes.name.endsWith(" EP")
				? "Ep"
				: "Album",
		upc: album.attributes.upc || null,
		albumTracks: album.relationships.tracks?.data.map(formatTrackObject) || [],
		provider: namespace,
		type: "album"
	};
}

function formatTrackObject(track: Resource<SongAttributes>): TrackObject {
	return {
		provider: namespace,
		id: track.id,
		name: track.attributes.name,
		url: createUrl("track", track.id)!,
		imageUrl: getOriginalImageUrl(track.attributes.artwork?.url),
		imageUrlSmall: getResizedImageUrl(track.attributes.artwork?.url, 100, 100),
		trackArtists: track.relationships.artists?.data.map(formatPartialArtistObject) || [],
		artistNames: track.relationships.artists?.data.map(artist => artist.attributes.name) || [],
		albumName: track.attributes.albumName || null,
		releaseDate: track.attributes.releaseDate || null,
		trackNumber: track.attributes.trackNumber,
		duration: track.attributes.durationInMillis,
		isrcs: [ track.attributes.isrc ],
		type: "track"
	};
}

function getArtistUrl(artist: Resource<ArtistAttributes>): string | null {
	// Most used Apple Music storefronts links on MusicBrainz.
	//TODO https://tickets.metabrainz.org/browse/MBS-14227
	return createUrl("artist", artist.id, "us");
}

function getTrackISRCs(track: Resource<SongAttributes>): string[] | null {
	return [ track.attributes.isrc ];
}

function getAlbumUPCs(album: Resource<AlbumAttributes>): string[] | null {
	return album.attributes.upc ? [ album.attributes.upc ] : [];
}


function buildUrlSearchQuery(type: UrlType, ids: string[]): RegexArtistUrlQuery {
	const appleType: Record<UrlType, string> = {
		"artist": "artist",
		"album": "album",
		"track": "song"
	}
	const regex: RegExp | null = new RegExp(`https:\/\/music\\\.apple\\\.com\/[a-zA-Z]{2}\/${appleType[type]}\/(${ids.join("|")})`);
	let idQueryMap: { [key: string]: RegExp["source"] } = {};
	ids.forEach((id) => {
		const regex: RegExp | null = new RegExp(`https:\/\/music\\\.apple\\\.com\/[a-zA-Z]{2}\/${appleType[type]}\/${id}`);
		idQueryMap[id]= regex.source
	})
	const query: RegexArtistUrlQuery = {
		fullQuery: regex.source,
		idQueries: idQueryMap
	}
	return query;
}

const applemusic: FullProvider = {
	namespace,
	getTrackByISRC: withCache(getTrackByISRC, { ttl: 60 * 30, namespace }),
	getAlbumByUPC: withCache(getAlbumByUPC, { ttl: 60 * 30, namespace }),
	searchByArtistName: withCache(searchByArtistName, { ttl: 60 * 30,  namespace }),
	getAlbumById: withCache(getAlbumById, { ttl: 60 * 30, namespace }),
	getTrackById: withCache(getTrackById, { ttl: 60 * 30, namespace }),
	getArtistById: withCache(getArtistById, { ttl: 60 * 30, namespace }),
	getArtistAlbums: withCache(getArtistAlbums, { ttl: 60 * 30, namespace }),
	formatArtistSearchData,
	formatArtistLookupData,
	formatArtistObject,
	formatPartialArtistObject,
	formatAlbumGetData,
	formatAlbumObject,
	formatTrackObject,
	getTrackISRCs,
	getAlbumUPCs,
	parseUrl,
	createUrl,
	buildUrlSearchQuery
};

export default applemusic;
