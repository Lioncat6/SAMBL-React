import { ArtistObject, AlbumObject, TrackObject, AlbumData, PartialArtistObject, FullProvider, RawAlbumData, Capabilities, PartialProvider, ProviderNamespace, UrlType, RegexArtistUrlQuery, LabelObject } from "../../types/provider-types";
import logger from "../../utils/logger";
import withCache from "../../utils/cache";
import parsers from "../parsers/parsers";
import ErrorHandler from "../../utils/errorHandler";
import text from "../../utils/text";

const namespace: ProviderNamespace = "qobuz"
const err = new ErrorHandler(namespace);
const { createUrl, parseUrl } = parsers.getParser(namespace);

export interface QobuzSearchResponse {
  query: string
  albums?: QobuzPagingResult<QobuzPartialAlbum>
  tracks?: QobuzPagingResult<QobuzPartialTrack>
  artists?: QobuzPagingResult<QobuzPartialArtist>
  playlists?: QobuzPagingResult<QobuzPlaylist>
  stories?: QobuzPagingResult<any>
}

export interface QobuzPagingResult<T> {
  limit: number
  offset: number
  total: number
  items: T[]
}

export interface QobuzPartialAlbum {
  maximum_bit_depth: number
  image: QobuzImage
  media_count: number
  artist: QobuzPartialArtist
  artists?: QobuzArtistRole[]
  upc: string
  released_at: number
  label: QobuzLabel
  title: string
  qobuz_id: number
  version: any
  url: string
  slug: string
  duration: number
  parental_warning: boolean
  popularity: number
  tracks_count: number
  genre: QobuzGenre
  maximum_channel_count: number
  id: string
  maximum_sampling_rate: number
  articles: any[]
  release_date_original: string
  release_date_download: string
  release_date_stream: string
  purchasable: boolean
  streamable: boolean
  previewable: boolean
  sampleable: boolean
  downloadable: boolean
  displayable: boolean
  purchasable_at: number
  streamable_at: number
  hires: boolean
  hires_streamable: boolean
}

export interface QobuzAlbum extends QobuzPartialAlbum {
  awards: any[]
  goodies: any[]
  area: any
  catchline: string
  composer: QobuzComposer
  created_at: number
  genres_list: string[]
  period: any
  copyright: string
  is_official: boolean
  maximum_technical_specifications: string
  product_sales_factors_monthly: number
  product_sales_factors_weekly: number
  product_sales_factors_yearly: number
  product_type: string
  product_url: string
  recording_information: string
  relative_url: string
  release_tags: any[]
  release_type: string
  subtitle: string
  track_ids: number[]
  tracks?: QobuzPagingResult<QobuzPartialTrack>
  albums_same_artist: QobuzAlbumsSameArtist
  description: string
  description_language?: string
}

export interface QobuzPartialTrack {
  maximum_bit_depth: number
  copyright: string
  performers: string
  audio_info: AudioInfo
  performer: QobuzPerformer
  album?: QobuzPartialAlbum
  work: any
  isrc: string
  title: string
  version: any
  duration: number
  parental_warning: boolean
  track_number: number
  maximum_channel_count: number
  id: number
  media_number: number
  maximum_sampling_rate: number
  release_date_original: string
  release_date_download: string
  release_date_stream: string
  release_date_purchase: string
  purchasable: boolean
  streamable: boolean
  previewable: boolean
  sampleable: boolean
  downloadable: boolean
  displayable: boolean
  purchasable_at: number
  streamable_at: number
  hires: boolean
  hires_streamable: boolean
  maximum_technical_specifications?: string
  composer?: QobuzPartialComposer
}

export interface QobuzTrack extends QobuzPartialTrack {
  album: QobuzAlbum
  created_at: number
  indexed_at: number
  articles: any[]
  has_lyrics: boolean
}

export interface QobuzPartialArtist {
  picture: null; // Literally always null, like *always*
  image: QobuzImage | null;
  name: string
  slug: string
  albums_count: number
  id: number
}

