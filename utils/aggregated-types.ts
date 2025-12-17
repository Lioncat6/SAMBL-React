import { ExtendedAlbumObject, TrackObject, ArtistObject, AlbumObject } from "../pages/api/providers/provider-types";

export type AlbumIssue = 'noUPC' | 'UPCDiff' | 'missingISRCs' | 'ISRCDiff' | 'trackDiff' | 'noDate' | 'dateDiff' | 'noCover';
export type AlbumStatus = 'green' | 'orange' | 'red';

export class AggregatedArtist extends ArtistObject {
    mbid: string | null;
}

export class AggregatedAlbum extends ExtendedAlbumObject{
    status: AlbumStatus;
    albumIssues: AlbumIssue[];
    mbid: string | null;
    artistMBID: string | null;
    mbAlbum: AlbumObject | null;
}

export class BasicTrack {
    name: string;
    isrcs: string[];
}