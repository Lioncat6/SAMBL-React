import { AggregatedAlbum, AggregatedArtist } from "./aggregated-types"
import { AlbumObject, ArtistObject, PartialArtistObject, ProviderNamespace, TrackObject } from "./provider-types"

export type DeepSearchMethod = "most_common" | "name_similarity"
export class DeepSearchData {
    provider: ProviderNamespace
    mbid: string
    nameSimilarity: number
    sourceName: string
    mbName: string
    method: DeepSearchMethod
    mostCommonMbid: string
    artists: PartialArtistObject[]
    albums: AggregatedAlbum[] 
}

export class ArtistData {
    providerData: ArtistObject
    mbData?: ArtistObject | null
}

export class ArtistLookupData {
    mbid?: string | null
    provider: ProviderNamespace
    provider_id: string
}

export type ArtistSearchData = Record<string, AggregatedArtist>

export class SAMBLApiError {
    error: string
    details?: string | null
    parameters?: string[]
    url?: string
    provider?: ProviderNamespace
}

export class FindData {
    type: 'UPC' | 'ISRC'
    data: AlbumObject[] | TrackObject[]
    issues: SAMBLApiError[]
}

export class ISRCData {
    isrcs: string[]
}

export class UPCData {
    upcs: string[]
}