export interface QobuzArtist extends QobuzPartialArtist {
  albums_as_primary_artist_count: number
  albums_as_primary_composer_count: number
  similar_artist_ids: number[]
  biography?: QobuzBiography;
  information: any
  tracks?: QobuzPagingResult<QobuzPartialTrack>
  tracks_appears_on?: QobuzPagingResult<QobuzPartialTrack>
  albums?: QobuzPagingResult<QobuzPartialAlbum>
  albums_without_last_release?: QobuzPagingResult<QobuzPartialAlbum>
}

export interface QobuzBiography {
  summary: string
  content: string
  source?: string
  language?: string
}

export interface QobuzArtistRole {
  id: number
  name: string
  roles: string[]
}

export interface QobuzPlaylist {
  id: number
  name: string
  description: string
  tracks_count: number
  users_count: number
  duration: number
  public_at: number
  created_at: number
  updated_at: number
  is_public: boolean
  is_collaborative: boolean
  owner: QobuzOwner
  indexed_at: number
  slug: string
  genres: any[]
  images: string[]
  is_published: boolean
  is_featured: boolean
  published_from: any
  published_to: any
  images150: string[]
  images300: string[]
}

export interface QobuzImage {
  small: string
  thumbnail: string
  large: string
  extralarge?: string
  mega?: string
  back?: string | null;
}

export interface QobuzLabel {
  name: string
  id: number
  albums_count: number
  supplier_id: number
  slug: string
}

export interface QobuzGenre {
  path: number[]
  color?: string
  name: string
  id: number
  slug: string
}

export interface AudioInfo {
  replaygain_track_peak: number
  replaygain_track_gain: number
}

export interface QobuzPerformer {
  name: string
  id: number
}

export interface QobuzPartialComposer {
  name: string
  id: number
}

export interface QobuzComposer extends QobuzPartialComposer {
  slug: string
  albums_count: number
  picture: any
  image: any
}

export interface QobuzOwner {
  id: number
  name: string
}

export interface QobuzAlbumsSameArtist {
  items: any[]
}

// /artist/page types https://gist.github.com/Lioncat6/7f0f438211204fbd165dea44645eb0e3


//Extended Types
export interface QobuzExtendedArtist extends QobuzPartialArtist, Partial<Omit<QobuzArtist, keyof QobuzPartialArtist>> { }
export interface QobuzExtendedArtistRole extends QobuzArtistRole, Partial<Omit<QobuzExtendedArtist, keyof QobuzArtistRole>> { }
export interface QobuzExtendedAlbum extends QobuzPartialAlbum, Partial<Omit<QobuzAlbum, keyof QobuzPartialAlbum>> { }
export interface QobuzExtendedTrack extends QobuzPartialTrack, Partial<Omit<QobuzTrack, keyof QobuzPartialTrack>> { }


const baseUrl = "https://www.qobuz.com/api.json/0.2"

async function qobuzFetch(query) {
  if (!process.env.QOBUZ_APP_ID || !process.env.QOBUZ_AUTH_TOKEN) {
    err.handleError("Missing required environment variable QOBUZ_APP_ID or QOBUZ_AUTH_TOKEN")
  }
  return await fetch(baseUrl + query, {
    headers: {
      "X-App-Id": process.env.QOBUZ_APP_ID || "",
      "X-User-Auth-Token": process.env.QOBUZ_AUTH_TOKEN || ""
    }
  })
}

async function searchByArtistName(query): Promise<QobuzSearchResponse | null> {
  try {
    const response = await qobuzFetch(`/catalog/search?query=${query}`)
    if (response.ok) {
      return await response.json() as QobuzSearchResponse
    } else if (response.status == 404) {
      return null
    } else {
      throw new Error(`${response.status} - ${response.statusText}`)
    }
  } catch (error) {
    err.handleError("Error searching by artist name", error)
  }
  return null;
}

