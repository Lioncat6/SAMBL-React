import { PartialDate } from "@kellnerd/musicbrainz/common-types";
import { AggregatedAlbum, AggregatedArtist, AggregatedLabel, AlbumStack } from "../types/aggregated-types";
import type {
    ArtistCreditNameSeed,
    ArtistCreditSeed,
    MediumSeed,
    ReleaseEventSeed,
    ReleaseLabelSeed,
    ReleaseSeed,
    ReleaseUrlSeed,
    TrackSeed,
} from '@kellnerd/musicbrainz/seeding/release';
import { ExternalUrlData, PartialArtistObject, TrackObject } from "../types/provider-types";
import { ReleaseGroupType } from "@kellnerd/musicbrainz/data/release-group";
import editNoteBuilder from "./editNoteBuilder";
import albumStack from "./albumStack";
import clientProviders from "./clientProviders";

function convertDate(SAMBLDate: string): PartialDate | undefined {
    const parts = SAMBLDate.split('-').map((part) => parseInt(part, 10));
    if (parts.length === 3) {
        return { year: parts[0], month: parts[1], day: parts[2] };
    } else if (parts.length === 2) {
        return { year: parts[0], month: parts[1] };
    } else if (parts.length === 1) {
        return { year: parts[0] };
    }
}

function convertReleaseGroupType(SAMBLType: string | null): ReleaseGroupType[] | undefined {
    if (!SAMBLType) return undefined;
    const primaryTypes: ReleaseGroupType[] = ["Album", "Single", "EP", "Broadcast", "Other"];
    const foundType = primaryTypes.find((type) => type.toLowerCase() === SAMBLType.toLowerCase());
    return foundType ? [foundType] : undefined;
}

function convertUrls(SAMBLUrl: ExternalUrlData | null): ReleaseUrlSeed[] {
    if (!SAMBLUrl) return [];
    if (SAMBLUrl.mbTypes.length == 0) return [{ url: SAMBLUrl.url }];
    return SAMBLUrl.mbTypes.map((type) => ({
        url: SAMBLUrl.url,
        link_type: type,
    }));
}

function convertLabels(SAMBLLabels: AggregatedLabel[] | null): ReleaseLabelSeed[] | undefined {
    if (!SAMBLLabels) return undefined;
    return SAMBLLabels.map((label) => ({
        name: label.name,
        catalog_number: label.catalogNumber || undefined,
        mbid: label.mbid || undefined,
    }));

}

function convertArtistCredit(artists?: PartialArtistObject[]): ArtistCreditSeed | undefined {
    if (!artists) return;

    const lastIndex = artists.length - 1;
    return {
        names: artists.map<ArtistCreditNameSeed>((artist, index) => {
            const defaultJoinPhrase = (index !== lastIndex) ? (index === lastIndex - 1 ? ' & ' : ', ') : undefined;

            return {
                artist: !artist.mbid ? { name: artist.name } : undefined,
                mbid: artist.mbid || undefined,
                name: artist.name,
                join_phrase: defaultJoinPhrase,
            };
        }),
    };
}


export function flatten(record: Record<string, any>, preservedKeys: string[] = []): Record<string, any> {
    const flatRecord = {};

    for (const key in record) {
        let value = record[key];
        if (typeof value === 'object' && value !== null && !preservedKeys.includes(key)) { // also matches arrays
            value = flatten(value, preservedKeys);
            for (const childKey in value) {
                flatRecord[key + '.' + childKey] = value[childKey]; // concatenate keys
            }
        } else if (value !== undefined) { // value is already flat (e.g. a string) or should be preserved
            flatRecord[key] = value; // keep the key
        }
    }

    return flatRecord;
}


