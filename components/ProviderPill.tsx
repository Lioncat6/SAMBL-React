import { FaSpotify, FaDeezer, FaSoundcloud } from "react-icons/fa6";
import { SiTidal, SiBandcamp, SiApplemusic } from "react-icons/si";
import { useState, useEffect } from "react";
import { SAMBLSettingsContext, useSettings } from "./SettingsContext";
import styles from "../styles/ProviderPill.module.css";
import stylesb from "../styles/ProviderPill.module.scss";
import { ProviderDisplay } from "../types/component-types";
import { ProviderNamespace } from "../types/provider-types";
import clientProviders from "../utils/clientProviders";


let providerArray: ProviderDisplay[] = [
    { name: "Spotify", namespace: "spotify", icon: <FaSpotify /> },
    { name: "Apple Music", namespace: "applemusic", icon: <SiApplemusic /> },
    { name: "Deezer", namespace: "deezer", icon: <FaDeezer /> },
    { name: "Tidal", namespace: "tidal", icon: <SiTidal /> },
    { name: "Bandcamp", namespace: "bandcamp", icon: <SiBandcamp /> },
    { name: "SoundCloud", namespace: "soundcloud", icon: <FaSoundcloud /> },
];

//Remove disabled providers
providerArray = providerArray.filter((provider) => (!clientProviders.isDisabled(provider)));

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
        <div className={stylesb.ProviderPillContainer}>
            <div className={stylesb.ProviderPill}>

                <div
                    className={`${styles.SelectedProvider} ${styles[currentProvider]}`}
                    style={{
                        left: `${selectedIndex * 30}px`,
                    }}
                />

                {providerArray.map((element) => (
                    <button
                        className={`${styles.provider} ${styles[element.namespace]} ${currentProvider === element.namespace ? styles.selected : ""}`}
                        key={element.namespace}
                        onClick={() => handleSelect(element.namespace)}
                        title={element.name}
                    >
                        {element.icon}
                    </button>
                ))}

            </div>
        </div>
    );
}