function formatArtistSearchData(rawData: QobuzSearchResponse): QobuzPartialArtist[] {
  let albumArtistMap = Object.fromEntries((rawData.albums?.items || []).map((album) => [album.artist.id, album]));
  let trackArtistMap = Object.fromEntries((rawData.tracks?.items || []).map((track) => [(track.performer).id, track])); //track.performer
  let artists = rawData.artists?.items
  artists?.forEach((artist) => {
    artist.image = trackArtistMap[artist.id]?.album?.image || albumArtistMap[artist.id]?.image || null
  })
  return artists || []
}

function getMaxArtistImage(artist: QobuzExtendedArtist){
  const image = artist.image?.mega || artist.image?.extralarge || artist.image?.large || artist.image?.small || "";
  return image ? getMaxImage(image) : null;
}


function formatArtistObject(artist: QobuzPartialArtist | QobuzArtist): ArtistObject {
  let extendedArtist = artist as QobuzExtendedArtist;
  return {
    provider: namespace,
    type: "artist",
    name: artist.name,
    url: createUrl("artist", String(artist.id)),
    id: String(artist.id),
    bannerUrl: null,
    imageUrlSmall: artist.image?.small || "",
    imageUrl: getMaxArtistImage(extendedArtist),
    relevance: `${artist.albums_count} albums`,
    followers: null,
    info: extendedArtist.biography?.summary || "",
    genres: [],
    popularity: null
  }
}

async function getArtistAlbums(id: string, offset: string | number = 0, limit: number = 50): Promise<QobuzArtist | null> {
  try {
    const response = await qobuzFetch(`/artist/get?artist_id=${id}&extra=albums&offset=${offset}&limit=${limit}`);
    if (response.ok) {
      return await response.json() as QobuzArtist;
    } else if (response.status == 404) {
      return null
    } else {
      throw new Error(`${response.status} - ${response.statusText}`)
    }
  } catch (error) {
    err.handleError("Error searching by artist name", error)
  }
  return null;
}

function formatAlbumGetData(rawData: QobuzArtist): RawAlbumData {
  if (!rawData.albums) {
    return {
      albums: [],
      count: 0,
      next: null,
      current: null,
    }
  } else {
    const albums = rawData.albums;
    const next = albums.limit + albums.offset;
    return {
      albums: albums.items,
      count: albums.total,
      current: albums.offset,
      next: next < albums.total ? String(next) : null
    }
  }
}

async function getArtistById(id: string): Promise<QobuzArtist | null> {
  try {
    const response = await qobuzFetch(`/artist/get?artist_id=${id}&extra=albums,albums_with_last_release&limit=1`);
    if (response.ok) {
      return await response.json() as QobuzArtist;
    } else if (response.status == 404) {
      return null
    } else {
      throw new Error(`${response.status} - ${response.statusText}`)
    }
  } catch (error) {
    err.handleError("Error searching by artist name", error)
  }
  return null;
}

async function getAlbumById(id: string): Promise<QobuzAlbum | null> {
  try {
    const response = await qobuzFetch(`/album/get?album_id=${id}`);
    if (response.ok) {
      return await response.json() as QobuzAlbum;
    } else if (response.status == 404) {
      return null
    } else {
      throw new Error(`${response.status} - ${response.statusText}`)
    }
  } catch (error) {
    err.handleError("Error searching by artist name", error)
  }
  return null;
}

async function getAlbumByUPC(upc: string): Promise<AlbumObject[] | null> {
  try {
    const response = await qobuzFetch(`/album/search?query=${text.padBarcode(upc)}`);
    if (response.ok) {
      const data = await response.json() as QobuzSearchResponse;
      return data.albums?.items.filter((album) => text.removeLeadingZeros(album.upc) == text.removeLeadingZeros(upc)).map(formatAlbumObject) || [];
    } else if (response.status == 404) {
      return null
    } else {
      throw new Error(`${response.status} - ${response.statusText}`)
    }
  } catch (error) {
    err.handleError("Error searching by artist name", error)
  }
  return null;
}

