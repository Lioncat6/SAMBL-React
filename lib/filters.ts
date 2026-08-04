import { albumSearchReason, DisplayAlbum, DisplayTrack, FilterData, listFilter, listFilterOption, listSort, listSortOption } from "../types/component-types"
import { AggregatedAlbum, AlbumStatus } from "../types/aggregated-types";
import { AlbumObject } from "../types/provider-types";

const listFilterOptions: listFilterOption[] = [
    { id: 1, name: 'Green', key: 'showGreen', default: true },
    { id: 2, name: 'Blue', key: 'showBlue', default: true},
    { id: 3, name: 'Orange', key: 'showOrange', default: true },
    { id: 4, name: 'Red', key: 'showRed', default: true },
    { id: 5, name: 'Various Artists', key: 'showVarious', default: true },
    { id: 6, name: 'Album Issues', key: 'onlyIssues', exclusive: true },
    { id: 7, name: 'Featured Albums', key: 'featuredAlbums',exclusive: true}
]

const listSortOptions: listSortOption[] = [
    { id: 1, name: 'Name', key: 'name' },
    { id: 3, name: 'Release Date', key: 'date', default: true },
    { id: 2, name: 'Status', key: 'status' },
    { id: 4, name: 'Track Count', key: 'count' }
]

const variousArtistsList = ["Various Artists", "Artistes Variés", "Verschiedene Künstler", "Varios Artistas", "ヴァリアス・アーティスト"];

const FilterFunctions: Record<listFilter, (items: DisplayAlbum[]) => DisplayAlbum[]> = {
    // These functions are only called when the filter is not selected, with the exception of exclusive filters
    'showGreen': (items) => {
        return items.filter((item) => item.albumGroup.status != "green")
    },
    'showBlue': (items) => {
        return items.filter((item) => item.albumGroup.status != "blue")
    },
    'showOrange': (items) => {
        return items.filter((item) => item.albumGroup.status != "orange")
    },
    'showRed': (items) => {
        return items.filter((item) => item.albumGroup.status != "red")
    },
    'showVarious': (items) => {
        return items.filter((item) => item.albumGroup.aggregated.albumArtists.some((artist) => !variousArtistsList.includes(artist.name)))
    },
    'onlyIssues': (items) => {
        return items.filter((item) => item.albumGroup.albumIssues.length > 0)
    },
    'featuredAlbums': (items) => {
        return items.filter((item) => (item.albumGroup.aggregated.sourceArtist?.id && !item.albumGroup.aggregated.albumArtists.map((artist) => artist.id).includes(item.albumGroup.aggregated.sourceArtist.id)))
    }
}

function getIntTime(dateStr: string | null): number {
    const date = new Date(dateStr || "");
    return isNaN(date.getTime()) ? 0 : date.getTime();
}

const statusSortOrder: AlbumStatus[] = ["red", "orange", "blue", "green"]

const SortFunctions: Record<listSort, (items: DisplayAlbum[], ascending: boolean) => DisplayAlbum[]> = {
    'count': (items, ascending) => {
        return items.sort((a, b) => ascending ? (a.albumGroup.aggregated.trackCount || 0) - (b.albumGroup.aggregated.trackCount || 0) : (b.albumGroup.aggregated.trackCount || 0) - (a.albumGroup.aggregated.trackCount || 0))
    },
    'date': (items, ascending) => {
        return items.sort((a, b) => ascending ? (getIntTime(a.albumGroup.aggregated.releaseDate)) - (getIntTime(b.albumGroup.aggregated.releaseDate)) : (getIntTime(b.albumGroup.aggregated.releaseDate)) - (getIntTime(a.albumGroup.aggregated.releaseDate)))
    },
    'name': (items, ascending) => {
        return items.sort((a, b) => ascending ? a.albumGroup.aggregated.name.localeCompare(b.albumGroup.aggregated.name) : b.albumGroup.aggregated.name.localeCompare(a.albumGroup.aggregated.name))
    },
    'status': (items, ascending) => {
        return items.sort((a, b) => {
            const indexA = statusSortOrder.indexOf(a.albumGroup.status);
            const indexB = statusSortOrder.indexOf(b.albumGroup.status);
            return ascending ? indexA - indexB : indexB - indexA;
        });
    },
}

