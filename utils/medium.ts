import { MediumObject, TrackObject } from "../types/provider-types";

function convertTrackList(trackList: TrackObject[] | null): MediumObject[] {
    if (!trackList || trackList.length == 0) return [];
    return [{
        tracks: trackList,
        number: 1
    }];
}

const medium = {
    convertTrackList
}

export default medium;