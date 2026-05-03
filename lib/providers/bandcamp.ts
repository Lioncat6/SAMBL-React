import type { ArtistObject, AlbumObject, TrackObject, FullProvider, PartialArtistObject, RawAlbumData, Capabilities, ExternalUrlData, ExtendedTrackObject, LabelObject } from "../../types/provider-types";
import withCache from "../../utils/cache";
import ErrorHandler from "../../utils/errorHandler";
import text from "../../utils/text";
import bcApi from "bandcamp-scraper";
import parsers from "../parsers/parsers";

const namespace = "bandcamp";

const {createUrl, parseUrl} = parsers.getParser(namespace);

const err = new ErrorHandler(namespace);

class bandcampId {
	artist: string
	type: "album" | "track"
	id: string
}

function parseId(id: string | null): bandcampId {
	if (id && parseUrl(id)){
		id = parseUrl(id)?.id || null
	}
	if (!id) {
		throw new Error("Invalid entity id!")
	}
	const idArray = id.split("/");
	if (idArray.length != 3){
		throw new Error("Invalid entity id!")
	}
	const bcId = {
		artist: idArray[0],
		type: idArray[1] as "album" | "track",
		id: idArray[2].split("#")[0]
	}
	return bcId;
}

function createId(bcId: bandcampId){
	return `${bcId.artist}/${bcId.type}/${bcId.id}`
}

function searchAsync(params) {
	return new Promise((resolve, reject) => {
		try {
			bcApi.search(params, (error, searchResults) => {
				if (error) reject(error);
				else resolve(searchResults);
			});
		} catch (err) {
			reject(err);
		}
	});
}

function getArtistByIdAsync(id: string) {
	return new Promise((resolve, reject) => {
		try {
			bcApi.getArtistInfo(createUrl('artist', id), (error, artistData) => {
				if (error) reject(error);
				else resolve(artistData);
			});
		} catch (err) {
			reject(err);
		}
	});
}

async function getAlbumUrlsAsync(artistUrl: string) {
	return new Promise((resolve, reject) => {
		try {
			bcApi.getAlbumUrls(artistUrl, (error, albumData) => {
				if (error) reject(error);
				else resolve(albumData);
			});
		} catch (err) {
			reject(err);
		}
	});
}

async function getAlbumInfoAsync(albumUrl: string) {
	return new Promise((resolve, reject) => {
		try {
			bcApi.getAlbumInfo(albumUrl, (error, albumData) => {
				if (error) reject(error);
				else resolve(albumData);
			});
		} catch (err) {
			reject(err);
		}
	});
}

async function getTrackInfoAsync(trackUrl: string) {
	return new Promise((resolve, reject) => {
		try {
			bcApi.getTrackInfo(trackUrl, (error, trackData) => {
				if (error) reject(error);
				else resolve(trackData);
			});
		} catch (err) {
			reject(err);
		}
	});
}

async function init() {
	try {
		await searchAsync({ query: "test", page: 1 });
	} catch (error) {
		err.handleError("Error initializing Bandcamp API:", error);
	}
}

async function getAlbumById(id: string) {
	const bcId = parseId(id)
	id = createId(bcId)
	try {
		let albumData: any = null;
		if (bcId.type = "album") {
			albumData = await getAlbumInfoAsync(createUrl('album', id).url);
		} else {
			albumData = await getTrackInfoAsync(createUrl('track', id).url);
		}
		return albumData;
	} catch (error) {
		err.handleError("Error fetching album by ID:", error);
	}
}

function getAlbumUPCs(album) {
	if (album && album.raw) {
		return album.raw.current.upc || -1;
	}
	return null;
}

async function getTrackById(id: string) {
	const bcId = parseId(id)
	id = createId(bcId)
	try {
		let trackData = await getTrackInfoAsync(createUrl('track', id).url);
		return trackData;
	} catch (error) {
		err.handleError("Error fetching track by ID:", error);
	}
}

