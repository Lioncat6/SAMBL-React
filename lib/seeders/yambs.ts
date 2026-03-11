import { Seeder } from "../../types/seeder-types";

function buildUrl(url: string, upc?: string | null): string {
    return `https://yambs.erat.org/?url=${url}`
}

const yambs: Seeder = {
    namespace: "yambs",
    displayName: "yambs",
    providers: ["bandcamp", "qobuz", "tidal", "soundcloud"],
    isDefault: false,
    buildUrl: buildUrl,
};

export default yambs;