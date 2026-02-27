import met from "./met";
import harmony from "./harmony";
import atisket from "./atisket";
import { Seeder, SeederNamespace } from "../../types/seeder-types";
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

/**
 * Gets a given list of seeders for a given list of providers
 */
function getSeeders(namespaces?: SeederNamespace[], providers?: ProviderNamespace[]): Seeder[] | null {
    if (namespaces) {
        return getAllSeeders(providers).filter((seeder) => namespaces.includes(seeder.namespace));
    } else {
        return seederList;
    }
}

/**
 * Gets all seeders for a given list of providers
 */
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
    getSeeders,
    getAllSeeders,
    getDefaultSeeders,
    getDefaultSeederNamespaces
}

export default seeders;