function filterItems(items: DisplayAlbum[], filterSettings: FilterData): DisplayAlbum[] {
    // Apply filters
    let filteredItems: DisplayAlbum[] = items;
    for (const filter of listFilterOptions) {
        if ((filterSettings.filters.includes(filter.key) && filter.exclusive) || !filterSettings.filters.includes(filter.key) && !filter.exclusive) {
            filteredItems = FilterFunctions[filter.key](filteredItems);
        }
    }
    filteredItems = SortFunctions[filterSettings.sort](filteredItems, filterSettings.ascending);
    return filteredItems;
}

function searchItems(items: DisplayAlbum[], query: string): DisplayAlbum[] {
    let updatedItems = items;
    if (query.trim() !== "") {
        const lowerCaseQuery = query.toLowerCase().trim();
        updatedItems = updatedItems
            .map((item) => {
                const matchesTitle = item.albumGroup.aggregated.name.toLowerCase().includes(lowerCaseQuery);
                let matchesArtist: boolean = false;
                if (!matchesTitle && item.albumGroup.aggregated.artistNames) {
                    let artistArray = Array.isArray(item.albumGroup.aggregated.artistNames) ? item.albumGroup.aggregated.artistNames : [item.albumGroup.aggregated.artistNames]
                    matchesArtist = artistArray.some((artist) => 
                        artist.toLocaleLowerCase().includes(lowerCaseQuery)
                    )
                }
                let matchesTrack: boolean = false
                let matchingTracks: number[] = []
                // If we can't find a title or artist match
                if (!(matchesTitle || matchesArtist)) {
                    const sourceAlbum = item.albumGroup.albums.find((albumMatch) => albumMatch.type === "source")?.album as AlbumObject | null;
                    const aggregatedTracks = item.albumGroup.aggregated.mediums.flatMap((medium) => medium.tracks);
                    const sourceTracks = sourceAlbum?.mediums.flatMap((medium) => medium.tracks) || [];
                    const useAggregatedTracks = aggregatedTracks.length > 0
                    const targetAlbum = item.albumGroup.albums.find((albumMatch) => albumMatch.type === "target")?.album as AggregatedAlbum | null;
                    const useMBTracks = targetAlbum?.mediums.flatMap((medium) => medium.tracks)?.length == item.albumGroup.aggregated.trackCount
                    const mbTracks = targetAlbum?.mediums.flatMap((medium) => medium.tracks)
                    let itemTracks = useAggregatedTracks ? aggregatedTracks : useMBTracks ? mbTracks : sourceTracks as DisplayTrack[]
                    itemTracks?.forEach((track) => {
                        if (track.name?.toLocaleLowerCase().includes(lowerCaseQuery)) {
                            matchesTrack = true;
                            if (track.trackNumber) matchingTracks.push(track.trackNumber);
                        }
                        //TODO track artist search
                    })
                    // Tell tracks to highlight
                    if (useAggregatedTracks && matchesTrack && matchingTracks.length > 0) {
                        (aggregatedTracks as DisplayTrack[])?.forEach((track) => {
                            if (track.trackNumber && matchingTracks.includes(track.trackNumber)) {
                                track.highlight = true;
                                track.searchReason = "title";
                            }
                        })
                    }
                }
                const searchReason = matchesTitle ? "title" as albumSearchReason : matchesArtist ? "artist" : matchesTrack ? "track" : undefined
                return {
                    ...item,
                    searchReason
                };
            })
            .filter((item) => item.searchReason);
    }
    return updatedItems
}

function getFilters(selectedFilters?: listFilter[]): listFilterOption[] {
    if (selectedFilters) {
        return listFilterOptions.filter((filter) => selectedFilters.includes(filter.key));
    } else {
        return listFilterOptions;
    }
}
function getSorters(selectedSorter?: null | undefined): listSortOption[];
function getSorters(selectedSorter?: listSort): listSortOption;
function getSorters(selectedSorter?: listSort | null | undefined): listSortOption[] | listSortOption | undefined {
    if (selectedSorter) {
        return listSortOptions.find((sorter) => sorter.key == selectedSorter) || listSortOptions.find((sorter) => sorter.default) || listSortOptions[0]
    } else {
        return listSortOptions;
    }
}

function getDefaultFilters(): listFilterOption[] {
    return listFilterOptions.filter((option) => option.default);
}

function getDefaultSort() {
    return listSortOptions.find((option) => option.default) || listSortOption[0];
}

function getDefaultOptions(): FilterData {
    return {
        filters: getDefaultFilters().map((option) => option.key),
        sort: getDefaultSort()?.key,
        ascending: false
    }
}

const filters = {
    filterItems,
    getFilters,
    getSorters,
    getDefaultFilters,
    getDefaultSort,
    getDefaultOptions,
    searchItems
}

export default filters;