async function getTrackByISRC(isrc: string): Promise<TrackObject[] | null> {
  try {
    const response = await qobuzFetch(`/track/search?query=${isrc}`);
    if (response.ok) {
      const data = await response.json() as QobuzSearchResponse;
      return data.tracks?.items.filter((track) => track.isrc.toLowerCase() == isrc.toLowerCase()).map(formatTrackObject) || [];
    } else if (response.status == 404) {
      return null
    } else {
      throw new Error(`${response.status} - ${response.statusText}`)
    }
  } catch (error) {
    err.handleError("Error searching by artist name", error)
  }
  return null;
}

async function getTrackById(id: string): Promise<QobuzTrack | null> {
  try {
    const response = await qobuzFetch(`/track/get?track_id=${id}`);
    if (response.ok) {
      return await response.json() as QobuzTrack;
    } else if (response.status == 404) {
      return null
    } else {
      throw new Error(`${response.status} - ${response.statusText}`)
    }
  } catch (error) {
    err.handleError("Error searching by artist name", error)
  }
  return null;
}

function formatArtistLookupData(artist: QobuzArtist): QobuzArtist {
  const albums = artist.albums_without_last_release?.items || artist.albums?.items
  if (!artist.image && albums && albums.length > 0) {
    artist.image = albums[albums.length-1].image
  }
  return artist;
}

function buildUrlSearchQuery(type: UrlType, urls: string[]): RegexArtistUrlQuery {
  const qobuzTypes: Record<UrlType, string> = {
    "artist": "(artist|interpreter|label)",
    "album": "album",
    "track": "track",
    "label": "label"
  }
  
  const idUrlMap: { [key: string]: string } = {}
	urls.forEach((url) => {
		const parsedUrl = parseUrl(url);
		if (parsedUrl?.id && parsedUrl.type === type) {
			idUrlMap[parsedUrl.id] = url;
		}
	})
  const ids = Object.keys(idUrlMap);
  const rawRegex = String.raw`https:\/\/(play|www|open)?\.?qobuz\.com\/(\w{2}-\w{2}\/)?${qobuzTypes[type]}\/([^\/]+\/)?([^\/]+\/)?(${ids.join("|")})`
  const regex: RegExp | null = new RegExp(rawRegex);
  let idQueryMap: { [key: string]: RegExp["source"] } = {};
  let urlQueryMap: { [key: string]: RegExp["source"] } = {};
  ids.forEach((id) => {
    const rawRegex = String.raw`https:\/\/(play|www|open)?\.?qobuz\.com\/(\w{2}-\w{2}\/)?${qobuzTypes[type]}\/([^\/]+\/)?([^\/]+\/)?${id}`
    const regex: RegExp | null = RegExp(rawRegex);
    idQueryMap[id] = regex.source
    urlQueryMap[idUrlMap[id]] = regex.source
  })
  const query: RegexArtistUrlQuery = {
    fullQuery: regex.source,
    idQueries: idQueryMap,
    urlQueries: urlQueryMap
  }
  return query;
}

function formatPartialArtistObject(role: QobuzArtistRole | QobuzPartialArtist | QobuzArtist): PartialArtistObject {
  const artist = role as QobuzExtendedArtistRole;
  return {
    provider: namespace,
    id: String(artist.id),
    name: artist.name,
    url: createUrl("artist", String(artist.id)),
    type: "partialArtist",
    imageUrl: artist.image?.small ? getMaxImage(artist.image?.small) : null,
    imageUrlSmall: artist.image?.small || null
  }
}

function getAlbumArtists(album: QobuzExtendedAlbum) {
  let artists: PartialArtistObject[] = [];
  let artistIds: number[] = [];
  artists.push(formatArtistObject(album.artist));
  artistIds.push(album.artist.id);
  album.artists?.forEach((artist) => {
    if (!artistIds.includes(artist.id)){
      artists.push({
        provider: namespace,
        id: String(artist.id),
        name: artist.name,
        url: createUrl("artist", String(artist.id)),
        type: "partialArtist",
        imageUrl: null,
        imageUrlSmall: null
      })
      artistIds.push(artist.id);
    }
  })
  return artists;
}

