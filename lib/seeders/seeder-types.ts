import { ProviderNamespace } from "../../pages/api/providers/provider-types";
export type SeederNamespace = "met" | "harmony" | "atisket";

export class Seeder {
    namespace: SeederNamespace;
    displayName: string;
    providers: ProviderNamespace[]
    isDefault ?: boolean;
    buildUrl: (url: string, upc?: string | null) => string;
}