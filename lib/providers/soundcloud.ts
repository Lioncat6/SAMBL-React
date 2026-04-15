import type {
  ArtistObject,
  AlbumObject,
  TrackObject,
  PartialArtistObject,
  FullProvider,
  RawAlbumData,
  Capabilities,
  LabelObject
} from '../../types/provider-types'
import withCache from '../../utils/cache'
import ErrorHandler from '../../utils/errorHandler'
import Soundcloud, {
  SoundcloudUser,
  SoundcloudUserSearch,
  SoundcloudTrack,
  SoundcloudPlaylist
} from 'soundcloud.ts'
import parsers from '../parsers/parsers'

const namespace = 'soundcloud'

const err = new ErrorHandler(namespace)

const {parseUrl, createUrl} = parsers.getParser(namespace);

const soundcloudClientId: string = process.env.SOUNDCLOUD_CLIENT_ID ?? ''
const soundcloudOauthToken: string = process.env.SOUNDCLOUD_OAUTH_TOKEN ?? ''

if (!soundcloudClientId || !soundcloudOauthToken) {
  throw new Error(
    'TIDAL_CLIENT_ID and SOUNDCLOUD_OAUTH_TOKEN must be set in environment variables.'
  )
}

const scApi = new Soundcloud(soundcloudClientId, soundcloudOauthToken)

function correctId(rawId: string | number): string {
  let prefix = ""
  let id = rawId.toString()
  if (id.startsWith('soundcloud:')) {
    const segments = id.split(':')
    id = segments[2]
    prefix = 'soundcloud:' + segments[1] + ":"
  }
  if (id.length < 9) {
    id = id.padStart(9, '0')
  }
  return prefix + id;
}

function getReleaseDate (entity) {
  if (entity.release_day)
    return `${entity.release_year}-${entity.release_month}-${entity.release_day}`
  return entity.created_at?.split('T')[0]
}

async function searchByArtistName (artistName: string) {
  try {
    // Fetch artist data
    const data = await scApi.users.search({ q: artistName })
    return data
  } catch (error) {
    err.handleError('Error searching for artist:', error)
  }
}

async function getArtistById(id: string) {
  try {
    const data = scApi.users.get(correctId(id))
    return data
  } catch (error) {
    err.handleError('Error fetching artist:', error)
  }
}

function formatArtistLookupData (rawData: SoundcloudUser) {
  return rawData
}

function formatArtistSearchData (rawData: SoundcloudUserSearch) {
  return rawData.collection
}

function formatArtistObject (rawObject: SoundcloudUser): ArtistObject {
  const countries = new Intl.DisplayNames(['en'], { type: 'region' })
  return {
    name: rawObject.username,
    url: createUrl("artist", `https://soundcloud.com/${rawObject.permalink}`),
    imageUrl: rawObject.avatar_url?.includes('default_avatar')
      ? rawObject.avatar_url
      : rawObject.avatar_url?.replace('large', 't500x500') || '',
    imageUrlSmall: rawObject.avatar_url || '',
    bannerUrl: rawObject.visuals?.visuals[0]?.visual_url,
    relevance: `${rawObject.followers_count} Followers`,
    info: `${
      rawObject.city
        ? rawObject.city + (rawObject.country_code ? ', ' : '')
        : ''
    }${
      rawObject.country_code
        ? countries.of(rawObject.country_code.toString().toUpperCase())
        : ''
    }`,
    genres: null,
    followers: rawObject.followers_count,
    popularity: null,
    id: correctId(rawObject.id),
    provider: namespace,
    type: "artist"
  }
}

async function getArtistAlbums (artistId: string | number, offset: string | number, limit: number) {
  try {
    let artistPlaylists = await scApi.users.playlists(correctId(artistId))
    // let artistTracks = await scApi.users.tracks(correctId(artistId))
    return { artistTracks: [], artistPlaylists: artistPlaylists }
  } catch (error) {
    err.handleError('Failed to fetch artist albums', error)
  }
}

class albumGetData {
  artistTracks: SoundcloudTrack[]
  artistPlaylists: SoundcloudPlaylist[]
}

