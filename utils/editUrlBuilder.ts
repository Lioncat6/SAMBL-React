import { useEffect } from "react";
import { useSettings, useSettingsOrDefaults } from "../components/SettingsContext";
import { AggregatedAlbum, AggregatedTrack, AlbumStack } from "../types/aggregated-types";
import { DeepSearchSelection } from "../types/component-types";
import { ArtistObject, PartialArtistObject, ProviderNamespace, TrackObject } from "../types/provider-types";
import albumStack from "./albumStack";
import editNoteBuilder from "./editNoteBuilder";

function buildAddArtistEditUrl(artist: PartialArtistObject, targetBaseUrl: string): string {
    let editNote = editNoteBuilder.buildEditNote('Artist', artist.provider, artist.url.url, artist.url.url);
    let urls = "";
    artist.url.mbTypes.forEach((type, index) => {
        urls = urls + `&edit-artist.url.${index}.text=${artist.url.url}&edit-artist.url.${index}.link_type_id=${type}`
    })
    return `https://${targetBaseUrl}/artist/create?edit-artist.name=${encodeURIComponent(artist.name)}&edit-artist.sort_name=${encodeURIComponent(artist.name)}${urls}&edit-artist.edit_note=${editNote}`
}

function buildDeepSearchEditUrl(data: DeepSearchSelection, targetBaseUrl: string): string {
    let editNote = editNoteBuilder.buildDeepSearchEditNote(data);
    let urls = "";
    data.data.sourceArtist.url.mbTypes.forEach((type, index) => {
        urls = urls + `&edit-artist.url.${index}.text=${data.data.sourceArtist.url.url}&edit-artist.url.${index}.link_type_id=${type}`
    })
    return `https://${targetBaseUrl}/artist/${data.mbid}/edit?${urls}&edit-artist.edit_note=${editNote}`
}

function buildISRCEditUrl(data: AlbumStack): string | null {
    const [aggregatedAlbum, sourceAlbum, targetAlbum] = albumStack.unstack(data)
    const { id, url, releaseDate, trackCount, mbid, provider, albumArtists } = aggregatedAlbum;
    const albumTracks = sourceAlbum?.mediums.flatMap((medium) => medium.tracks) || [];
    if (albumTracks.some((track) => track.isrcs.length >= 1)) {
        const edit_note = editNoteBuilder.buildEditNote("ISRCs", provider, url.url, albumArtists[0]?.url.url);
        let params = "?"
        albumTracks.forEach((track) => {
            if (track.isrcs.length >= 1) {
                params += `isrc${track.trackNumber}=${track.isrcs[0]}&`
            }
        })
        params += "mbid=" + mbid
        params += "&edit-note=" + edit_note;
        const ISRCurl = "https://magicisrc.kepstin.ca/" + params;
        return ISRCurl
    } else {
        return null;
    }
}

function buildCoverArtSeedUrl(data: AlbumStack, orgin: string, targetBaseUrl: string): string | null {
    const [aggregatedAlbum, sourceAlbum, targetAlbum] = albumStack.unstack(data);
    const albumUrlParameter = "x_seed.image.0.url";
    const imageUrlParameter = "x_seed.image.0.url"
    const orginUrlParameter = "x_seed.origin";
    const supportedProviders: ProviderNamespace[] = ['applemusic', 'bandcamp', 'deezer', 'discogs', 'musicbrainz', 'qobuz', 'soundcloud', 'spotify', 'tidal'];
    const fallbackImageUrl = aggregatedAlbum.imageUrl ?? aggregatedAlbum.imageUrlSmall;
    if (!aggregatedAlbum.mbid) return null;
    const baseUrl = new URL(`https://${targetBaseUrl}/release/${aggregatedAlbum.mbid}/add-cover-art`)
    if (supportedProviders.includes(aggregatedAlbum.provider)) {
        baseUrl.searchParams.append(albumUrlParameter, aggregatedAlbum.url.url)
    } else if (fallbackImageUrl) {
        baseUrl.searchParams.append(imageUrlParameter, fallbackImageUrl)
    } else {
        return null;
    }
    baseUrl.searchParams.append(orginUrlParameter, `SAMBL ${process.env.NEXT_PUBLIC_VERSION ? process.env.NEXT_PUBLIC_VERSION : ''} at ${orgin}`);
    return baseUrl.toString().replace(/%250A/g, '%0A');
}

