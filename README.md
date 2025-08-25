# SAMBL
Streaming Artist MusicBrainz Lookup

## Looking for contributors!
  
## Provider Status

| Provider | ISRC Lookup | UPC Lookup | Entity Lookup | Artist Search | Album Matching |
|:---:|:---:|:---:|:---:|:---:|:---:|
| MusicBrainz | ✅ | ✅ | ✅ | ❌ | N/A |
| Spotify | ✅ | ✅ | ✅ | ✅ | ✅ |
| Deezer | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tidal | ✅ | ✅ | ✅ | ✅ | ✅ |
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
TIDAL_CLIENT_ID=<Tidal Client ID>
TIDAL_CLIENT_SECRET=<Tidal Client Secret>
```
* The Spotify Redirect URI does not need to be a valid URL, but must match your Spotify developer application
* The contact email is for MusicBrainz's api requirements
* MUSIXMATCH_ALTERNATE allows you to use browser cookies for an alternate authentication method

## API Docs

### Providers (See supported features above)
| Provider | Namespace |
|:---:|:---:|
| Musicbrainz | musicbainz |
| Spotify | spotify |
| Deezer | deezer |
| Tidal | tidal |
| MusixMatch | musixmatch |

### Officially Supported API endpoints
These API endpoints were created with public use in mind and will be fully supported for the foreseeable future.

The API root is `/api/` (Ex: `https://sambl.lioncat6.com/api/find`)

#### `/find`
- `query` (string) **[Required]**  
- `type` (`UPC` or `ISRC`) **[Required]**  
  - Looks up tracks or albums by barcode (UPC) or ISRC across Spotify, MusicBrainz, Deezer, and MusixMatch (ISRC only).

#### `/compareArtistAlbums` (beta)
- `provider_id` (Provider Identification Number) **[Required]**
- `provider` (Provider namespace) **[Required]**
- `mbid` (MusicBrainz artist ID)  
  - Only necessary if you want to check if the associated albums are linked to that artist.
- `quick` (boolean)  
  - Uses URL matching to check for Spotify album links in MusicBrainz. This returns faster, but contains less information, removing the orange album status.
- `full` (boolean)  
  - Adds inc parameters to the MusicBrainz query. (Does not affect quick mode)

#### `/compareSingleAlbum`
  - `spotifyId` (Spotify album ID or URL) **[Required]**
  - `mbid` (MusicBrainz artist ID) **[Required]**

---

### Unsupported API endpoints
These API endpoints were created for internal use but are publicly accessible for the time being. Note that these may change unexpectedly and without warning.

- `/getArtistAlbums`
  - `provider_id` (Provider Identification Number) **[Required]**
  - `provider` (Provider namespace) **[Required]**
  - `offset` (integer | string)
    - Used as the page identifier for tidal lookups
    - Ignored for Deezer lookups
  - `limit` (integer)
    - Ignored for Deezer lookups
- `/getArtistInfo`
  - `provider_id` (Provider Identification Number) **[Required]**
  - `provider` (Provider namespace) **[Required]**
- `/getMusicBrainzAlbums`
  - `mbid` (MusicBrainz artist ID) **[Required]**
  - `offset` (integer)
  - `limit` (integer)
- `/getMusicBrainzFeaturedAlbums`
  - `mbid` (MusicBrainz artist ID) **[Required]**
  - `offset` (integer)
  - `limit` (integer)
- `/lookupArtist`
  - `provider_id` (Provider Identification Number) **[Required]**
  - `provider` (Provider namespace) **[Required]**
    - Only spotify is currently supported here
- `/searchArtists`
  - `provider_id` (Provider Identification Number) **[Required]**
  - `provider` (Provider namespace) **[Required]**
  - `query` (string) **[Required]**
- `/getArtistReleaseCount`
  - `mbid` (MusicBrainz artist ID) **[Required]**
  - `featured` (boolean)
- `/ping`
  - Health check endpoint, returns `{ message: "Pong" }`

See each endpoint's source in [`/pages/api/`](pages/api/) for
