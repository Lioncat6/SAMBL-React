export type ArtistObject = {
    name: string;
    url: string;
    imageUrl: string;
    imageUrlSmall: string;
    relevance: string;
    info: string;
    genres: string[] | null;
    followers: number | null;
    popularity: number | null;
    id: string;
    provider: string;
};

export type AlbumArtistObject = {
    name: string;
    url: string;
    imageUrl: string | null;
    imageUrlSmall: string | null;
    id: string;
    provider: string;
};

export type AlbumObject = {
    provider: string;
    id: string;
    name: string;
    url: string;
    imageUrl: string | null;
    imageUrlSmall: string | null;
    albumArtists: AlbumArtistObject[];
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
    artistNames: string[];
    albumName: string | null;
    releaseDate: string | null;
    trackNumber: number | null;
    duration: string | null;
    isrcs: string[];
};

export type AlbumData = {
    count: number | null;
    current: number | null;
    next: string | null;
    albums: AlbumObject[];
};

export type Provider = {
    //TODO
}