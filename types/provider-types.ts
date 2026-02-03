import { ArtistIncludes, IArtist, IBrowseReleasesResult, ICoversInfo, IRecordingList, IRelease, IReleaseList, IUrl, IUrlLookupResult, RelationsIncludes, ReleaseIncludes, UrlIncludes } from "musicbrainz-api";
import { CacheOptions } from "../utils/cache";
import { AggregatedAlbum } from "./aggregated-types";

export type ProviderNamespace = "spotify" | "tidal" | "deezer" | "musicbrainz" | "musixmatch" | "soundcloud" | "bandcamp" | "applemusic"

export class PartialArtistObject {
    name: string
    url: string;
    imageUrl: string | null;
    imageUrlSmall: string | null;
    id: string;
    provider: ProviderNamespace;
};

export class ArtistObject extends PartialArtistObject {
    bannerUrl: string | null;
    relevance: string;
    info: string;
    genres: string[] | null;
    followers: number | null;
    popularity: number | null;
};

export class AlbumObject {
    provider: ProviderNamespace;
    id: string;
    name: string;
    url: string;
    imageUrl: string | null;
    imageUrlSmall: string | null;
    albumArtists: PartialArtistObject[];
    artistNames: string[];
    releaseDate: string | null;
    trackCount: number | null;
    albumType: string | null;
    upc: string | null;
    albumTracks: TrackObject[];
};

export class ExtendedAlbumObject extends AlbumObject {
    comment: string | null;
    externalUrls: string[] | null;
    hasImage: boolean;
    override albumTracks: ExtendedTrackObject[];
};

export class TrackObject {
    provider: ProviderNamespace;
    id: string | null;
    name: string;
    url: string | null;
    imageUrl: string | null;
    imageUrlSmall: string | null;
    trackArtists: PartialArtistObject[];
    artistNames: string[];
    albumName: string | null;
    releaseDate: string | null;
    trackNumber: number | null;
    duration: number | null;
    isrcs: string[];
};

export class ExtendedTrackObject extends TrackObject {
    comment: string | null;
    externalUrls: string[] | null;
}

export class PagingData {
    count: number | null;
    current: number | null;
    next: string | null;
}

export class RawAlbumData extends PagingData {
    albums: any[];
};

export class AlbumData extends PagingData {
    albums: AlbumObject[];
};

export class ExtendedAlbumData extends PagingData {
    albums: ExtendedAlbumObject[];
}

export type urlType = 'album' | 'track' | 'artist';

export class UrlData {
    type: urlType | null;
    id: string | null;
};

export class UrlInfo extends UrlData {
    provider: PartialProvider | FullProvider;
}

export class UrlMBIDDict {
    [key: string]: string | undefined;
}

export type IdMBIDDict = UrlMBIDDict;

export class ProviderConfig {
    default?: boolean;
}

export class Provider {
    namespace: ProviderNamespace;
    config?: ProviderConfig;
}

export class RegexArtistUrlQuery {
    fullQuery: RegExp["source"]
    idQueries: { [key: string]: RegExp["source"] }
}

export class FullProvider extends Provider {
    getTrackByISRC?: (isrc: string, options?: CacheOptions) => Promise<any | null>;
    getAlbumByUPC?: (upc: string, options?: CacheOptions) => Promise<any | null>;
    searchByArtistName: (query: string, options?: CacheOptions) => Promise<any | null>;
    getAlbumById: (id: string, options?: CacheOptions) => Promise<any | null>;
    getTrackById: (id: string, options?: CacheOptions) => Promise<any | null>;
    getArtistById: (id: string, options?: CacheOptions) => Promise<any | null>;
    getArtistAlbums: (id: string, offset?: string | number, limit?: number, options?: CacheOptions) => Promise<any | null>;
    formatArtistSearchData: (rawData: any) => any;
    formatArtistLookupData: (rawData: any) => any;
    formatArtistObject: (artist: any) => ArtistObject;
    formatPartialArtistObject: (artist: any) => PartialArtistObject;
    formatAlbumGetData: (rawData: any) => RawAlbumData;
    formatAlbumObject: (album: any) => AlbumObject;
    formatTrackObject: (track: any) => TrackObject;
    getArtistUrl: (artist: any) => string | null;
    getTrackISRCs: (track: any) => string[] | null;
    getAlbumUPCs: (album: any) => string[] | null;
    parseUrl: (url: string) => UrlData | null;
    createUrl: (urlType: urlType, providerId: string) => string | null;
    buildUrlSearchQuery?: (type: urlType, ids: string[]) => RegexArtistUrlQuery;
}

export type PartialProvider = Partial<FullProvider> & Provider;

export type ProviderCapability = (keyof PartialProvider);

export type ProviderWithCapabilities<T extends ProviderCapability[]> = Omit<PartialProvider, T[number]> & Required<Pick<PartialProvider, T[number]>>;

export class MusicBrainzProvider extends FullProvider {
    override getTrackByISRC: (isrc: string, options?: CacheOptions) => Promise<IRecordingList | null>;
    override getAlbumByUPC: (upc: string, options?: CacheOptions) => Promise<IReleaseList | null>;
    override formatAlbumObject: (album: any) => ExtendedAlbumObject;
    getAlbumByMBID: (id: string, inc: ReleaseIncludes[], options?: CacheOptions) => Promise<IRelease | null>;
    getIdBySpotifyId: (spotifyId: string, options?: CacheOptions) => Promise<string | null>;
    getIdsByExternalUrls: (spotifyUrls: string[], options?: CacheOptions) => Promise<UrlMBIDDict>;
    override getArtistAlbums: (id: string, offset?: string | number, limit?: number, options?: CacheOptions) => Promise<IBrowseReleasesResult | null>;
    override formatAlbumGetData: (rawData: any) => ExtendedAlbumData;
    getMBArtistAlbums: (id: string, offset?: string | number, limit?: number, inc?: ReleaseIncludes[], options?: CacheOptions) => Promise<IBrowseReleasesResult | null>;
    getArtistFeaturedAlbums: (id: string, offset?: string | number, limit?: number, inc?: ReleaseIncludes[], options?: CacheOptions) => Promise<IBrowseReleasesResult | null>;
    getCoverByMBID: (mbid: string, options?: CacheOptions) => Promise<ICoversInfo | null>;
    getAlbumsBySourceUrls: {
        (urls: string[], inc?: UrlIncludes[], options?: CacheOptions): Promise<IUrlLookupResult | null | undefined>;
        (url: string, inc?: UrlIncludes[], options?: CacheOptions): Promise<IUrl | null | undefined>;
    };
    searchForAlbumByArtistAndTitle: (artistName: string, albumTitle: string, options?: CacheOptions) => Promise<IReleaseList | null>;
    getArtistFeaturedReleaseCount: (artistId: string, options?: CacheOptions) => Promise<number | null>;
    getArtistReleaseCount: (artistId: string, options?: CacheOptions) => Promise<number | null>;
    getArtistByUrl: (url: string, inc?: UrlIncludes[], options?: CacheOptions) => Promise<IArtist | null>;
    validateMBID: (mbid: string) => boolean;
    getIdsByUrlQuery: (query: RegexArtistUrlQuery, options?:CacheOptions) => Promise<IdMBIDDict | null>;
}
