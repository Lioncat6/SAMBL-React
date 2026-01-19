import { Seeder } from "./seeder-types";

function buildUrl(url: string, upc?: string | null): string {
    return `https://harmony.pulsewidth.org.uk/release?url=${url}${upc ? `&gtin=${upc}` : ""}&category=preferred`
}

const harmony: Seeder = {
    namespace: "harmony",
    displayName: "Harmony",
    providers: ["spotify", "applemusic", "deezer", "tidal", "bandcamp", "musicbrainz"],
    isDefault: true,
    buildUrl: buildUrl,
};

export default harmony;