function buildSeed(stack: AlbumStack, origin: string) {
    const [aggregatedAlbum, sourceAlbum, targetAlbum] = albumStack.unstack(stack)

    let annotation: string | undefined = '';
    if (aggregatedAlbum.copyrights && aggregatedAlbum.copyrights.length > 0) annotation+='Copyright: ' + aggregatedAlbum.copyrights?.join('%0A');
    if (sourceAlbum?.comment) annotation += `=== From ${clientProviders.getDisplayName(sourceAlbum.provider)}: ===\n`+sourceAlbum.comment;
    if (annotation.length == 0) annotation = undefined;
    const seed: ReleaseSeed = {
        name: aggregatedAlbum.name,
        artist_credit: convertArtistCredit(aggregatedAlbum.albumArtists),
        release_group: undefined, // Leave blank since MBS fills based on release title
        barcode: aggregatedAlbum.upc?.toString(),
        events: aggregatedAlbum.releaseDate ? [{
            date: convertDate(aggregatedAlbum.releaseDate),
        }] : undefined,
        labels: convertLabels(aggregatedAlbum.labels),
        status: "Official", //TODO: Determine release status
        type: convertReleaseGroupType(aggregatedAlbum.albumType),
        packaging: undefined, //TODO: Determine packaging
        mediums: (aggregatedAlbum.mediums.length > 0 ? aggregatedAlbum.mediums : sourceAlbum?.mediums ?? []).map<MediumSeed>((medium) => ({
            format: medium.format ?? undefined,
            name: medium.name ?? undefined,
            track: medium.tracks.map<TrackSeed>((track) => ({
                name: track.name,
                artist_credit: convertArtistCredit(track.trackArtists as PartialArtistObject[]),
                number: track.trackNumber?.toString(),
                length: track.duration ?? undefined,
                recording: track.mbid ?? undefined,
            })),
        })),
        language: aggregatedAlbum.language?.code,
        script: aggregatedAlbum.script?.code,
        urls: convertUrls(aggregatedAlbum.url),
        annotation: annotation,
        edit_note: editNoteBuilder.buildSeedReleaseEditNote(aggregatedAlbum),
        redirect_uri: origin + "&showActions",
    };
    return flatten(seed);
}

export interface RecordingSeed {
    //https://github.com/kellnerd/musicbrainz-ts
    /** The name of the recording. Non-empty string. Required. */
    name: string;

    /** A disambiguation comment for the recording. Non-empty string. */
    comment?: string;
    /** Text to place in the recordings annotation (multi-line). */
    annotation?: string;
    /**
     * The isrcs of the recording.
     *
     * May be any valid isrc without whitespace.
     */
    isrcs?: string[];
    /** A recording may be credited to multiple artists via an Artist Credit. */
    artist_credit?: ArtistCreditSeed;

    /** You can seed a list of URLs to add as relationships to the recording. */
    urls?: ReleaseUrlSeed[];

    /** The track's duration, in MM:SS form or an integer as milliseconds. */
    length?: string | number;

    /** Is the recording a video */
    video?: 1 | 0

    /** Specify the content of the edit note (multi-line). */
    edit_note?: string;
    /**
     * A URI to redirect to after the recording is submitted.
     *
     * The recording's MBID will be added to this URI under the `recording_mbid` query
     * parameter. E.g., if http://example.com/ is provided for this, the user will
     * be redirected to a URI like http://example.com/?recording_mbid=4587fe99-db0e-4553-a56a-164dd38ab380.
     */
    redirect_uri?: string;
}

function buildRecordingSeed(data: AlbumStack | TrackObject, origin: string) {
    let recording: TrackObject | undefined;
    if ("aggregated" in data) {
        const stack = data as AlbumStack;
        const [aggregatedAlbum, sourceAlbum, targetAlbum] = albumStack.unstack(stack)
        recording = sourceAlbum?.mediums[0]?.tracks[0];
        if (!recording) return null;
    } else {
        recording = data as TrackObject;
    }
    const seed: RecordingSeed = {
        name: recording.name,
        artist_credit: convertArtistCredit(recording.trackArtists),
        urls: convertUrls(recording.url),
        annotation:  undefined, 
        isrcs: recording.isrcs,
        length: recording.duration ?? undefined,
        video: recording.isVideo ? 1 : 0,
        edit_note: editNoteBuilder.buildSeedRecordingEditNote(recording),
        redirect_uri: origin + "&showRecordingActions",
    }
    return flatten(seed);
}

function seedUrls(stack: AlbumStack, origin: string) {
    const [aggregatedAlbum, sourceAlbum, targetAlbum] = albumStack.unstack(stack)

    const seed: Omit<ReleaseSeed, 'name'> = {
        urls: convertUrls(aggregatedAlbum.url),
        edit_note: editNoteBuilder.buildSeedReleaseEditNote(aggregatedAlbum, "Additional URLs seeded"),
        redirect_uri: origin + "&showActions",
    };
    return flatten(seed);
}

const seed = {
    buildSeed,
    buildRecordingSeed,
    seedUrls
}

export default seed;