function getTrackISRCs(track): string[] | null {
	if (track && track.raw) {
		return track.raw.current.isrc ? [track.raw.current.isrc] : [];
	}
	return null;
}

async function searchByArtistName(artistName) {
	try {
		const data = await searchAsync({ query: artistName, page: 1 });
		if (data) {
			return data;
		}
		return null;
	} catch (error) {
		err.handleError("Error searching for artist:", error);
	}
}

function formatArtistSearchData(rawData) {
	const data = rawData?.filter((a) => a.type == "artist");
	return data;
}

async function getArtistById(artistId: string) {
	try {
		const data = await bandcamp.searchByArtistName(artistId);
		if (data) {
			let idData = await getArtistByIdAsync(artistId);
			const url = (idData as any)?.raw?.url || createUrl("artist", artistId).url;
			let artistData = data.find((a) => text.trimUrl(a.url) == text.trimUrl(url)) || null;
			if (!artistData) return null
			artistData.raw = (idData as any).raw;
			artistData.bannerImage = (idData as any).bannerImage;
			return artistData;
		}
		return null;
	} catch (error) {
		err.handleError("Error fetching artist by ID:", error);
	}
}

function formatArtistLookupData(rawData) {
	return rawData;
}

function getTags(rawData){
	let tags: (string | null | undefined)[] = [];
	rawData.tags?.forEach(tag => {
		if (tag.name){
			tags.push(tag.name);
		} else {
			tags.push(tag);
		}
	});
	return tags.filter(tag => tag!= null && tag!=undefined);
}

function formatArtistObject(rawData): ArtistObject {
	const id = parseUrl(rawData.url)?.id || rawData.raw?.subdomain || ":";
	return {
		name: rawData.name,
		url: createUrl("artist", id),
		imageUrl: rawData.imageUrl?.replace(/_\d+\.jpg$/, "_0.jpg"),
		imageUrlSmall: rawData.imageUrl?.replace(/_\d+\.jpg$/, "_3.jpg"),
		bannerUrl: rawData.raw?.design?.bg_image_id
			? `https://f4.bcbits.com/img/${rawData.raw.design.bg_image_id}_0.jpg`
			: rawData.raw?.header_desktop
				? `https://f4.bcbits.com/img/${rawData.raw.header_desktop.image_id}_0.jpg`
				: rawData.bannerImage ? rawData.bannerImage : "",
		relevance: rawData.location,
		info: rawData.tags.join(", "),
		genres: getTags(rawData),
		followers: null,
		popularity: null,
		id: getArtistId(rawData) || "",
		provider: namespace,
		type: "artist"
	};
}

async function getArtistAlbums(
	artistId: string,
	offset: number = 1,
	limit: number
) {
	const rawArtist = await bandcamp.getArtistById(artistId);
	const artist = bandcamp.formatArtistObject(rawArtist);
	try {
		let searchResults: any = await searchAsync({
			query: artistId,
			page: Number(offset),
		});
		let albumItems = searchResults.filter(
			(a) =>
				(a.type == "album" || (a.type == "track" && a.artist == "")) &&
				a.url.includes(artist.url.url)
		); // Yes, this filters out tracks that have an album because of a coding error in the bandcamp library :3
		return {
			current: offset,
			next: searchResults.length === 0 ? null : Number(offset) + 1,
			albums: albumItems,
		};
	} catch (error) {
		err.handleError("Error fetching artist albums:", error);
	}
}

function formatAlbumGetData(rawData): RawAlbumData {
	return {
		count: null,
		current: rawData.current,
		next: rawData.next,
		albums: rawData.albums,
	};
}

function getLabels(album): LabelObject[] | null {
	if (!album.pageData?.albumRelease?.[0]?.recordLabel?.name) return null
	return [{
		provider: namespace,
		name: album.pageData?.albumRelease?.[0]?.recordLabel?.name,
		url: null,
		id: null,	
		type: 'label'
	}]
}

