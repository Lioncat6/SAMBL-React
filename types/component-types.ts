import { AlbumObject, ArtistObject, ExternalUrlData, MediumObject, ProviderNamespace, TrackObject, UrlData, UrlType } from "./provider-types";
import { AggregatedAlbum, AggregatedArtist, AggregatedTrack, AlbumStack, AlbumMatch } from "./aggregated-types";
import { JSX } from "react";
import { SeederNamespace } from "./seeder-types";
import { DeepSearchData } from "./api-types";

export type searchReason = "artist" | "title";
export type albumSearchReason = searchReason | "track";

export interface DisplayAlbumStack extends AlbumStack {
    albums: DisplayAlbumMatch[];
}

export interface DisplayAlbum extends DisplayAlbumStack {
    searchReason?: albumSearchReason
    viewingAlbum?: boolean
}

export interface DisplayAlbumMatch extends AlbumMatch {
    album: DisplayAlbumObject
}

export interface DisplayAlbumObject extends AlbumObject {
    mediums: DisplayMedium[];
}

export interface DisplayMedium extends MediumObject {
    tracks: DisplayTrack[]
}

export interface DisplayTrack extends TrackObject {
    highlight?: boolean
    searchReason?: searchReason
}

export type listFilter = "showGreen" | "showBlue" | "showOrange" | "showRed" | "showVarious" | "onlyIssues" | "featuredAlbums"

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
    viewedAlbum?: AlbumStack | null
}

export type SearchBoxType = "search" | "find" | "lookup";

export class ProviderDisplay {
    name: string;
    namespace: ProviderNamespace;
    icon?: JSX.Element;
    hide?: boolean
}
export interface SAMBLSettings {
    enabledSeeders: SeederNamespace[];
    showExport: boolean;
    listVirtualization: boolean;
    quickFetchThreshold: number;
    currentProvider: ProviderNamespace | null;
    saveFilter: boolean
    saveSort: boolean
    currentFilter: Partial<FilterData> | null;
    targetBaseUrl: string;
    enableCoverArtSeeding: boolean;
    enableBulkUrlImport: boolean;
}

export class UrlParser {
    parseUrl: (url: string) => UrlData | null;
    createUrl: (urlType: UrlType, providerId: string, mbTypes?: number[], country?: string, sourceType?: UrlType) => ExternalUrlData
}

export class DeepSearchSelection {
    mbid: string
    userSelected: boolean
    trackArtists: boolean
    data: DeepSearchData
}

// Props
export type WithError = {
    error?: SAMBLError
}

export type ArtistPageProps = WithError & {
    artist?: ArtistPageData
}