function formatAlbumGetData (rawData: albumGetData): RawAlbumData {
  let artistAlbums: any[] = []
  let playlists = rawData.artistPlaylists
  let tracks = rawData.artistTracks
  const length = playlists?.length + tracks?.length
  let trackIds: number[] = []
  for (let playlist of playlists) {
    for (let track of playlist.tracks) {
      trackIds.push(track.id)
    }
    artistAlbums.push(playlist)
  }
  for (let track of tracks) {
    if (!trackIds.includes(track.id)) {
      artistAlbums.push(track)
    }
  }
  return {
    count: length,
    current: length,
    next: null,
    albums: artistAlbums
  }
}

function getUPCFromAlbum (album: SoundcloudPlaylist | SoundcloudTrack): string | null {
  let upc: string | null = null
  if ('tracks' in album && album.tracks) {
    for (let track of album.tracks) {
      if (track.publisher_metadata?.upc_or_ean) {
        if (!upc) {
          upc = track.publisher_metadata.upc_or_ean
        } else if (upc !== track.publisher_metadata.upc_or_ean) {
          return null
        }
      }
    }
  } else if ('publisher_metadata' in album && album.publisher_metadata?.upc_or_ean) {
    upc = album.publisher_metadata.upc_or_ean
  }
  return upc
}

function getGenresFromAlbum(album: SoundcloudPlaylist | SoundcloudTrack): string[] {
  let genres: string[] = [];
  if (album.genre) genres.push(album.genre);
  if ('tracks' in album){
    album.tracks?.forEach(track => {
        if (track.genre) genres.push(track.genre);
    });
  }
  
  return [ ...new Set(genres)];
}

function getLabelsFromAlbum(album: SoundcloudPlaylist | SoundcloudTrack): LabelObject[]{
  let labels: LabelObject[] = [];
  if ('tracks' in album){
    album.tracks?.forEach(track => {
      if (track.publisher_metadata?.publisher){
        labels.push({
          provider: namespace,
          name: track.publisher_metadata.publisher,
          url: null,
          id: null,
          type: 'label'
        });
      }
    });
  }
  return labels;
}

function getCopyrightsFromAlbum(album: SoundcloudPlaylist | SoundcloudTrack){
  let copyrights: string[] = [];
  if ('tracks' in album){
    album.tracks?.forEach(track => {
      if (track.publisher_metadata?.p_line_for_display) copyrights.push(track.publisher_metadata.p_line_for_display);
      if (track.publisher_metadata?.c_line_for_display) copyrights.push(track.publisher_metadata.c_line_for_display);
    });
  }
  return copyrights;
}

function formatAlbumObject (rawAlbum: SoundcloudPlaylist | SoundcloudTrack): AlbumObject {
  return {
    provider: namespace,
    id: rawAlbum.urn || `soundcloud:${rawAlbum.kind}:${rawAlbum.id}`,
    name: rawAlbum.title,
    url: createUrl("album", rawAlbum.permalink_url?.split('?')[0]),
    imageUrl: rawAlbum.artwork_url?.replace('large', 't500x500') || '',
    imageUrlSmall: rawAlbum.artwork_url || '',
    albumArtists: [formatPartialArtistObject(rawAlbum.user)],
    artistNames: [rawAlbum.user.username],
    releaseDate: getReleaseDate(rawAlbum),
    trackCount: 'track_count' in rawAlbum && rawAlbum.track_count || 1,
    albumType: 'set_type' in rawAlbum && rawAlbum.set_type || 'single',
    upc: getUPCFromAlbum(rawAlbum),
    albumTracks: getAlbumTracks(rawAlbum),
    genres: getGenresFromAlbum(rawAlbum),
    copyrights: getCopyrightsFromAlbum(rawAlbum),
    labels: getLabelsFromAlbum(rawAlbum),
    type: "album"
  }
}

interface SoundcloudTrackWithAlbumInfo extends SoundcloudTrack {
  albumName?: string;
  track_number?: number;
}

