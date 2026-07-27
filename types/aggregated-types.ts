import { ExtendedAlbumObject, TrackObject, ArtistObject, AlbumObject, LabelObject, MediumObject } from "./provider-types";

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


export class AggregatedLabel extends LabelObject {
    mbid?: string | null;
}

export class AlbumGroup {
    status: AlbumStatus;
    albumIssues: AlbumIssue[];
    albums: AlbumMatch[];
    aggregated: AggregatedAlbum | null;
}

export class AlbumMatch {
    type: AlbumMatchType;
    album: AlbumObject
}

export class AggregatedAlbum extends AlbumObject{
    mediums: AggregatedMedium[];
    sourceArtist: ArtistObject;
}

export class AggregatedMedium extends MediumObject {
    override tracks: AggregatedTrack[]
}

export class AggregatedTrack extends TrackObject {
    status: TrackStatus;
    trackIssues: TrackIssue[];
    mbTrack: TrackObject | null;
}

export class BasicTrack {
    name: string;
    isrcs: string[];
}

export class AggregatedData {
    albumData: AlbumGroup[]
    statusText: string
    green: number
    orange: number
    blue: number
    red: number
    total: number
}