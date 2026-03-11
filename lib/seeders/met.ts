import { Seeder } from "../../types/seeder-types";
import parsers from "../parsers/parsers";

function generateFakeUrl(url){
    const id = parsers.getUrlInfo(url)?.id || "";
    return `https://www.qobuz.com/us-en/album/placeholder/${id}`
}

function buildUrl(url: string, upc?: string | null): string {
    return `https://seed.musichoarders.xyz/?identifier=${generateFakeUrl(url)}`
}

const met: Seeder = {
    namespace: "met",
    displayName: "MET",
    providers: ["spotify", "applemusic", "deezer", "tidal", "musicbrainz", "qobuz"],
    isDefault: true,
    buildUrl: buildUrl,
};

export default met;