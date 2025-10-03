import type {
    ArtistObject,
    AlbumObject,
    TrackObject,
    AlbumData,
    PartialArtistObject
} from './provider-types'
import logger from '../../../utils/logger'
import withCache from '../../../utils/cache'
import ErrorHandler from '../../../utils/errorHandler'
import Soundcloud, {
    SoundcloudUser,
    SoundcloudUserSearch,
    SoundcloudTrack,
    SoundcloudPlaylist
} from 'soundcloud.ts'
import { getRawAsset } from 'node:sea'
import { backup } from 'node:sqlite'

const namespace = 'soundcloud'

const err = new ErrorHandler(namespace)

const soundcloudClientId: string = process.env.SOUNDCLOUD_CLIENT_ID ?? ''
const soundcloudOauthToken: string = process.env.SOUNDCLOUD_OAUTH_TOKEN ?? ''

if (!soundcloudClientId || !soundcloudOauthToken) {
    throw new Error(
        'TIDAL_CLIENT_ID and SOUNDCLOUD_OAUTH_TOKEN must be set in environment variables.'
    )
}

const scApi = new Soundcloud(soundcloudClientId, soundcloudOauthToken)

function getReleaseDate(entity) {
    if (entity.release_day)
        return `${entity.release_year}-${entity.release_month}-${entity.release_day}`
    return entity.created_at?.split('T')[0]
}

async function searchByArtistName(artistName: string) {
    try {
        // Fetch artist data
        const data = await scApi.users.search({ q: artistName })
        return data
    } catch (error) {
        err.handleError('Error searching for artist:', error)
    }
}

async function getArtistById(id: number) {
    try {
        const data = scApi.users.get(id)
        return data
    } catch (error) {
        err.handleError('Error fetching artist:', error)
    }
}

function formatArtistLookupData(rawData: SoundcloudUser) {
    return rawData
}

function formatArtistSearchData(rawData: SoundcloudUserSearch) {
    return rawData.collection
}

function getArtistUrl(artist: SoundcloudUser) {
    return `https://soundcloud.com/${artist.permalink}`
}

function formatArtistObject(rawObject: SoundcloudUser): ArtistObject {
    const countries = new Intl.DisplayNames(['en'], { type: 'region' })

    return {
        name: rawObject.username,
        url: `https://soundcloud.com/${rawObject.permalink}`,
        imageUrl: rawObject.avatar_url?.includes('default_avatar')
            ? rawObject.avatar_url
            : rawObject.avatar_url?.replace('large', 't500x500') || '',
        imageUrlSmall: rawObject.avatar_url || '',
        bannerUrl: rawObject.visuals?.visuals[0]?.visual_url,
        relevance: `${rawObject.followers_count} Followers`,
        info: `${rawObject.city
            ? rawObject.city + (rawObject.country_code ? ', ' : '')
            : ''
            }${rawObject.country_code
                ? countries.of(rawObject.country_code.toString().toUpperCase())
                : ''
            }`,
        genres: null,
        followers: rawObject.followers_count,
        popularity: null,
        id: rawObject.id.toString(),
        provider: namespace
    }
}

async function getArtistAlbums(artistId, offset, limit) {
    try {
        let artistPlaylists = await scApi.users.playlists(artistId)
        let artistTracks = await scApi.users.tracks(artistId)
        return { artistTracks: artistTracks, artistPlaylists: artistPlaylists }
    } catch (error) {
        err.handleError('Failed to fetch artist albums', error)
    }
}

function formatAlbumGetData(rawData): AlbumData {
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

function getUPCFromAlbum(album): string | null {
    let upc:string|null = null
    if (album.tracks) {
        for (let track of album.tracks) {
            if (track.publisher_metadata?.upc_or_ean) {
                if (!upc) {
                    upc = track.publisher_metadata.upc_or_ean
                } else if (upc !== track.publisher_metadata.upc_or_ean) {
                    return null
                }
            }
        }
    } else if (album.publisher_metadata?.upc_or_ean) {
        upc = album.publisher_metadata.upc_or_ean
    }
    return upc
}

function formatAlbumObject(rawAlbum): AlbumObject {
    return {
        provider: namespace,
        id: rawAlbum.urn || `soundcloud:${rawAlbum.kind}:${rawAlbum.id}`,
        name: rawAlbum.title,
        url: rawAlbum.permalink_url?.split('?')[0],
        imageUrl: rawAlbum.artwork_url?.replace('large', 't500x500') || '',
        imageUrlSmall: rawAlbum.artwork_url || '',
        albumArtists: [formatPartialArtistObject(rawAlbum.user)],
        artistNames: [rawAlbum.user.username],
        releaseDate: getReleaseDate(rawAlbum),
        trackCount: rawAlbum.track_count || 1,
        albumType: rawAlbum.type || 'single',
        upc: getUPCFromAlbum(rawAlbum),
        albumTracks: getAlbumTracks(rawAlbum)
    }
}

function getAlbumTracks(album) {
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

function formatTrackObject(track): TrackObject {
    return {
        provider: namespace,
        id: track.urn || `soundcloud:track:${track.id}`,
        name: track.title,
        url: track.permalink_url?.split('?')[0],
        imageUrl: track.artwork_url?.replace('large', 't500x500') || '',
        imageUrlSmall: track.artwork_url || '',
        albumName: track.albumName,
        trackArtists: track.user ? [formatPartialArtistObject(track.user)] : [],
        artistNames: [track.user?.username],
        duration: track.duration,
        trackNumber: track.track_number || null,
        releaseDate: getReleaseDate(track),
        isrcs: track.publisher_metadata?.isrc
            ? [track.publisher_metadata?.isrc]
            : []
    }
}

function formatPartialArtistObject(artist: SoundcloudUser): PartialArtistObject {
    return {
        name: artist.username,
        url: artist.permalink_url?.split('?')[0],
        imageUrl: artist.avatar_url?.includes('default_avatar')
            ? artist.avatar_url
            : artist.avatar_url?.replace('large', 't500x500') || '',
        imageUrlSmall: artist.avatar_url || '',
        id: artist.id,
        provider: namespace
    }
}

async function getAlbumById(id: string): Promise<SoundcloudTrack | SoundcloudPlaylist | null> {
    try {
        let album: null | SoundcloudTrack | SoundcloudPlaylist = null;
        if (id.includes("/set") || id.includes(":playlist:")) {
            album = await scApi.playlists.get(id);
        } else {
            album = await scApi.tracks.get(id);
        }
        return album;
    } catch (error) {
        err.handleError("Failed to get album by id", error)
        return null;
    }
}

function createUrl(type, id) {
    return null
}

function parseUrl(url) {
    const setRegex = /soundcloud\.com\/[^\/]*\/sets\/([^\/]*)/
    const trackRegex = /soundcloud\.com\/[^\/]*\/([^\/]*)/
    const artistRegex = /soundcloud\.com\/([^\/]*)/
    if (url.match(setRegex)) {
        return {
            type: "album",
            id: url,
        };
    } else if (url.match(trackRegex)) {
        return {
            type: "track",
            id: url,
        };
    } else if (url.match(artistRegex)) {
        return {
            type: "artist",
            id: url.match(artistRegex)[0],
        };
    }
    return null;
}

const soundcloud = {
    namespace,
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
    formatArtistSearchData,
    formatArtistObject,
    formatAlbumObject,
    formatTrackObject,
    formatPartialArtistObject,
    formatAlbumGetData,
    formatArtistLookupData,
    getArtistUrl,
    createUrl,
    parseUrl
}

export default soundcloud
