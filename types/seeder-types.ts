import { ProviderNamespace } from "./provider-types";
export type SeederNamespace = "met" | "harmony" | "atisket" | "yambs" | "sambl";

export class Seeder {
    namespace: SeederNamespace;
    displayName: string;
    providers: ProviderNamespace[]
    isDefault ?: boolean;
    buildUrl: (url: string, upc?: string | null) => string;
}