function buildArtistImageSeedUrl(artist: ArtistObject, targetBaseUrl: string): string | null {
    const { mbid, imageUrl, imageUrlSmall } = artist;
    const sourceImage = imageUrl ?? imageUrlSmall;
    if (!mbid || !sourceImage) return null;
    const baseUrl = new URL(`https://${targetBaseUrl}/artist/${mbid}/edit`)
    let editNote = editNoteBuilder.buildEditNote('Artist image', artist.provider, sourceImage, artist.url.url, null, false);
    //edit-artist.url.0.text=&edit-artist.url.0.link_type_id=173&edit-artist.edit_note=${editNote}
    baseUrl.searchParams.append('edit-artist.url.0.text', `https://web.archive.org/web/0/${imageUrl}`);
    baseUrl.searchParams.append('edit-artist.url.0.link_type_id', "173");
    baseUrl.searchParams.append('edit-artist.edit_note', editNote);
    return baseUrl.toString().replace(/%250A/g, '%0A');
}

function buildRecordingUrlSeedUrl(recording: TrackObject, album: AlbumStack, targetBaseUrl: string): string | null {
    const [aggregatedAlbum, sourceAlbum, targetAlbum] = albumStack.unstack(album);
    const { mbid, url, provider } = recording;
    if (!mbid || !url || url.mbTypes.length == 0 || !targetAlbum) return null;
    const baseUrl = new URL(`https://${targetBaseUrl}/recording/${mbid}/edit`);
    let editNode = editNoteBuilder.buildRecordingSeedEditNote(provider, aggregatedAlbum.name, targetAlbum.url.url, aggregatedAlbum.url.url, false);
    for (const typeIndex in url.mbTypes) {
        baseUrl.searchParams.append(`edit-recording.url.${typeIndex}.text`, url.url)
        baseUrl.searchParams.append(`edit-recording.url.${typeIndex}.link_type_id`, url.mbTypes[typeIndex].toString())
    }
    baseUrl.searchParams.append('edit-recording.edit_note', editNode)
    return baseUrl.toString().replace(/%250A/g, '%0A');
}

//https://github.com/rinsuki/userscripts/blob/master/scripts/_groups/musicbrainz/mb-seed-urls-to-release-recordings/src/schema.ts
class mbSeedUrlsToReleaseRecordingsSchema {
    version: 2 //       \/ Recording ID
    recordings: Map<string, [{
        url: string // Something about not having duplicate domanins
        types: string[]
        ended?: boolean
    }]>
    note: string
}

function buildBulkRecordingUrlSeedUrl(album: AlbumStack, targetBaseUrl: string): string | null {
    const urlParam = 'seed-urls-v1';
    const [aggregatedAlbum, sourceAlbum, targetAlbum] = albumStack.unstack(album);
    const tracks = aggregatedAlbum.mediums.flatMap(medium => medium.tracks);
    const {mbid} = aggregatedAlbum;
    if (!targetAlbum || tracks.length == 0 || !mbid) return null;
    let editNode = editNoteBuilder.buildRecordingSeedEditNote(aggregatedAlbum.provider, aggregatedAlbum.name, targetAlbum.url.url, aggregatedAlbum.url.url, false, '\n');
    let recordings: mbSeedUrlsToReleaseRecordingsSchema["recordings"] = new Map();
    for (const track of tracks) {
        console.log(track)
        const url = track.url?.url;
        const types = track.url?.mbTypes;
        if (types && url && types.length > 0 && track.mbid) {
            console.log([{url, types: types.map(type => type.toString())}])
            recordings.set(track.mbid, [{url, types: types.map(type => type.toString())}]);
        }
    }
    console.log(recordings)
    const seedUrlsHash: mbSeedUrlsToReleaseRecordingsSchema = {
        version: 2,
        recordings,
        note: editNode
    }
    const baseUrl = new URL(`https://${targetBaseUrl}/release/${mbid}/edit-relationships`);
    baseUrl.hash = `${urlParam}=${encodeURIComponent(JSON.stringify({...seedUrlsHash, recordings: Object.fromEntries(recordings)}))}`
    return baseUrl.toString();
}

const editUrlBuilder = {
    buildAddArtistEditUrl,
    buildDeepSearchEditUrl,
    buildISRCEditUrl,
    buildCoverArtSeedUrl,
    buildArtistImageSeedUrl,
    buildRecordingUrlSeedUrl,
    buildBulkRecordingUrlSeedUrl
}

export default editUrlBuilder;