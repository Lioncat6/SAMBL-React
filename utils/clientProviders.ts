import { Provider } from "../types/provider-types";

function isDisabled(provider: Provider): boolean {
    const disabledProviders = process.env.NEXT_PUBLIC_DISABLED_PROVIDERS ? process.env.NEXT_PUBLIC_DISABLED_PROVIDERS.split(",").map(p => p.trim().toLowerCase()) : [];
    return disabledProviders.some((p) => (p === provider.namespace.toLowerCase()));
}

const clientProviders = {
    isDisabled
}

export default clientProviders;