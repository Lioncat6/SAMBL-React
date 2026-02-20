import { Seeder } from "../../types/seeder-types";

function buildUrl(url: string, upc?: string | null): string {
    return `https://seed.musichoarders.xyz/?identifier=${url}`
}

const met: Seeder = {
    namespace: "met",
    displayName: "MET",
    providers: ["spotify", "applemusic", "deezer", "tidal", "musicbrainz"],
    isDefault: true,
    buildUrl: buildUrl,
};

export default met;