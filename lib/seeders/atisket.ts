import { Seeder } from "../../types/seeder-types";

// Atisket instances
// https://etc.marlonob.info/atisket/
// https://atisket.pulsewidth.org.uk

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