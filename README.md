# SAMBL
Streaming Artist MusicBrainz Lookup

## Looking for contributors!
  
## Provider Status

| Provider | ISRC Lookup | UPC Lookup | Entity Lookup | Artist Search | Album Matching |
|:---:|:---:|:---:|:---:|:---:|:---:|
| MusicBrainz | ✅ | ✅ | ❌ | ❌ | N/A |
| Spotify | ✅ | ✅ | ❌ | ✅ | ✅ |
| Deezer | ✅ | ✅ | ❌ | ❌ | ❌ |
| MusixMatch | ✅ | ❌ | ❌ | ❌ | ❌ |

### MetaBrainz Thread:

https://community.metabrainz.org/t/sambl-spotify-artist-musicbrainz-lookup/716550

## Configuration
`.env` 
```
REACT_APP_VERSION=$npm_package_version
REACT_APP_NAME=$npm_package_name
SPOTIFY_CLIENT_ID=<Spotify Client ID>
SPOTIFY_CLIENT_SECRET=<Spotify Client Secret>
SPOTIFY_REDIRECT_URI=<Spotify Redirect URI>
CONTACT_INFO=<Contact email>
MUSIXMATCH_API_KEY=<MusixMatch Api Key or browser cookie [Optional]>
MUSIXMATCH_ALTERNATE=<Bool 1 or 0>
NEXT_PUBLIC_MASTODON_URL=<Mastodon URL [Optional]>
```
* The Spotify Redirect URI does not need to be a valid URL, but must match your Spotify developer application
* The contact email is for MusicBrainz's api requirements
* MUSIXMATCH_ALTERNATE allows you to use browser cookies for an alternate authentication method

## API Docs

### Officially Supported API endpoints
These API endpoints were created with public use in mind and will be fully supported for the foreseeable future.

The api root is `/api/` (Ex: `https://sambl.lioncat6.com/api/find`)

 - `/find`
   - `query` (string) [R]
   - `type` <UPC or ISRC> [R]
 - `/compareArtistAlbums` (beta)
   - `spotifyId` <Spotify ID> [R]
   - `mbid` <MBID>
     - Only neccesary if you want to check if the associated albums are linked to that artist
   - `quick` (bool)
     - Uses URL matching to check for spotify album links in MusicBrainz. This returns faster, but contains less information, removing the orange album status.
   - `full` (bool)
     - Adds inc parameters to the MusicBrainz query. (Does not affect quick mode)

### Unsupported API endpoints
These API endpoints were created for internal use but are publically accessible for the time being. Note that these may change unexpectedly and without warning

 - `getArtistAlbums`
 - `getArtistInfo`
 - `getMusicBrainzAlbums`
 - `getMusicBrainzFeaturedAlbums`
 - `lookupArtist`
 - `searchArtists`
