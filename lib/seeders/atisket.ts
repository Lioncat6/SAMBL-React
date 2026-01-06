import { Seeder } from "./seeder-types";

function buildUrl(url: string, upc?: string | null): string {
    return `https://atisket.pulsewidth.org.uk/?url=${url}${upc ? `&upc=${upc}` : ""}`
}

const atisket: Seeder = {
    namespace: "atisket",
    displayName: "A-tisket",
    providers: ["spotify", "applemusic", "deezer"],
    buildUrl: buildUrl,
};

export default atisket;