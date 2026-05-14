export interface SubvertAlbumRoot {
    
}

export interface SubvertSearchAlbum {
  id: string
  name: string
  slug: string
  description?: string
  coverImageId: string
  releaseDate?: string
  releaseType: string
  genre: SubvertGenre[]
  priceCents: number
  memberPriceCents: number
  isExclusive: boolean
  exclusiveUntilDate: any
  isDownloadAllowed: boolean
  isStreamingAllowed: boolean
  artistDisplayName: any
  createdAt: string
  updatedAt: string
  artists: SubvertSearchAlbumArtist[]
  tracks: SubvertSearchAlbumTrackPosition[]
  _count: SubvertTrackCount
  genres: string[]
}

export interface SubvertGenre {
  name: string
}

export interface SubvertTrackCount {  
    tracks: number
}

export interface SubvertSearchAlbumArtist {
  id: string
  name: string
  slug: string
  profileImageId: string
}

export interface SubvertAlbum {
  id: string
  name: string
  slug: string
  artistDisplayName: any
  coverImageId: string
  description: string
  isPublic: boolean
  releaseType: string
  releaseDate: string
  originalReleaseDate: any
  genres: string[]
  credits: SubvertCredit[]
  links: SubvertLink[]
  publisher: any
  license: string
  priceCents: number
  memberPriceCents: number
  isStreamingAllowed: boolean
  isDownloadAllowed: boolean
  isOverpayAllowed: boolean
  isUnlimitedMemberStreaming: boolean
  isFreeMemberDownload: boolean
  productIdUpcEan: any
  isExclusive: boolean
  exclusiveUntilDate: any
  isRightsOrganizationRegistered: boolean
  publishingPrimaryRightsOrganization: any
  labelsOnReleases: SubvertLabelOnRelease[]
  artists: SubvertAlbumArtist[]
  tracks: SubvertAlbumTrackPosition[]
}

export interface SubvertLabelOnRelease {
  label: SubvertLabel
  catalogNumber: string
}

export interface SubvertLabel {
  id: string
  name: string
}

export interface SubvertAlbumArtist extends SubvertSearchAlbumArtist {
  isApproved: boolean
}

export interface SubvertTrackPosition {
    trackNumber: number
}

export interface SubvertAlbumTrackPosition extends SubvertTrackPosition {
  track: SubvertAlbumTrack
}

export interface SubvertSearchAlbumTrackPosition extends SubvertTrackPosition {
  track: SubvertSearchAlbumTrack
}

export interface SubvertSearchAlbumTrack {
  id: string
  name: string
  slug: string
  duration?: number
  coverImageId?: string
  audioId: string
  isStreamingAllowed: boolean
  audio: SubvertSearchAlbumAudio
}

export interface SubvertSearchAlbumAudio {
  originalCodec: string
}

export interface SubvertAlbumTrack extends SubvertSearchAlbumTrack {
  artistDisplayName: any
  key: string
  bpm: string
  genres: string[]
  credits: SubvertCredit[]
  links: any[]
  releaseDate: string
  isrc: string
  iswc: string
  publisher: any
  license: string
  priceCents: number
  memberPriceCents: number
  isDownloadAllowed: boolean
  isOverpayAllowed: boolean
  isUnlimitedMemberStreaming: boolean
  isFreeMemberDownload: boolean
  isExplicit: boolean
  isExclusive: boolean
  exclusiveUntilDate: any
  lyrics: string
  isRightsOrganizationRegistered: boolean
  publishingPrimaryRightsOrganization: any
  audio: SubvertAudio
}

export interface SubvertAudio extends SubvertSearchAlbumAudio {
  originalBitrate: number
  originalSampleRate: number
  originalBitDepth: number
  availableVariants: string[]
  variantMetadata: VariantMetadata
  duration: number
}

export interface VariantMetadata {
  flac?: SubvertAudioMeta
  stream: SubvertAudioMeta
  mp3_320?: SubvertAudioMeta
}

export interface SubvertAudioMeta {
    fileSize: number
    createdAt: string
}

export interface SubvertPagination {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export type SubvertSearchEntityType = 'artist' | 'release' | 'track' | 'genre'

export interface SubvertSearchResults {
  results: SubvertSearchResult[]
  meta: SubvertSearchMeta
}

export interface SubvertSearchMeta {
  query: string
  mode: string
  domains: SubvertSearchEntityType[]
  totalCount: number
  domainCounts: SubvertDomainCounts
  offset: number
  limit: number
  hasMore: boolean
}

export interface SubvertDomainCounts {
  release: number
  artist: number
  track: number
  genre: number
}

export interface SubvertSearchResult {
  id: string
  type: SubvertSearchEntityType
  name: string
  slug: string
  artistSlug?: string
  subtitle: string
  imageId?: string
  matchReason: string
  metadata: SubvertSearchMetadata
}

export interface SubvertSearchMetadata {
  isDownloadAllowed?: boolean
  isStreamingAllowed?: boolean
  isExplicit?: boolean
  duration?: number
  releaseDate?: string
  genres?: string[]
  priceCents?: number
  memberPriceCents?: number
  artistDisplayName: any
  createdAt: string
  audio?: SubvertSearchAlbumAudio
  release?: SubvertRelease
  itemCount?: number
  trackCount?: number
  releaseCount?: number
  artistCount?: number
  collectionCount?: number
  location1?: string
  location2?: string
  location3?: string
  isLocationPublic?: boolean
  releaseType?: string
  tracks?: SubvertSearchAlbumTrackPosition[]
}

export interface SubvertRelease {
  id: string
  name: string
  slug: string
  releaseDate: string
}

export interface SubvertArtistProfile {
  id: string
  name: string
  slug: string
  description: string
  location1: string
  location2: string
  location3: string
  isLocationPublic: boolean
  links: SubvertLink[]
  isPublic: boolean
  genres: string[]
  profileImageId: string
  bannerImageId: string
  customColorBg: string
  customColorHighlight: string
  customColorText: string
}

export interface SubvertLink {
  link: string
  displayText: string
}

export interface SubvertCredit {
  name: string
  role: string
}