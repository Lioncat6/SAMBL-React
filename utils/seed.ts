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
import { ExternalUrlData, PartialArtistObject } from "../types/provider-types";
import { ReleaseGroupType } from "@kellnerd/musicbrainz/data/release-group";
import editNoteBuilder from "./editNoteBuilder";
import albumStack from "./albumStack";

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

function convertUrls(SAMBLUrl: ExternalUrlData): ReleaseUrlSeed[] {
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

function buildSeed(stack: AlbumStack) {
    const [aggregatedAlbum, sourceAlbum, targetAlbum] = albumStack.unstack(stack)

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
        mediums: (aggregatedAlbum.mediums.length > 0 ? aggregatedAlbum.mediums : sourceAlbum?.mediums || []).map<MediumSeed>((medium) => ({
            format: medium.format || undefined,
            name: medium.name || undefined,
            track: medium.tracks.map<TrackSeed>((track) => ({
                name: track.name,
                artist_credit: convertArtistCredit(track.trackArtists as PartialArtistObject[]),
                number: track.trackNumber?.toString(),
                length: track.duration || undefined,
                recording: track.mbid || undefined,
            })),
        })),
        language: aggregatedAlbum.language?.code,
        script: aggregatedAlbum.script?.code,
        urls: convertUrls(aggregatedAlbum.url),
        annotation: undefined, //TODO: Add detail text to albums,
        edit_note: editNoteBuilder.buildSeedReleaseEditNote(aggregatedAlbum),
        redirect_uri: undefined //TODO: Release Actions,
    };
    return flatten(seed);
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

const seed = {
    buildSeed
}

export default seed;