function formatAlbumObject(album): AlbumObject {
	const bcId: bandcampId = parseId(parseUrl(album.url)?.id || null)
	let albumType = "album";
	const isTrack = album.type == "track" || album.raw?.current?.type == "track";
	if (!album.artist) {
		album.artist = bcId.artist;
	}
	if (isTrack){
		albumType = "single";
	}
	let imageUrl =
		album.imageUrl?.replace(/_\d+\.jpg$/, "_0.jpg") ||
		`https://f4.bcbits.com/img/a${album.raw.art_id}_0.jpg`;
	let imageUrlSmall =
		album.imageUrl?.replace(/_\d+\.jpg$/, "_3.jpg") ||
		`https://f4.bcbits.com/img/a${album.raw.art_id}_3.jpg`;
	return {
		provider: namespace,
		id: createId(bcId),
		name: album.name || album.title,
		url: createUrl("album", createId(bcId)),
		imageUrl: imageUrl,
		imageUrlSmall: imageUrlSmall,
		albumArtists: [
			{
				url: createUrl('artist', bcId.artist) || "",
				name: album.artist,
				imageUrl: null,
				imageUrlSmall: null,
				id: bcId.artist,
				provider: namespace,
				type: "partialArtist"
			},
		],
		artistNames: [album.artist],
		releaseDate: text.formatDate(
			album.releaseDate || album.raw?.current?.release_date
		),
		trackCount: album.numTracks ? album.numTracks:  album.tracks?.length ? album.tracks?.length : isTrack ? 1: null,
		albumType: albumType,
		upc: album.raw?.current?.upc || null,
		albumTracks: getAlbumTracks(album) || [],
		labels: getLabels(album),
		copyrights: null,
		genres: getTags(album),
		type: "album"
	};
}

function getAlbumTracks(album): TrackObject[] {
	let tracks: TrackObject[] = [];
	if (album && album.tracks?.length > 0 && album.raw?.current?.type != "track") {
		album.tracks = album.tracks.filter((track) => track.url && track.duration);
		for (let trackNumber in album.tracks) {
			let trackinfo = album.raw.trackinfo[trackNumber];
			let currentTrack = album.tracks[trackNumber];
			const url = trackinfo.url || currentTrack.url
			const urlInfo = parseUrl(url)
			trackinfo.url = (urlInfo?.type && urlInfo.id) ? createUrl(urlInfo?.type, urlInfo.id).url: null;
			trackinfo.id = urlInfo?.id
			if (!trackinfo.artist) {
				trackinfo.artist = album.artist;
			}
			trackinfo.albumName = album.name || album.title;
			trackinfo.releaseDate = text.formatDate(
				album.releaseDate || album.raw?.current?.release_date
			);
			trackinfo.imageUrl =
				album.imageUrl?.replace(/_\d+\.jpg$/, "_0.jpg") ||
				(album.raw.art_id
					? `https://f4.bcbits.com/img/a${album.raw.art_id}_0.jpg`
					: null);
			trackinfo.imageUrlSmall =
				album.imageUrl?.replace(/_\d+\.jpg$/, "_3.jpg") ||
				(album.raw.art_id
					? `https://f4.bcbits.com/img/a${album.raw.art_id}_3.jpg`
					: null);
			tracks.push(formatTrackObject(trackinfo));
		}
	} else if (album && album.raw?.current?.type == "track") {
		let trackinfo = album.raw.trackinfo[0];
		trackinfo.url = album.url;
		trackinfo.id = parseUrl(trackinfo.url)?.id
		trackinfo.albumName = album.name || album.title;
		trackinfo.releaseDate = text.formatDate(
			album.releaseDate || album.raw?.current?.release_date
		);
		trackinfo.imageUrl =
			album.imageUrl?.replace(/_\d+\.jpg$/, "_0.jpg") ||
			(album.raw.art_id
				? `https://f4.bcbits.com/img/a${album.raw.art_id}_0.jpg`
				: null);
		trackinfo.imageUrlSmall =
			album.imageUrl?.replace(/_\d+\.jpg$/, "_3.jpg") ||
			(album.raw.art_id
				? `https://f4.bcbits.com/img/a${album.raw.art_id}_3.jpg`
				: null);
		trackinfo.isrc = album.raw.current.isrc;
		tracks.push(formatTrackObject(trackinfo));
	}
	tracks.sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));
	return tracks;
}

