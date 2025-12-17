export class ArtistObject {
    name: string;
    url: string;
    imageUrl: string | null;
    imageUrlSmall: string | null;
    bannerUrl: string | null;
    relevance: string;
    info: string;
    genres: string[] | null;
    followers: number | null;
    popularity: number | null;
    id: string | number;
    provider: string;
};

export type PartialArtistObject = {
    name: string;
    url: string;
    imageUrl: string | null;
    imageUrlSmall: string | null;
    id: string | number;
    provider: string;
};

export class AlbumObject {
    provider: string;
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
};


export class TrackObject {
    provider: string;
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

export class UrlData {
    type: 'album' | 'track' | 'artist' | null;
    id: string | null;
};

export class UrlInfo extends UrlData {
    provider: FullProvider;
}

export class UrlMBIDDict {
    [key: string]: string | undefined;
}

export class Provider {
    namespace: string;
}

export type CacheOptions = {
  noCache?: boolean;
};

export class FullProvider extends Provider {
    getTrackByISRC?: (isrc: string, options?: CacheOptions) => Promise<any | null>;
    getAlbumByUPC?: (upc: string, options?: CacheOptions) => Promise<any | null>;
    searchByArtistName: (query: string, options?: CacheOptions) => Promise<any | null>;
    getAlbumById: (id: string, options?: CacheOptions) => Promise<any | null>;
    getTrackById: (id: string, options?: CacheOptions) => Promise<any | null>;
    getArtistById: (id: string, options?: CacheOptions) => Promise<any | null>;
    getArtistAlbums: (id: string, offset: string | number, limit: number, options?: CacheOptions) => Promise<any | null>;
    formatArtistSearchData: (rawData: any) => any;
    formatArtistLookupData: (rawData: any) => any;
    formatArtistObject: (artist: any) => ArtistObject;
    formatPartialArtistObject: (artist: any) => PartialArtistObject;
    formatAlbumGetData: (rawData: any) => AlbumData;
    formatAlbumObject: (album: any) => AlbumObject;
    formatTrackObject: (track: any) => TrackObject;
    getArtistUrl: (artist: any) => string | null;
    getTrackISRCs: (track: any) => string[] | null;
    getAlbumUPCs: (album: any) => string[] | null;
    parseUrl: (url: string) => UrlData | null;
    createUrl: (urlType: string, providerId: string) => string | null;
}

export class MusicBrainzProvider extends FullProvider {
    getIdBySpotifyId: (spotifyId: string, options?: CacheOptions) => Promise<string | null>;
    getIdsBySpotifyUrls: (spotifyUrls: string[], options?: CacheOptions) => Promise<UrlMBIDDict>;
    getArtistFeaturedAlbums: (id: string, offset: string | number, limit: number, options?: CacheOptions) => Promise<any | null>;
    getCoverByMBID: (mbid: string, options?: CacheOptions) => Promise<string | null>;
    getAlbumsBySourceUrls: (urls: string[], options?: CacheOptions) => Promise<AlbumObject[] | null>;
    searchForAlbumByArtistAndTitle: (artistName: string, albumTitle: string, options?: CacheOptions) => Promise<AlbumObject[] | null>;
    getArtistFeaturedReleaseCount: (artistId: string, options?: CacheOptions) => Promise<number | null>;
    getArtistReleaseCount: (artistId: string, options?: CacheOptions) => Promise<number | null>;
    getArtistByUrl: (url: string, options?: CacheOptions) => Promise<ArtistObject | null>;
    validateMBID: (mbid: string) => boolean;
}