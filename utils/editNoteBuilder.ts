import { AggregatedAlbum, AggregatedArtist, AlbumStack } from "../types/aggregated-types";
import { DeepSearchData } from "../types/api-types";
import { DeepSearchSelection } from "../types/component-types";
import { ArtistObject, PartialArtistObject } from "../types/provider-types";
import albumStack from "./albumStack";
import clientProviders from "./clientProviders";
import text from "./text";

function encode(str: string) {
    return encodeURIComponent(str).replace(/%250A/g, '%0A');
}

/**
 * Generate Edit note String
 *
 * @param {string} edit The type of edit being made (e.g., "Artist image", "Track ISRC", etc.).
 * @param {string} provider The provider of the content (e.g., "Spotify", "Deezer", etc.).
 * @param {string} sourceUrl The URL of the source content.
 * @param {string} artistUrl The URL of the artist's page.
 * @returns {string} The formatted edit note string.
 */
function buildEditNote(edit: string, provider: string, sourceUrl: string, artistUrl: string, pageUrl: string | null = null): string {
    return encode(
        `${edit} imported from ''SAMBL''%0A` +
        `'''Provider:''' ${provider}%0A` +
        `'''Source:''' ${sourceUrl}%0A` +
        `'''Artist:''' ${artistUrl}%0A` +
        (pageUrl ? `'''SAMBL URL:''' ${pageUrl}%0A` : '') +
        `%0A` +
        `'''SAMBL ${process.env.NEXT_PUBLIC_VERSION}''': ${process.env.NEXT_PUBLIC_URL || "https://sambl.lioncat6.com"} | https://github.com/lioncat6/SAMBL-React`
    );
}

function buildDeepSearchEditNote(data: DeepSearchSelection): string {
    const artist = data.data.mbArtists.find(artist => artist.id == data.mbid) || data.data.mbArtists[0];
    const sourceArtist = data.data.sourceArtist;


    function getTrackArtists(album: AlbumStack): PartialArtistObject[] {
        const [aggregatedAlbum, sourceAlbum, targetAlbum] = albumStack.unstack(album)
        const tracks = aggregatedAlbum?.mediums.flatMap(m => m.tracks) || [];
        const albumArtists = aggregatedAlbum?.albumArtists || [];
        const rawArtists = tracks?.flatMap(track => track.trackArtists) || [];
        const deDupedArtists = Array.from(new Set(rawArtists.map(artist => artist.id))).map(id => rawArtists.find(artist => artist.id === id)).filter(artist => artist).filter(artist => artist != undefined);
        if (deDupedArtists.every(artist => albumArtists.some(albumArtist => albumArtist.id === artist.id))) {
            return [];
        }
        return deDupedArtists;
    }

    function isMostCommon(): boolean {
        return artist.mostCommonMBID && data.data.mbArtists.filter(artist => artist.mostCommonMBID).length == 1;
    }

    function getMethod(): string {
        if (data.userSelected) {
            return 'Editor Selected'
        }
        if (artist.mostCommonMBID && data.data.mbArtists.filter(artist => artist.mostCommonMBID).length == 1) {
            return 'Most Common MBID';
        }
        return 'Name Similarity';
    }

    function formatArtist(dsArtist: ArtistObject) {
        const isSelected = dsArtist.id == artist.id;
        return `${isSelected ? `'''${dsArtist.name}'''` : `${dsArtist.name}`} ''(${dsArtist.url.url})''`
    }

    function getAlbumCount() {
        let count = 0
        data.data.albums.forEach((album) => {
            const [aggregatedAlbum, sourceAlbum, targetAlbum] = albumStack.unstack(album)
            if (targetAlbum?.albumArtists.some((aartist) => aartist.id == artist.id) || (data.trackArtists && getTrackArtists(album).some((tartist) => tartist.id == artist.id))) {
                count++;
            }
        })
        return count;
    }
    function generateAlbumCredits(album: AlbumStack) {
        const [aggregatedAlbum, sourceAlbum, targetAlbum] = albumStack.unstack(album)
        if (targetAlbum?.albumArtists && targetAlbum?.albumArtists.length > 0) {
            return ` • '''${aggregatedAlbum.name}''' ${aggregatedAlbum.upc ? `''Barcode: ${aggregatedAlbum.upc}'' ` : ''}${aggregatedAlbum.url.url}%0A` +
                `''Artists:'' ${targetAlbum?.albumArtists?.map(formatArtist).join(", ") || "none"}` +
                `${data.trackArtists ? `%0A''Track Artists:'' ${getTrackArtists(album).map(formatArtist).join(", ") || "none"}` : ""}`
        } else {
            return undefined
        }
    }

    return encode(
        `Artist matched with ''SAMBL Deep Search''%0A` +
        `'''Provider:''' ${data.data.provider}%0A` +
        `'''Albums (${getAlbumCount()}/${data.data.albums.length}):'''%0A` +
        `${data.data.albums.map(generateAlbumCredits).filter((text) => text != undefined)
            .join("%0A ")}%0A%0A` +
        `'''Selected Artist:''' ''${artist.name}'' | ${artist.url.url} %0A` +
        `'''Source Artist ''(${clientProviders.getDisplayName(sourceArtist.provider)})'':''' ''${sourceArtist.name}'' | ${sourceArtist.url.url}%0A` +
        `'''Name Similarity:''' ${text.truncateToTwo(artist.nameSimilarity * 100)}%%0A` +
        `'''Method:''' ${getMethod()}%0A` +
        `${artist.mostCommonMBID ? `'''Most Common MBID:''' ${isMostCommon() ? "Yes" : "Tie"} | ''${artist.occurrences} Occurrences''%0A` : ""}` +
        `%0A'''SAMBL ${process.env.NEXT_PUBLIC_VERSION}''': ${process.env.NEXT_PUBLIC_URL || "https://sambl.lioncat6.com"} | https://github.com/lioncat6/SAMBL-React`
    );
}

function buildSeedReleaseEditNote(data: AggregatedAlbum): string {
    return `Release seeded from ''SAMBL''\n` +
        `'''Provider:''' ${data.provider}\n` +
        `'''Source:''' ${data.url.url}\n` +
        (data.sourceArtist && `'''Artist:''' ${data.sourceArtist?.name || "Unknown"} | ${data.sourceArtist?.url.url || "Unknown"}\n\n`) +
        `'''SAMBL ${process.env.NEXT_PUBLIC_VERSION}''': ${process.env.NEXT_PUBLIC_URL || "https://sambl.lioncat6.com"} | https://github.com/lioncat6/SAMBL-React`
    ;
}

const editNoteBuilder = {
    buildEditNote,
    buildDeepSearchEditNote,
    buildSeedReleaseEditNote,
}

export default editNoteBuilder;