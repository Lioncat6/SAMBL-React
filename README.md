# SAMBL
Streaming Artist MusicBrainz Lookup

## Looking for contributors!
  
## Provider Status

| Provider | ISRC Lookup | UPC Lookup | Entity Lookup | Artist Search | Album Matching |
|:---:|:---:|:---:|:---:|:---:|:---:|
| MusixMatch | ✅ | ✅ | ❌ | ❌ | N/A |
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
```
* The Spotify Redirect URI does not need to be a valid URL, but must match your Spotify developer application
* The contact email is for MusicBrainz's api requirements
* MUSIXMATCH_ALTERNATE allows you to use browser cookies for an alternate authentication method