import { AggregatedAlbum } from "../../utils/aggregated-types"
import { ArtistObject, PartialArtistObject, ProviderNamespace } from "./providers/provider-types"

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

export class SearchedArtist extends ArtistObject {
    mbid?: string | null
}

export type ArtistSearchData = Record<string, SearchedArtist>

export class ApiError {
    error: string
    details?: string | null
}