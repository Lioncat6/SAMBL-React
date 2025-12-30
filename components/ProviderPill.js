import { FaSpotify, FaDeezer, FaSoundcloud } from "react-icons/fa6";
import { SiTidal, SiBandcamp, SiApplemusic } from "react-icons/si";
import { useState, useEffect } from "react";
import { useSettings } from "./SettingsContext";

import styles from "../styles/ProviderPill.module.css";

const providers = [
    { name: "Spotify", namespace: "spotify", icon: <FaSpotify /> },
    { name: "Apple Music", namespace: "applemusic", icon: <SiApplemusic /> },
    { name: "Deezer", namespace: "deezer", icon: <FaDeezer /> },
    { name: "Tidal", namespace: "tidal", icon: <SiTidal /> },
    { name: "Bandcamp", namespace: "bandcamp", icon: <SiBandcamp /> },
    { name: "SoundCloud", namespace: "soundcloud", icon: <FaSoundcloud /> },
];

function LoadingPill({ handleSelect }) {
    return (
        <div className={styles.ProviderPill} style={{ position: "absolute" }}>
            {providers.map((element) => (
                <button
                    className={`${styles.provider} ${styles[element.namespace]}`}
                    key={element.namespace}
                    onClick={() => handleSelect(element.namespace)}
                    title={element.name}
                >
                    {element.icon}
                </button>
            ))}
        </div>
    );
}

export default function ProviderPill() {
    const { settings, updateSettings, loading } = useSettings();
    const [currentProvider, setCurrentProvider] = useState(null);

    const handleSelect = (namespace) => {
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
				if (providers.some((p) => p.namespace === providerParam)) {
					handleSelect(providerParam);
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

    const selectedIndex = providers.findIndex((p) => p.namespace === currentProvider);

    return (
        <div className={styles.ProviderPillContainer}>
            <div className={styles.ProviderPill} style={{ position: "absolute" }}>
                {providers.map((element) => (
                    <button
                        className={`${styles.provider} ${styles[element.namespace]} ${currentProvider === element.namespace ? styles.selected : ""}`}
                        key={element.namespace}
                        onClick={() => handleSelect(element.namespace)}
                        title={element.name}
                    >
                        {element.icon}
                    </button>
                ))}
                <div
                    className={`${styles.SelectedProvider} ${styles[currentProvider]}`}
                    style={{
                        left: `${4 + selectedIndex * 30}px`,
                    }}
                />
            </div>
        </div>
    );
}