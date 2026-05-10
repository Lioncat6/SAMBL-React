// Some code usage from https://github.com/kellnerd/harmony/blob/main/providers/Discogs
// Liscense: MIT

import { ArtistObject, AlbumObject, TrackObject, AlbumData, PartialArtistObject, FullProvider, RawAlbumData, Capabilities, LabelObject } from "../../types/provider-types";
import logger from "../../utils/logger";
import text from "../../utils/text";
import withCache from "../../utils/cache";
import ErrorHandler from "../../utils/errorHandler";
import parsers from "../parsers/parsers";
import { Artist, DiscogsClient, Format, GetArtistReleasesResponses, GetArtistResponse, GetMasterVersionsResponse, GetReleaseResponse, Label, PaginationResponse, SearchResponse, SearchResult } from '@lionralfs/discogs-client'
import { create } from "node:domain";
import { release } from "node:os";
import { get } from "node:http";
import { AlbumIssues } from "../issues";
const namespace = "discogs";

const err = new ErrorHandler(namespace);

const { parseUrl, createUrl } = parsers.getParser(namespace);


export interface DiscogsApiError {
	message: string;
}

const apiBaseUrl = "https://api.discogs.com";

const discogsKey = process.env.DISCOGS_CONSUMER_KEY || "";
const discogsSecret = process.env.DISCOGS_CONSUMER_SECRET || "";

let discogsClient = new DiscogsClient({
	userAgent: `${process.env.REACT_APP_NAME}/${process.env.REACT_APP_VERSION} (${process.env.CONTACT_INFO})`,
	auth: {
		method: 'discogs',
		consumerKey: discogsKey,
		consumerSecret: discogsSecret,
	},
});

discogsClient.setConfig({
    exponentialBackoffIntervalMs: 2000,
    exponentialBackoffMaxRetries: 5,
    exponentialBackoffRate: 2.7,
});

let discogsDB = discogsClient.database();

async function searchByArtistName(query: string): Promise<SearchResponse | null> {
	try {
		const data = await discogsDB.search({ query, type: "artist" });
		return data.data;
	} catch (error) {
		err.handleError("Error searching by artist name", error);
		return null;
	}
}

function formatArtistSearchData(rawData: SearchResponse): SearchResult[] {
	return rawData.results;
}

function getArtistImage(artistData: GetArtistResponse): string | null {
	if (artistData.images && artistData.images.length > 0) {
		return artistData.images[0].uri;
	}
	return null;
}

function formatArtistObject(artist: SearchResult | GetArtistResponse): ArtistObject {
	if ("name" in artist) {
		artist = artist as GetArtistResponse;
		return {
			type: 'artist',
			provider: namespace,
			id: String(artist.id),
			name: artist.name,
			url: createUrl("artist", String(artist.id)),
			bannerUrl: null,
			imageUrl: getArtistImage(artist),
			imageUrlSmall: getArtistImage(artist),
			info: artist.namevariations?.join(", ") || "",
			relevance: artist.profile || "",
			genres: null,
			followers: null,
			popularity: null
		};

	} else {
		artist = artist as SearchResult;
		return {
			type: 'artist',
			provider: namespace,
			id: String(artist.id),
			name: artist.title,
			url: createUrl("artist", String(artist.id)),
			bannerUrl: null,
			imageUrl: artist.thumb || null,
			imageUrlSmall: artist.thumb || null,
			info: artist.country || "",
			relevance: artist.country || "",
			genres: null,
			followers: null,
			popularity: null
		};
	}
}

function formatPartialArtistObject(artist: Artist): PartialArtistObject {
	return {
		type: "partialArtist",
		provider: namespace,
		id: String(artist.id),
		name: artist.name,
		url: createUrl("artist", String(artist.id)),
		imageUrl: null,
		imageUrlSmall: null,
	}
}

async function getArtistById(discogsId: string): Promise<GetArtistResponse | null> {
	try {
		const data = await discogsDB.getArtist(discogsId);
		return data.data;
	} catch (error) {
		err.handleError("Error fetching artist by ID:", error);
		return null;
	}
}

function formatArtistLookupData(rawData: GetArtistResponse): GetArtistResponse {
	return rawData;
}

