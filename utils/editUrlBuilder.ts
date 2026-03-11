import { DeepSearchData } from "../types/api-types";
import { ArtistObject, PartialArtistObject } from "../types/provider-types";
import editNoteBuilder from "./editNoteBuilder";

function buildAddArtistEditUrl(artist: PartialArtistObject): string{
    let editNote = editNoteBuilder.buildEditNote('Artist', artist.provider, artist.url.url, artist.url.url);
    let urls = "";
    artist.url.mbTypes.forEach((type, index)=> {
        urls = urls + `&edit-artist.url.${index}.text=${artist.url.url}&edit-artist.url.${index}.link_type_id=${type}`
    })
    return `https://musicbrainz.org/artist/create?edit-artist.name=${artist.name}&edit-artist.sort_name=${artist.name}${urls}&edit-artist.edit_note=${editNote}`
}

function buildDeepSearchEditUrl(data: DeepSearchData){
    let editNote = editNoteBuilder.buildDeepSearchEditNote(data);
    let urls = "";
    data.artist.url.mbTypes.forEach((type, index)=> {
        urls = urls + `&edit-artist.url.${index}.text=${data.artist.url.url}&edit-artist.url.${index}.link_type_id=${type}`
    })
    return `https://musicbrainz.org/artist/${data.mbid}/edit?${urls}&edit-artist.edit_note=${editNote}`
}

const editUrlBuilder = {
    buildAddArtistEditUrl,
    buildDeepSearchEditUrl
}

export default editUrlBuilder;