function getAlbumTracks (album) {
  let tracks = album.tracks
  if (tracks) {
    for (let trackNumber = 0; trackNumber < tracks.length; trackNumber++) {
      tracks[trackNumber].albumName = album.title
      tracks[trackNumber].track_number = trackNumber + 1
    }
    tracks = tracks.map(formatTrackObject)
    return tracks
  } else if (album.title) {
    album.albumName = album.title
    album.track_number = 1
    tracks = [formatTrackObject(album)]
    return tracks
  }
  return []
}

function getTrackISRCs (track) {
  if (!track) return null
  const isrcs = track.publisher_metadata?.isrc
    ? [track.publisher_metadata?.isrc]
    : []
  return isrcs
}

function getAlbumUPCs (album) {
  if (!album) return null
  const upc = getUPCFromAlbum(album)
  return upc ? [upc] : []
}

function formatTrackObject (track: SoundcloudTrackWithAlbumInfo): TrackObject {
  return {
    provider: namespace,
    id: track.urn || `soundcloud:track:${track.id}`,
    name: track.title,
    url: createUrl("track", track.permalink_url?.split('?')[0]),
    imageUrl: track.artwork_url?.replace('large', 't500x500') || '',
    imageUrlSmall: track.artwork_url || '',
    albumName: track.albumName || track.publisher_metadata.album_title || track.publisher_metadata.release_title || null,
    trackArtists: track.user ? [formatPartialArtistObject(track.user)] : [],
    artistNames: [track.user?.username],
    duration: track.duration,
    trackNumber: track.track_number || null,
    releaseDate: getReleaseDate(track),
    isrcs: track.publisher_metadata?.isrc
      ? [track.publisher_metadata?.isrc]
      : [],
    type: "track"
  }
}

function formatPartialArtistObject (
  artist: SoundcloudUser
): PartialArtistObject {
  return {
    name: artist.username,
    url: createUrl("artist", artist.permalink_url?.split('?')[0]),
    imageUrl: artist.avatar_url?.includes('default_avatar')
      ? artist.avatar_url
      : artist.avatar_url?.replace('large', 't500x500') || '',
    imageUrlSmall: artist.avatar_url || '',
    id: correctId(artist.id),
    provider: namespace,
    type: "partialArtist"
  }
}

async function getTrackById (id: string): Promise<SoundcloudTrack | null> {
  try {
    const track = await scApi.tracks.get(id)
    return track
  } catch (error) {
    err.handleError('Failed to get track by id', error)
    return null
  }
}

async function getAlbumById (
  id: string
): Promise<SoundcloudTrack | SoundcloudPlaylist | null> {
  try {
    let album: null | SoundcloudTrack | SoundcloudPlaylist = null
    if (id.includes('/set') || id.includes(':playlist:')) {
      album = await scApi.playlists.get(id)
    } else {
      album = await scApi.tracks.get(id)
    }
    return album
  } catch (error) {
    err.handleError('Failed to get album by id', error)
    return null
  }
}



const capabilities: Capabilities = {
  isrcs: {
    availability: "sometimes",
    presence: "onAlbumRefresh"
  },
  upcs: {
    availability: "sometimes",
    presence: "always"
  }
}

const soundcloud: FullProvider = {
  namespace,
  config: {capabilities},
  searchByArtistName: withCache(searchByArtistName, {
    ttl: 60 * 30,
    namespace: namespace
  }),
  getArtistById: withCache(getArtistById, {
    ttl: 60 * 30,
    namespace: namespace
  }),
  getArtistAlbums: withCache(getArtistAlbums, {
    ttl: 60 * 30,
    namespace: namespace
  }),
  getAlbumById: withCache(getAlbumById, {
    ttl: 60 * 30,
    namespace: namespace
  }),
  getTrackById: withCache(getTrackById, {
    ttl: 60 * 30,
    namespace: namespace
  }),
  formatArtistSearchData,
  formatArtistObject,
  formatAlbumObject,
  formatTrackObject,
  formatPartialArtistObject,
  formatAlbumGetData,
  formatArtistLookupData,
  createUrl,
  parseUrl
}

export default soundcloud
