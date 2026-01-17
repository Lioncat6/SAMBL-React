import { albumSearchReason, DisplayAlbum, FilterData, listFilter, listFilterOption, listSort, listSortOption } from "../components/component-types"
import { AlbumStatus } from "../utils/aggregated-types";

const listFilterOptions: listFilterOption[] = [
    { id: 1, name: 'Green', key: 'showGreen', default: true },
    { id: 2, name: 'Orange', key: 'showOrange', default: true },
    { id: 3, name: 'Red', key: 'showRed', default: true },
    { id: 4, name: 'Various Artists', key: 'showVarious' },
    { id: 5, name: 'Album Issues', key: 'onlyIssues', exclusive: true },
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
        return items.filter((item) => item.status != "green")
    },
    'showOrange': (items) => {
        return items.filter((item) => item.status != "orange")
    },
    'showRed': (items) => {
        return items.filter((item) => item.status != "red")
    },
    'showVarious': (items) => {
        return items.filter((item) => item.albumArtists.some((artist) => !variousArtistsList.includes(artist.name)))
    },
    'onlyIssues': (items) => {
        return items.filter((item) => item.albumIssues.length > 0)
    }
}

function getIntTime(dateStr: string | null): number {
    const date = new Date(dateStr || "");
    return isNaN(date.getTime()) ? 0 : date.getTime();
}

const statusSortOrder: AlbumStatus[] = ["red", "orange", "blue", "green"]

const SortFunctions: Record<listSort, (items: DisplayAlbum[], ascending: boolean) => DisplayAlbum[]> = {
    'count': (items, ascending) => {
        return items.sort((a, b) => ascending ? (a.trackCount || 0) - (b.trackCount || 0) : (b.trackCount || 0) - (a.trackCount || 0))
    },
    'date': (items, ascending) => {
        return items.sort((a, b) => ascending ? (getIntTime(a.releaseDate)) - (getIntTime(b.releaseDate)) : (getIntTime(b.releaseDate)) - (getIntTime(a.releaseDate)))
    },
    'name': (items, ascending) => {
        return items.sort((a, b) => ascending ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name))
    },
    'status': (items, ascending) => {
        return items.sort((a, b) => {
            const indexA = statusSortOrder.indexOf(a.status);
            const indexB = statusSortOrder.indexOf(b.status);
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
                const matchesTitle = item.name.toLowerCase().includes(lowerCaseQuery);
                let matchesArtist: boolean = false;
                if (!matchesTitle) {
                    matchesArtist = item.artistNames.some((artist) => 
                        artist.toLocaleLowerCase().includes(lowerCaseQuery)
                    )
                }
                let matchesTrack: boolean = false
                let matchingTracks: number[] = []
                // If we can't find a title or artist match
                if (!(matchesTitle || matchesArtist)) {
                    const useAggregatedTracks = item.aggregatedTracks?.length > 0
                    const useMBTracks = item.mbAlbum?.albumTracks?.length == item.trackCount
                    const mbTracks = item.mbAlbum?.albumTracks
                    let itemTracks = useAggregatedTracks ? item.aggregatedTracks : useMBTracks ? mbTracks : item.albumTracks
                    itemTracks?.forEach((track) => {
                        if (track.name.toLocaleLowerCase().includes(lowerCaseQuery)) {
                            console.log("match")
                            matchesTrack = true;
                            if (track.trackNumber) matchingTracks.push(track.trackNumber);
                        }
                        //TODO track artist search
                    })
                    // Tell tracks to highlight
                    if (useAggregatedTracks && matchesTrack && matchingTracks.length > 0) {
                        item.aggregatedTracks.forEach((track) => {
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