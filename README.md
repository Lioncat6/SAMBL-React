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
| Bandcamp | ⚠️ | ⚠️ | ✅ | ✅ | ✅ |
| MusixMatch | ✅ | ❌ | ❌ | ❌ | ❌ |
| SoundCloud | ❌️ | ❌️ | ✅️ | ✅️ | ✅️ |

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
| Musicbrainz | musicbrainz |
| Spotify | spotify |
| Deezer | deezer |
| Tidal | tidal |
| MusixMatch | musixmatch |

### Officially Supported API endpoints
These API endpoints were verified against the server source and will be kept stable for public use.

The API root is `/api/` (Ex: `https://sambl.lioncat6.com/api/find`)

#### `/find`
- `query` (string) **[Required]**
- `type` (string) **[Required]** — value must be either `UPC` or `ISRC`
  - Looks up tracks or albums by barcode (UPC) or ISRC across Spotify, MusicBrainz, Deezer, Tidal and (ISRC only) MusixMatch.

#### `/compareArtistAlbums` (beta)
- `provider_id` (string) **[Required]** — provider-specific artist id (e.g. Spotify artist id)
- `provider` (string) **[Required]** — provider namespace (e.g. `spotify`, `tidal`, `deezer`)
- `mbid` (string) — MusicBrainz artist id (required unless the `quick` flag is present)
- `quick` (flag present if any value supplied) — when present the endpoint runs a faster URL-matching-only workflow and does not require `mbid`
- `full` (flag) — when present adds additional inc parameters to MusicBrainz queries
- `raw` (flag) — when present returns raw source and MB album arrays instead of processed results
  - Notes: `mbid` is validated; if `mbid` is missing and `quick` is not present the request will be rejected (400).

#### `/compareSingleAlbum`
- `provider_id` (string) OR `url` (string) **[One required]**
  - If you supply `provider_id` you must also supply `provider` (namespace). If you supply `url`, the provider is inferred.
- `provider` (string) — required when using `provider_id`
- `mbid` (string) — optional MusicBrainz artist id used to disambiguate when searching MusicBrainz by artist+title

---

### Unsupported / internal-but-public API endpoints
These endpoints are used internally by SAMBL and are publicly accessible; they may change.

- `/getArtistAlbums`
  - `provider_id` (string) **[Required]**
  - `provider` (string) **[Required]**
  - `offset` (integer|string) — pagination offset (used by some providers like Tidal)
  - `limit` (integer) — page size (provider-dependent)
  - `forceRefresh` (flag) — presence of this query param triggers a cache bypass (noCache)

- `/getArtistInfo`
  - `provider_id` (string) OR `url` (string) **[One required]**
    - If `provider_id` is given you must also provide `provider`.
  - `provider` (string) — required when using `provider_id`
  - `mbData` (flag) — when present the endpoint includes MusicBrainz data alongside the provider data
  - `forceRefresh` (flag) — bypass cache when present

- `/getMusicBrainzAlbums`
  - `mbid` (string) **[Required]** — validated MusicBrainz artist id
  - `offset` (integer)
  - `limit` (integer)
  - `forceRefresh` (flag)

- `/getMusicBrainzFeaturedAlbums`
  - `mbid` (string) **[Required]**
  - `offset` (integer)
  - `limit` (integer)
  - `forceRefresh` (flag)

- `/lookupArtist`
  - `provider_id` (string) OR `url` (string) **[One required]**
    - If `provider_id` is supplied, `provider` (string) is required.
  - `provider` (string) — required when using `provider_id`
  - `forceRefresh` (flag)
  - Notes: the endpoint expects an artist URL when using `url` (type checked). It will return the resolved MusicBrainz id (mbid) when available.

- `/searchArtists`
  - `query` (string) **[Required]**
  - `provider` (string) **[Required]** — provider namespace that supports artist search (e.g. `spotify`)
  - Notes: this endpoint expects the provider to implement `searchByArtistName`.

- `/getArtistReleaseCount`
  - `mbid` (string) **[Required]**
  - `featured` (flag) — include featured releases in the returned counts

- `/getAlbumUPCs`
  - `provider_id` (string) OR `url` (string) **[One required]**
  - `provider` (string) — required when using `provider_id`
  - Notes: provider must implement `getAlbumById` and `getAlbumUPCs`.

- `/getTrackISRCs`
  - `provider_id` (string) OR `url` (string) **[One required]**
  - `provider` (string) — required when using `provider_id`
  - Notes: provider must implement `getTrackById` and `getTrackISRCs`.

- `/artistDeepSearch`
  - `provider_id` (string) OR `url` (string) **[One required]**
  - `provider` (string) — required when using `provider_id`
  - Notes: runs a multi-step search (gathers albums, UPCs, MusicBrainz lookups etc.) and returns the best-matching MusicBrainz artist id plus metadata about the matching process.

- `/ping`
  - Health check endpoint; returns `{ message: "Pong" }`.


See each endpoint's source in [`/pages/api/`](pages/api/) for full implementation details and any provider-specific behavior.
