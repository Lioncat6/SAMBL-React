import { Seeder } from "../../types/seeder-types";

// Atisket instances
// https://etc.marlonob.info/atisket/
// https://atisket.pulsewidth.org.uk

function buildUrl(url: string, upc?: string | null): string {
    return `/seed?url=${url}`
}

const sambl: Seeder = {
    namespace: "sambl",
    displayName: "SAMBL",
    providers: ['soundcloud', 'naver', 'volumo', 'musixmatch'],
    buildUrl: buildUrl,
    isDefault: true
};

export default sambl;