function createImageUrl(artId, size = 0){
	return artId ? `https://f4.bcbits.com/img/a${artId}_${size}.png`: null
}

function formatTrackObject(track): ExtendedTrackObject {
	const artistId = track.url.match(/^https?:\/\/([^.]+)\.bandcamp\.com/)[1];
	const id = parseUrl(track.url)?.id;
	const rawTrack = track.raw;
	const artistName = track.artist || rawTrack?.artist || null;
	track.artistName = artistName;
	const trackInfo = rawTrack?.trackinfo?.[0]
	return {
		provider: namespace,
		id: id || null,
		name: track.title,
		url: createUrl("track", id || ""),
		imageUrl: track.imageUrl || createImageUrl(rawTrack?.art_id) || null,
		imageUrlSmall: track.imageUrlSmall || createImageUrl(rawTrack?.art_id, 3)|| null,
		trackArtists: [formatPartialArtistObject(track)],
		artistNames: artistName ? [artistName]: [],
		albumName: track.albumName || null,
		releaseDate: track.releaseDate || rawTrack?.album_release_date ? text.formatDate(rawTrack?.album_release_date) : rawTrack?.current.publish_date ? text.formatDate(rawTrack.current.publish_date): null,
		trackNumber: track.track_num || rawTrack?.current.track_number || null,
		duration: track.duration*1000  || trackInfo?.duration*1000 || null,
		isrcs: track.isrc ? [track.isrc] : rawTrack?.current.isrc ? [rawTrack.current.isrc] : [],
		type: "track",
		extraInfo: {
			trackId: track.trackId || null,
			albumId: rawTrack?.current?.album_id || null,
			bandId: rawTrack?.current?.band_id || null,
			encodingsId: rawTrack?.current.encodings_id || null,
			sellingBandId: rawTrack?.current?.selling_band_id || null,
			minimumPrice: rawTrack?.current.minimum_price || null,
			lyrics: rawTrack?.current.lyrics || null,
			isPaid: !(trackInfo?.has_free_download || trackInfo?.free_album_download) && rawTrack?.current.minimum_price > 0
 		}
	};
}


function formatPartialArtistObject(track): PartialArtistObject {
	const artistInfo = parseId(parseUrl(track.url)?.id || null)
	return {
		url: artistInfo?.artist ? createUrl('artist', artistInfo.artist) : createUrl('artist', ""),
		name: track.artist || track.artistName || artistInfo?.artist,
		imageUrl: null,
		imageUrlSmall: null,
		id: artistInfo?.artist || "",
		provider: namespace,
		type: "partialArtist"
	};
}

function getArtistId(artist) {
	return parseUrl(artist.url)?.id
}

function getArtistUrl(artist) {
	return artist.url;
}

init();

const capabilities: Capabilities = {
  isrcs: {
	availability: "sometimes",
	presence: "onTrackRefresh"
  },
  upcs: {
	availability: "sometimes",
	presence: "onAlbumRefresh"
  }
}

const bandcamp: FullProvider = {
	namespace,
	config: {capabilities},
	searchByArtistName: withCache(searchByArtistName, { ttl: 60 * 30, namespace: namespace }),
	getArtistAlbums: withCache(getArtistAlbums, { ttl: 60 * 30, namespace: namespace }),
	getAlbumById: withCache(getAlbumById, { ttl: 60 * 30, namespace: namespace }),
	getTrackById: withCache(getTrackById, { ttl: 60 * 30, namespace: namespace }),
	createUrl,
	formatArtistSearchData,
	formatArtistObject,
	formatPartialArtistObject,
	formatTrackObject,
	formatArtistLookupData,
	formatAlbumObject,
	formatAlbumGetData,
	getArtistById,
	parseUrl
};

export default bandcamp;