function getAlbumGenres(album: QobuzExtendedAlbum) {
  let genres: string[] = [];
  genres.push(album.genre.name);
  album.genres_list?.forEach((genre) => {
    const splitGenres = genre.split("→");
    genres.concat(splitGenres);
  })
  return [...new Set(genres)];
}

function getAlbumTracks(album: QobuzExtendedAlbum) {
  album.tracks?.items.forEach(track => {
    track.album = album
  });
  return (album.tracks?.items.map(formatTrackObject) || [])
}

function getMaxImage(url: string): string {
  return url.replace(/_\d+/, "_org");
}

function formatAlbumObject(rawAlbum: QobuzAlbum | QobuzPartialAlbum): AlbumObject {
  const album = rawAlbum as QobuzExtendedAlbum;
  return {
    provider: namespace,
    type: "album",
    id: album.id,
    name: album.title,
    url: createUrl("album", album.id),
    albumArtists: getAlbumArtists(rawAlbum),
    artistNames: getAlbumArtists(rawAlbum).map((artist) => artist.name),
    releaseDate: album.release_date_stream,
    trackCount: album.tracks_count,
    albumType: album.release_type || (album.tracks_count > 1 ? "album" : "single"),
    upc: album.upc,
    labels: createLabels(album.label),
    copyrights: album.copyright ? [album.copyright] : null,
    genres: getAlbumGenres(rawAlbum),
    imageUrl: getMaxImage(album.image?.small),
    imageUrlSmall: album.image.small,
    albumTracks: getAlbumTracks(album)
  }
}

function createLabels(label: QobuzLabel): LabelObject[] | null {
	if (!label) return null
	return [{
		provider: namespace,
		name: label.name,
		url: createUrl('label', String(label.id)),
		id: String(label.id),
		type: 'label'
	}]
}

function formatTrackObject(rawTrack: QobuzTrack | QobuzPartialTrack): TrackObject {
  const track = rawTrack as QobuzExtendedTrack;
  const album = track.album
  return {
    provider: namespace,
    type: "track",
    id: String(track.id),
    name: `${track.title}${track.version ? ` (${track.version})` : ""}`,
    url: createUrl("track", String(track.id)),
    trackArtists: track.album ? getAlbumArtists(track.album) : [],
    artistNames: track.album ? getAlbumArtists(track.album).map((artist) => artist.name) : [],
    albumName: track.album?.title || null,
    releaseDate: track.release_date_stream,
    trackNumber: track.track_number,
    isrcs: [track.isrc],
    duration: track.duration * 1000,
    imageUrl: album ? getMaxImage(album.image?.small) : null,
    imageUrlSmall: album ? album.image.small : null,
  }
}
const capabilities: Capabilities = {
	isrcs: {
		availability: "always",
		presence: "onAlbumRefresh"
	},
	upcs: {
		availability: "always",
		presence: "always"
	}
}

const qobuz: FullProvider = {
  namespace,
  config: { capabilities},
  parseUrl,
  createUrl,
  searchByArtistName: withCache(searchByArtistName, { ttl: 60 * 30, namespace: namespace }),
  getArtistAlbums: withCache(getArtistAlbums, { ttl: 60 * 30, namespace: namespace }),
  getArtistById: withCache(getArtistById, { ttl: 60 * 30, namespace: namespace }),
  getAlbumById: withCache(getAlbumById, { ttl: 60 * 30, namespace: namespace }),
  getTrackById: withCache(getTrackById, { ttl: 60 * 30, namespace: namespace }),
  getTrackByISRC: withCache(getTrackByISRC, { ttl: 60 * 30, namespace: namespace }),
  getAlbumByUPC: withCache(getAlbumByUPC, { ttl: 60 * 30, namespace: namespace }),
  formatPartialArtistObject,
  formatTrackObject,
  formatAlbumObject,
  formatArtistLookupData,
  formatAlbumGetData,
  formatArtistSearchData,
  formatArtistObject,
  buildUrlSearchQuery
}

export default qobuz;