import { ArtistObject, ProviderNamespace, UrlData, UrlType } from "./provider-types";
import { AggregatedAlbum, AggregatedArtist, AggregatedTrack } from "./aggregated-types";
import { JSX } from "react";
import { SeederNamespace } from "./seeder-types";

export type searchReason = "artist" | "title";
export type albumSearchReason = searchReason | "track";
export class DisplayAlbum extends AggregatedAlbum {
    searchReason?: albumSearchReason
    override aggregatedTracks: DisplayTrack[];
    viewingAlbum?: boolean
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

export type errorType = "parameter" | "provider" | "timeout" | "general" | "fetch"

export class SAMBLError {
    type: errorType
    message?: string | null
    code?: string | null
    url?: string | null
    provider?: ProviderNamespace | null
    parameters?: string[] | null
}

export class ArtistPageData extends AggregatedArtist {
    ids?: string[] | null;
    mbids?: string[] | null;
    urls?: string[] | null;
    names?: string[] | null;
    mbData?: ArtistObject | null;
    viewingAlbum?: string | null;
    viewedAlbum?: AggregatedAlbum | null
}

export type SearchBoxType = "search" | "find";

export class ProviderDisplay {
    name: string;
    namespace: ProviderNamespace;
    icon: JSX.Element;
}
export interface SAMBLSettings {
    enabledSeeders: SeederNamespace[];
    showExport: boolean;
    listVirtualization: boolean;
    quickFetchThreshold: number;
    currentProvider: ProviderNamespace | null;
    saveFilter: boolean
    saveSort: boolean
    currentFilter: Partial<FilterData> | null
}

export class UrlParser {
    parseUrl: (url: string) => UrlData | null;
    createUrl: (urlType: UrlType, providerId: string, country?: string)=> string | null
}