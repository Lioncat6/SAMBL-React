import { AggregatedAlbum, AggregatedArtist } from "../utils/aggregated-types";

export class DisplayAlbum extends AggregatedAlbum {
    highlightTracks: boolean;
}

export class listFilterOption {
    id: number;
    name: string;
    key: string;
    exclusive?: boolean;
    default?: boolean;
}