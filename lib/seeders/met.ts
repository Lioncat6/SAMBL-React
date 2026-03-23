import { Seeder } from "../../types/seeder-types";
import parsers from "../parsers/parsers";

function getUrl(url: string){
    const urlInfo = parsers.getUrlInfo(url);
    if (urlInfo?.provider == "qobuz"){
        return `https://www.qobuz.com/us-en/album/placeholder/${urlInfo.id}`
    }
    return url;
}

function buildUrl(url: string, upc?: string | null): string {
    return `https://seed.musichoarders.xyz/?identifier=${getUrl(url)}`
}

const met: Seeder = {
    namespace: "met",
    displayName: "MET",
    providers: ["spotify", "applemusic", "deezer", "tidal", "musicbrainz", "qobuz"],
    isDefault: true,
    buildUrl: buildUrl,
};

export default met;