import { ExtendedAlbumObject, TrackObject, ArtistObject, AlbumObject } from "../pages/api/providers/provider-types";

export type AlbumIssue = 'noUPC' | 'UPCDiff' | 'missingISRCs' | 'ISRCDiff' | 'trackDiff' | 'noDate' | 'dateDiff' | 'noCover';
export type AlbumStatus = 'green' | 'orange' | 'blue' | 'red';

export type TrackStatus = 'green' | 'orange' | 'blue' | 'grey'; // Track count miss-match doesn't aggregate, so tracks would never be not found

export type TrackIssue = 'noISRC' | 'ISRCDiff' | 'noDuration' | "artistDiff"

export class AggregatedArtist extends ArtistObject {
    mbid: string | null;
}

export class AggregatedAlbum extends AlbumObject{
    status: AlbumStatus;
    albumIssues: AlbumIssue[];
    mbid: string | null;
    artistID: string | null;
    artistMBID: string | null;
    mbAlbum: AlbumObject | null;
    aggregatedTracks: AggregatedTrack[];
}

export class AggregatedTrack extends TrackObject {
    status: TrackStatus;
    trackIssues: TrackIssue[];
    mbid: string | null;
    artistMBID: string | null;
    mbTrack: TrackObject | null;
}

export class BasicTrack {
    name: string;
    isrcs: string[];
}

export class AggregatedAlbumData {
    albumData: AggregatedAlbum[];
    statusText: string;
    green: number;
    orange: number;
    red: number;
    total: number;
}