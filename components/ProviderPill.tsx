import { useState, useEffect } from "react";
import { SAMBLSettingsContext, useSettings } from "./SettingsContext";
import styles from "../styles/ProviderPill.module.css";
import providerColors from '../styles/providerColors.module.css'
import { ProviderDisplay } from "../types/component-types";
import { ProviderNamespace } from "../types/provider-types";
import clientProviders from "../utils/clientProviders";

let providerArray = clientProviders.GetDisplayProviders();

//Remove disabled providers
providerArray = providerArray.filter((provider) => (!clientProviders.isDisabled(provider)));
//Remove pill hidden providers
providerArray = providerArray.filter((provider) => (!provider.hide));

function LoadingPill({ handleSelect }) {
    return (
        <div className={styles.ProviderPill} style={{ position: "absolute" }}>
            {providerArray.map((provider) => (
                <button
                    className={`${styles.provider} ${styles[provider.namespace]}`}
                    key={provider.namespace}
                    onClick={() => handleSelect(provider.namespace)}
                    title={provider.name}
                >
                    {provider.icon}
                </button>
            ))}
        </div>
    );
}

export default function ProviderPill() {
    const { settings, updateSettings, loading } = useSettings() as SAMBLSettingsContext;
    const [currentProvider, setCurrentProvider] = useState(null as ProviderNamespace | null);

    const handleSelect = (namespace: ProviderNamespace) => {
        setCurrentProvider(namespace);
        updateSettings({ currentProvider: namespace });
        document.cookie = `provider=${namespace}`;
    };

    useEffect(() => {
        if (!loading) {
            setCurrentProvider(settings.currentProvider);
			const params = new URLSearchParams(window.location.search);
			if (window.location.pathname === "/search" && params.has("provider")) {
				const providerParam = params.get("provider");
				if (providerArray.some((p) => p.namespace === providerParam)) {
					handleSelect(providerParam as ProviderNamespace);
				}
			}
        }
    }, [loading]);

    useEffect(() => {
        if (currentProvider) {
            document.cookie = `provider=${currentProvider}`;
        }
    }, [currentProvider]);

    if (loading || !settings || !currentProvider)
        return <LoadingPill handleSelect={handleSelect} />;

    const selectedIndex = providerArray.findIndex((p) => p.namespace === currentProvider);

    return (
        <div className={styles.ProviderPillContainer}>
            <div className={styles.ProviderPill} style={{ position: "absolute" }}>
                {providerArray.map((element) => (
                    <button
                        className={`${styles.provider} ${providerColors[element.namespace]} ${currentProvider === element.namespace ? styles.selected : ""}`}
                        key={element.namespace}
                        onClick={() => handleSelect(element.namespace)}
                        title={element.name}
                    >
                        {element.icon}
                    </button>
                ))}
                <div
                    className={`${styles.SelectedProvider} ${providerColors[currentProvider]}`}
                    style={{
                        left: `${4 + selectedIndex * 30}px`,
                    }}
                />
            </div>
        </div>
    );
}