import { ExtendedAlbumObject, TrackObject, ArtistObject, AlbumObject, LabelObject } from "./provider-types";

export type AlbumIssue = 'noUPC' | 'UPCDiff' | 'missingISRCs' | 'ISRCDiff' | 'trackDiff' | 'noDate' | 'dateDiff' | 'noCover';
export type AlbumStatus = 'green' | 'orange' | 'blue' | 'red';

export type TrackStatus = 'green' | 'orange' | 'blue' | 'grey'; // Track count miss-match doesn't aggregate, so tracks would never be not found

export type TrackIssue = 'noISRC' | 'ISRCDiff' | 'noDuration' | "artistDiff"

/**
 * source - Selected source provider
 * 
 * provider - Supplimental provider data (For pulling links and filling data gaps)
 * 
 * target - Target provider existing data (Usually MusicBrainz)
 */
export type AlbumMatchType = 'source' | 'provider' | 'target'

export class AggregatedArtist extends ArtistObject {
    mbid?: string | null;
}

export class AggregatedPartialArtist extends AggregatedArtist {
    mbid?: string | null;
}

export class ArtistMatchedTrack extends TrackObject {
    trackArtists: AggregatedPartialArtist[];
}

export class AggregatedLabel extends LabelObject {
    mbid?: string | null;
}

export class AlbumGroup {
    status: AlbumStatus;
    albumIssues: AlbumIssue[];
    Albums: AlbumMatch[];
}

export class AlbumMatch {
    type: AlbumMatchType;
    
}

export class AggregatedAlbum extends AlbumObject{
    status: AlbumStatus;
    albumIssues: AlbumIssue[];
    mbid: string | null;
    artistID: string | null;
    artistMBID: string | null;
    mbAlbum: AlbumObject | null;
    aggregatedTracks: AggregatedTrack[];
    albumArtists: AggregatedPartialArtist[];
    albumTracks: ArtistMatchedTrack[];
    labels: AggregatedLabel[] | null;
}

export class AggregatedTrack extends TrackObject {
    status: TrackStatus;
    trackIssues: TrackIssue[];
    mbid?: string | null;
    artistMBID: string | null;
    mbTrack: TrackObject | null;
    trackArtists: AggregatedPartialArtist[];
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

export class AggregatedData {
    albumData: AggregatedAlbum[]
    statusText: string
    green: number
    orange: number
    blue: number
    red: number
    total: number
}