type ArtistAlbumsResponse = {
	mainAlbums: (SearchResponse & PaginationResponse) | null,
	featuredAlbums: (SearchResponse & PaginationResponse) | null,
	releases: (GetArtistReleasesResponses & PaginationResponse) | null,
	albumArtist: ArtistObject | null;
};

// async function getMasterReleases(master: GetArtistReleasesResponses['releases'][number]): Promise<GetArtistReleasesResponses['releases'] | null> {
// 	console.log(`Fetching master releases for master ID ${master.id}...`);
// 	try {
// 		const data = await discogsDB.getMasterVersions(master.id);
// 		if (data && data.data && data.data.versions) {
// 			let moddedReleases: GetArtistReleasesResponses['releases'] = []
// 			for (const release of data.data.versions) {
// 				moddedReleases.push({ 
// 					...release, 
// 					artist: master.artist, 
// 					main_release: master.main_release, 
// 					role: master.role, 
// 					type: 'release', 
// 					year: master.year });
// 			}
// 			return moddedReleases;
// 		}
// 	} catch (error) {
// 		err.handleError("Error fetching master releases:", error);
// 		return null;
// 	}
// 	return null;
// }

type artistAlbumResult = (PartialDiscogsRelease | PartialDiscogsSearchResult)
type artistAlbumsResults = artistAlbumResult[];

async function getArtistAlbums(artistId: string, offset: string = "1:1", limit: number = 25): Promise<artistAlbumsResults | null> {
	try {
		const artistData = await discogs.getArtistById(artistId);
		let formattedArtistData: ArtistObject | null = null;
		if (artistData) {
			formattedArtistData = formatArtistObject(artistData);
		} else {
			return null;
		}
		// let data = await discogsDB.getArtistReleases(artistId, { per_page: limit, page: Math.floor(offset / limit) + 1 });
		// let releases = data.data.releases;
		// let masters = releases.filter(release => release.type === "master");
		// let masterReleases: GetArtistReleasesResponses['releases'] = [];
		// for (let i = 0; i < masters.length; i++) {
		// 	const master = masters[i];
		// 	const masterVersions = await getMasterReleases(master);
		// 	if (masterVersions) {
		// 		masterReleases.push(...masterVersions);
		// 	}
		// 	if (i < masters.length - 1) {
		// 		await new Promise(resolve => setTimeout(resolve, 250));
		// 	}
		// }
		// data.data.releases.push(...masterReleases);
		// 
		// const pageData = offset.split(":");
	
		// if (pageData.length == 3) {
		// 	mainPage = Number(pageData[0])
		// 	featuredPage = Number(pageData[1])
		// 	releasesPage = Number(pageData[2])
		// }
		// const mainData = mainPage > 0 ? await discogsDB.search({ artist: formattedArtistData.name, type: "release",  per_page: limit, page: mainPage }): null;
		// const featuredData = featuredPage > 0 ? await discogsDB.search({ credit: formattedArtistData.name, type: "release",  per_page: limit, page: featuredPage }): null;
		// const releases = releasesPage > 0 ? await discogsDB.getArtistReleases(artistId, {per_page: limit, page: featuredPage }) : null;

		let mainAlbums: SearchResult[] = [];
		let featuredAlbums: SearchResult[] = []; 
		let releases: GetArtistReleasesResponses["releases"] = [];
		let mainPage = 1;
		let featuredPage = 1;
		let releasesPage = 1;
		const searchWithCache = withCache(discogsDB.search, { ttl: 60 * 60, namespace: namespace });
		let mainDataResponse = await searchWithCache({ artist: formattedArtistData.name, type: "release",  per_page: 100, page: mainPage });
		if (mainDataResponse?.data.results) {
			mainAlbums.push(...mainDataResponse.data.results)
		}
		while (mainDataResponse.data.pagination.urls.next){
			mainPage++;
			mainDataResponse = await searchWithCache({ artist: formattedArtistData.name, type: "release",  per_page: 100, page: mainPage });
			if (mainDataResponse?.data.results) {
				mainAlbums.push(...mainDataResponse.data.results)
			}
		}
		let featuredDataResponse = await searchWithCache({ credit: formattedArtistData.name, type: "release",  per_page: 100, page: featuredPage });
		if (featuredDataResponse?.data.results) {
			featuredAlbums.push(...featuredDataResponse.data.results)
		}
		while (featuredDataResponse.data.pagination.urls.next){
			featuredPage++;
			featuredDataResponse = await searchWithCache({ credit: formattedArtistData.name, type: "release",  per_page: 100, page: featuredPage });
			if (featuredDataResponse?.data.results) {
				featuredAlbums.push(...featuredDataResponse.data.results)
			}
		}
		const getReleasesWithCache = withCache(discogsDB.getArtistReleases, { ttl: 60 * 60, namespace: namespace });
		let releasesResponse = await getReleasesWithCache(artistId, {per_page: 100, page: releasesPage });
		if (releasesResponse?.data.releases) {
			releases.push(...releasesResponse?.data.releases)
		}
		while (releasesResponse.data.pagination.urls.next){
			releasesPage++;
			releasesResponse = await getReleasesWithCache(artistId, {per_page: 100, page: releasesPage });
			if (releasesResponse?.data.releases) {
				releases.push(...releasesResponse?.data.releases)
			}
		}
		let releaseIdMap: Record<number, PartialDiscogsRelease> = {};
		let masterIdMap: Record<number, PartialDiscogsRelease> = [];
		let matchedIdArray: number[] = [];
		for (let release of releases) {
			if (release.type == "release") releaseIdMap[release.id] = release
			if (release.type == "master") masterIdMap[release.id] = release
		}
		let finalAlbums: artistAlbumsResults = [];
		for (let result of [...mainAlbums, ...featuredAlbums] as PartialDiscogsSearchResult[]){
			if (Object.keys(releaseIdMap).includes(String(result.id)) || (result.master_id && Object.keys(masterIdMap).includes(String(result.master_id)))){
				result.albumArtist = formattedArtistData;
				result.release = releaseIdMap[result.id] || masterIdMap[result?.master_id || 'invalid'] || null
				finalAlbums.push(result);
				matchedIdArray.push(result.id);
			}
		}
		for (let release of releases as PartialDiscogsRelease[]) {
			if (release.type == "release") {
				if (!matchedIdArray.includes(release.id)){
					release.albumArtist = formattedArtistData;
					finalAlbums.push(release);
				}
			}
		}
		return finalAlbums;
	} catch (error) {
		err.handleError("Error fetching artist albums:", error);
		return null;
	}
}

