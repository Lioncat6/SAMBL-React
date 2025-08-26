export type ArtistObject = {
    name: string;
    url: string;
    imageUrl: string;
    relevance: string;
    info: string;
    genres: string[];
    followers: number;
    popularity: number;
    id: string;
    provider: string;
};

export type AlbumArtistObject = {
    name: string;
    url: string;
    imageUrl: string;
    imageUrlSmall: string;
    id: string;
    provider: string;
};

export type AlbumObject = {
    provider: string;
    id: string;
    name: string;
    url: string;
    imageUrl: string;
    imageUrlSmall: string;
    albumArtists: AlbumArtistObject[];
    artistNames: string[];
    releaseDate: string;
    trackCount: number;
    albumType: string;
};

export type AlbumData = {
    count: number;
    current: number;
    next: string | null;
    albums: AlbumObject[];
};

export type Provider = {
    //TODO
}