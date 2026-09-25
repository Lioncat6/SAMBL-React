import { AggregatedAlbum, AlbumStack } from "../types/aggregated-types";
import { AlbumObject } from "../types/provider-types";

function unstack(stack: AlbumStack | undefined): ([AggregatedAlbum, AlbumObject | undefined, AlbumObject | undefined, AlbumObject[] | undefined])
function unstack(stack: undefined): ([undefined, undefined, undefined, undefined])
function unstack(stack: AlbumStack | undefined): ([AggregatedAlbum | undefined, AlbumObject | undefined, AlbumObject | undefined, AlbumObject[] | undefined]) {
    if (!stack) return [undefined, undefined, undefined, undefined]
    const aggregatedAlbum = stack.aggregated;
    const sourceAlbum = stack.albums.find((match) => match.type === "source")?.album;
    const targetAlbum = stack.albums.find((match) => match.type === "target")?.album;
    const providerAlbums = stack.albums.filter((match) => match.type === "provider").map(match => match.album);
    return [aggregatedAlbum, sourceAlbum, targetAlbum, providerAlbums]
}


const albumStack = {
    unstack
}

export default albumStack;