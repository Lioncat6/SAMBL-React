import { PartialDate } from "@kellnerd/musicbrainz/common-types";
import { AggregatedAlbum, AggregatedLabel } from "../types/aggregated-types";
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

function buildSeed(album: AggregatedAlbum) {
    // Artist PreProcess
    // TODO: Move MBID obtaining to compareSingleAlbum API code
    if (album.sourceArtist?.id && album.sourceArtist?.mbid) {
        let id = album.sourceArtist.id;
        let mbid = album.sourceArtist.mbid;
        album.albumArtists.forEach((artist) => {
            if (artist.id == id && !artist.mbid) {
                artist.mbid = mbid;
            }
        });
        album.mediums.forEach((medium) => {
            medium.tracks.forEach((track) => {
                track.trackArtists.forEach((artist) => {
                    if (artist.id == id && !artist.mbid) {
                        artist.mbid = mbid;
                    }
                });
            });
        });
    }

    const seed: ReleaseSeed = {
        name: album.name,
        artist_credit: convertArtistCredit(album.albumArtists),
        release_group: album.name,
        barcode: album.upc?.toString(),
        events: album.releaseDate ? [{
            date: convertDate(album.releaseDate),
        }] : undefined,
        labels: convertLabels(album.labels),
        status: "Official", //TODO: Determine release status
        type: convertReleaseGroupType(album.albumType),
        packaging: undefined, //TODO: Determine packaging
        mediums: album.mediums.map<MediumSeed>((medium) => ({
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
        language: undefined, //TODO: Determine language
        script: undefined, //TODO: Determine script
        urls: convertUrls(album.url),
        annotation: undefined, //TODO: Add detail text to albums,
        edit_note: editNoteBuilder.buildSeedReleaseEditNote(album),
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