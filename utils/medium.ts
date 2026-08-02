import { AggregatedMedium, AggregatedTrack } from "../types/aggregated-types";
import { MediumObject, TrackObject } from "../types/provider-types";

function convertTrackList(trackList: TrackObject[] | null): MediumObject[]
function convertTrackList(trackList: AggregatedTrack[] | null): AggregatedMedium[]
function convertTrackList(trackList: TrackObject[] | AggregatedTrack[] | null): MediumObject[] | AggregatedMedium[] {
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