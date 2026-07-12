import { PartialDate } from "@kellnerd/musicbrainz/common-types";
import { AggregatedAlbum, AggregatedLabel, AggregatedPartialArtist } from "../types/aggregated-types";
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
        link_type_id: type,
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


function buildSeed(album: AggregatedAlbum) {
    // Artist PreProcess
    // TODO: Move MBID obtaining to compareSingleAlbum API code
    if (album.artistID && album.artistMBID) {
        album.albumArtists.forEach((artist) => {
            if (artist.id == album.artistID && !artist.mbid) {
                artist.mbid = album.artistMBID;
            }
        });
        album.albumTracks.forEach((track) => {
            track.trackArtists.forEach((artist) => {
                if (artist.id == album.artistID && !artist.mbid) {
                    artist.mbid = album.artistMBID;
                }
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
                artist_credit: convertArtistCredit(track.trackArtists as AggregatedPartialArtist[]),
                number: track.trackNumber?.toString(),
                length: track.duration || undefined,
                recording: track.mbid,
            })),
        })),
        language: undefined, //TODO: Determine language
        script: undefined, //TODO: Determine script
        urls: convertUrls(album.url),
        annotation: undefined //TODO: Add detail text to albums,
        edit_note: buildEditNote(release.info, options),
        redirect_uri: undefined //TODO: Release Actions,
    };

}

function convertArtistCredit(artists?: AggregatedPartialArtist[]): ArtistCreditSeed | undefined {
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