import met from "./met";
import harmony from "./harmony";
import atisket from "./atisket";
import { Seeder, SeederNamespace } from "./seeder-types";
import { ProviderNamespace } from "../../types/provider-types";

export const seederList: Seeder[] = [
    met,
    harmony,
    atisket,
];

function getSeeder(namespace: SeederNamespace, providers?: ProviderNamespace[]): Seeder | null {
    for (const seeder of seederList) {
        if (seeder.namespace === namespace) {
            const supportedProviders = seeder.providers;
            if (providers) {
                const hasSupportedProvider = providers.some(provider => supportedProviders.includes(provider));
                if (!hasSupportedProvider) {
                    return null;
                }
            }
            return seeder;
        }
    }
    return null;
}

function getAllSeeders(providers?: ProviderNamespace[]): Seeder[] {
    if (!providers) {
        return seederList;
    }
    return seederList.filter(seeder => {
        const supportedProviders = seeder.providers;
        return providers.some(provider => supportedProviders.includes(provider));
    });
}

function getDefaultSeeders(providers?: ProviderNamespace[]): Seeder[] {
    return getAllSeeders(providers).filter(seeder => seeder.isDefault);
}

function getDefaultSeederNamespaces(providers?: ProviderNamespace[]): SeederNamespace[] {
    return getDefaultSeeders(providers).map(seeder => seeder.namespace);
}

const seeders = {
    getSeeder,
    getAllSeeders,
    getDefaultSeeders,
    getDefaultSeederNamespaces
}

export default seeders;