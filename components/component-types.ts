import { AggregatedAlbum, AggregatedArtist, AggregatedTrack } from "../utils/aggregated-types";

export type searchReason = "artist" | "title";
export type albumSearchReason = searchReason | "track";
export class DisplayAlbum extends AggregatedAlbum {
    searchReason?: albumSearchReason
    override aggregatedTracks: DisplayTrack[];
}

export class DisplayTrack extends AggregatedTrack {
    highlight?: boolean
    searchReason?: searchReason
}

export type listFilter = "showGreen" | "showOrange" | "showRed" | "showVarious" | "onlyIssues" | "featuredAlbums"

export type listSort = "name" | "date" | "status" | "count"

export class listFilterBase {
    id: number;
    name: string;
    exclusive?: boolean;
    default?: boolean;
}
export class listFilterOption extends listFilterBase {
    key: listFilter
}

export class listSortOption extends listFilterBase {
    key: listSort
}

export class FilterData {
    filters: listFilter[]
    sort: listSort
    ascending: boolean
}