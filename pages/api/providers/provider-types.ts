export type ArtistObject = {
    name: string;
    url: string;
    imageUrl: string;
    imageUrlSmall: string;
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

export type AlbumObject = {
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

export type TrackObject = {
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

export type AlbumData = {
    count: number | null;
    current: number | null;
    next: string | null;
    albums: AlbumObject[];
};

export class UrlData {
    type: 'album' | 'track' | 'artist' | null;
    id: string | null;
};

export class UrlInfo extends UrlData {
    provider: FullProvider;
}

export class Provider {
    namespace: string;
}

export class FullProvider extends Provider {
    getTrackByISRC?: (isrc: string) => Promise<any | null>;
    getAlbumByUPC?: (upc: string) => Promise<any | null>;
    searchByArtistName: (query: string) => Promise<any | null>;
    getAlbumById: (id: string) => Promise<any | null>;
    getTrackById: (id: string) => Promise<any | null>;
    getArtistById: (id: string) => Promise<any | null>;
    getArtistAlbums: (id: string, offset: string | number, limit: number) => Promise<any | null>;
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