function formatAlbumGetData(rawData: artistAlbumsResults): RawAlbumData {
	return {
		albums: rawData,
		count: rawData.length,
		current: 0,
		next: null,
	}
}

type PartialDiscogsRelease = GetArtistReleasesResponses["releases"][number] & {
	albumArtist?: ArtistObject | null;
};

type PartialDiscogsSearchResult = SearchResult & {
	release?: PartialDiscogsRelease | null;
	albumArtist?: ArtistObject | null;
};

function getAlbumImage(album: GetReleaseResponse): string | null {
	if (album.images && album.images.length > 0) {
		return album.images.find(image => image.type === "primary")?.uri || album.images[0].uri;
	}
	return null;
}

function findBarcode(identifiers: GetReleaseResponse["identifiers"]): string | null {
	const barcodes = identifiers.filter((identifier) => identifier.type === 'Barcode');
	if (!barcodes.length) {
		return null;
	}
	const gtinCandidates = barcodes.map((barcode) => (barcode.value));
	return gtinCandidates[0];
}

function cleanName(name: string): string {
	return name.replace(/ \(\d+\)$/, '');
}

function convertRawLabel(label: GetReleaseResponse["labels"][number]): LabelObject {
	let catalogNumber: string | null = label.catno;
	if (catalogNumber === 'none') {
		catalogNumber = '[none]';
	}

	return {
		name: cleanName(label.name),
		id: String(label.id),
		url: createUrl("label", String(label.id)),
		provider: namespace,
		type: "label",
		catalogNumber
	};
}

