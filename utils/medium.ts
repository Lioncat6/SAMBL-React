import { AggregatedMedium, AggregatedTrack } from "../types/aggregated-types";
import { MediumFormat, MediumObject, TrackObject } from "../types/provider-types";

function convertTrackList(trackList: TrackObject[] | null, format: MediumFormat): MediumObject[]
function convertTrackList(trackList: AggregatedTrack[] | null, format: MediumFormat): AggregatedMedium[]
function convertTrackList(trackList: TrackObject[] | AggregatedTrack[] | null, format: MediumFormat): MediumObject[] | AggregatedMedium[] {
    if (!trackList || trackList.length == 0) return [];
    return [{
        tracks: trackList,
        number: 1,
        format
    }];
}

const medium = {
    convertTrackList
}

export default medium;