function getAlbumLabels(labels: GetReleaseResponse["labels"]): LabelObject[] | null {
	if (!labels) return null;
	let labelObjects: LabelObject[] = [];
	for (const label of labels) {
		const notOnLabelRegex = /Not On Label \([^\)]+\)/
		const labelIdBlacklist = ['1818']
		if (!labelIdBlacklist.includes(String(label.id)) && !notOnLabelRegex.test(label.name)) {
			labelObjects.push(convertRawLabel(label));
		}
	}
	return labelObjects;
}

type trackWithAlbum = GetReleaseResponse["tracklist"][number] & {
	album?: GetReleaseResponse;
	artists?: GetReleaseResponse["tracklist"][number]["extraartists"]; // TODO: https://github.com/lionralfs/discogs-client/pull/432
};

function formatTrackObject(track: trackWithAlbum): TrackObject {
	return {
		provider: namespace,
		id: null,
		name: track.title,
		url: null,
		imageUrl: null,
		imageUrlSmall: null,
		albumName: track.album?.title || null,
		trackArtists: track.artists?.map(formatPartialArtistObject) || [],
		trackNumber: null,
		duration: track.duration ? text.parseDuration(track.duration) : null,
		releaseDate: track.album?.released ? String(track.album.released) : null,
		artistNames: track.artists?.map(artist => artist.name) || [],
		isrcs: [],
		type: "track"
	}
}

function getAlbumType(types: GetReleaseResponse["formats"] | Format[] | undefined): string | null {
	if (!types) return null;
	const releaseTypeMap: Record<string, string> = {
		'Album': 'Album',
		'EP': 'EP',
		'Single': 'Single',
		'Compilation': 'Compilation',
		'Mixtape': 'Mixtape/Street',
		'Mini-Album': 'EP',
		'Maxi-Single': 'Single',
		'Mixed': 'DJ-mix',
		'Partially Mixed': 'DJ-mix',
		// 'Sampler' is for excerpts/preview of a bigger release, not 'Compilation'.
		// 'Tour Recording' is not for one-off live albums, better guess 'Live' from titles.
	};
	for (const format of types) {
		for (const description of format.descriptions || []) {
			if (releaseTypeMap[description]) {
				return releaseTypeMap[description];
			}
		}
	}
	return null;
}

function findSearchResultBarcode(barcodes: SearchResult["barcode"]): string | null {
	if (!barcodes) return null;
	return barcodes.find((barcode) => /^\d+$/.test(barcode.trim())) || null
}

function getReleaseLabels(release: PartialDiscogsSearchResult): LabelObject[] {
	let labels: LabelObject[] = []
	release.label?.forEach((label) => {
		labels.push({
			provider: namespace,
			type: 'label',
			name: label,
			id: null,
			url: null,
			catalogNumber: release.catno || undefined
		})
	})
	return labels;
}

function formatAlbumObject(album: PartialDiscogsRelease | GetReleaseResponse | SearchResult): AlbumObject {
	console.log(album)
	if ("artist" in album) {
		album = album as PartialDiscogsRelease;
		return {
			type: "album",
			provider: namespace,
			id: String(album.id),
			name: album.title,
			url: createUrl("album", String(album.id)),
			albumArtists: album.role === "Main" && album.albumArtist ? [album.albumArtist] : [],
			imageUrl: album.thumb || null,
			imageUrlSmall: album.thumb || null,
			artistNames: album.artist ? [album.artist] : [],
			releaseDate: album.year ? String(album.year) : null,
			trackCount: null,
			albumType: null,
			upc: null,
			albumTracks: [],
			labels: null,
			copyrights: null,
			genres: null
		}
	} else if ("artists" in album) {
		const fullalbum = album as GetReleaseResponse;
		return {
			type: "album",
			provider: namespace,
			id: String(fullalbum.id),
			name: fullalbum.title,
			url: createUrl("album", String(fullalbum.id)),
			albumArtists: fullalbum.artists.map(formatPartialArtistObject),
			imageUrl: getAlbumImage(fullalbum),
			imageUrlSmall: getAlbumImage(fullalbum),
			artistNames: fullalbum.artists.map(artist => artist.name),
			releaseDate: fullalbum.released ? String(fullalbum.released) : null,
			trackCount: fullalbum.tracklist ? fullalbum.tracklist.length : null,
			albumType: getAlbumType(fullalbum.formats),
			upc: findBarcode(fullalbum.identifiers) || null,
			labels: getAlbumLabels(fullalbum.labels),
			copyrights: null,
			genres: fullalbum.genres || null,
			albumTracks: fullalbum.tracklist.map(track => formatTrackObject({ ...track, album: fullalbum })) || []
		}
	} else {
		const fullalbum = album as PartialDiscogsSearchResult;
		return {
			type: "album",
			provider: namespace,
			id: String(fullalbum.id),
			name: fullalbum.release?.title || fullalbum.title,
			url: createUrl("album", String(fullalbum.id)),
			albumArtists: (fullalbum.release?.role == 'Main' && fullalbum.albumArtist) ? [fullalbum.albumArtist] : [],
			imageUrl: fullalbum.thumb || null,
			imageUrlSmall: fullalbum.thumb || null,
			artistNames: (fullalbum.release?.role == 'Main' && fullalbum.albumArtist) ? [fullalbum.albumArtist.name] : [],
			releaseDate: fullalbum.year ? String(fullalbum.year) : null,
			trackCount: null,
			albumType: getAlbumType(fullalbum.formats),
			upc: findSearchResultBarcode(fullalbum.barcode),
			albumTracks: [],
			labels: getReleaseLabels(fullalbum),
			copyrights: null,
			genres: fullalbum.genre || null
		}
	}
}

	// id: number;
	// type: string;
	// user_data: UserData;
	// master_id?: number;
	// master_url?: string;
	// uri: string;
	// title: string;
	// thumb: string;
	// cover_image: string;
	// resource_url: string;
	// country?: string;
	// year?: string;
	// format?: string[];
	// label?: string[];
	// genre?: string[];
	// style?: string[];
	// barcode?: string[];
	// catno?: string;
	// community?: Community;
	// format_quantity?: number;
	// formats?: Format[];

async function getAlbumById(albumId: string): Promise<GetReleaseResponse | null> {
	try {
		const data = await discogsDB.getRelease(albumId);
		return data.data;
	} catch (error) {
		err.handleError("Error fetching album by ID:", error);
		return null;
	}
}

function getTrackById(trackId: string): Promise<null> {
	return Promise.resolve(null);
}

async function getAlbumByUPC(upc: string): Promise<AlbumObject[] | null> {
	try {
		const data = await discogsDB.search({ type: "release", barcode: upc });
		if (data.data && data.data.results) {
			const albums: AlbumObject[] = [];
			for (const result of data.data.results) {
				if (result.type === "release") {
					const fullAlbumData = await getAlbumById(String(result.id));
					if (fullAlbumData) {
						albums.push(formatAlbumObject(fullAlbumData));
					}
				}
			}
			return albums;
		}
	} catch (error) {
		err.handleError("Error fetching album by UPC:", error);
		return null;
	}
	return null;
}

const capabilities: Capabilities = {
  isrcs: {
	availability: "never",
	presence: "never"
  },
  upcs: {
	availability: "sometimes",
	presence: "onAlbumRefresh"
  }
}

const discogs: FullProvider = {
	namespace,
	config: {capabilities},
	// getTrackByISRC: withCache(getTrackByISRC, { ttl: 60 * 30, namespace: namespace }),
	getAlbumByUPC: withCache(getAlbumByUPC, { ttl: 60 * 30, namespace: namespace }),
	searchByArtistName: withCache(searchByArtistName, { ttl: 60 * 30, namespace: namespace }),
	getAlbumById: withCache(getAlbumById, { ttl: 60 * 30, namespace: namespace }),
	getTrackById: withCache(getTrackById, { ttl: 60 * 30, namespace: namespace }),
	getArtistById: withCache(getArtistById, { ttl: 60 * 30, namespace: namespace }),
	getArtistAlbums: withCache(getArtistAlbums, { ttl: 60 * 60, namespace: namespace }), //Fetching artist albums is more expensive, so cache for longer
	formatArtistSearchData,
	formatArtistLookupData,
	formatArtistObject,
	formatPartialArtistObject,
	formatAlbumGetData,
	formatAlbumObject,
	formatTrackObject,
	parseUrl,
	createUrl
};

export default discogs;