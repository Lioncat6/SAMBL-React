import { FaSpotify, FaDeezer } from "react-icons/fa6";
import { SiItunes } from "react-icons/si";
import { SiTidal } from "react-icons/si";
import { useState, useEffect } from "react";
import { useSettings } from "./SettingsContext";

import styles from "../styles/ProviderPill.module.css";

const providers = [
	{
		name: "Spotify",
		namespace: "spotify",
		icon: <FaSpotify />,
	},
	{
		name: "Deezer",
		namespace: "deezer",
		icon: <FaDeezer />,
	},
	{
		name: "Tidal",
		namespace: "tidal",
		icon: <SiTidal />,
	},
	{
		name: "Apple Music",
		namespace: "itunes",
		icon: <SiItunes />,
	},
];

function LoadingPill() {
    return (
        <>
            <div className={styles.ProviderPill} style={{ position: "absolute" }}>
                {providers.map((element, idx) => (
                    <button className={`${styles.provider} ${styles[element.namespace]}`} key={element.namespace} onClick={() => handleSelect(element.namespace)} title={`${element.name}`}>
                        {element.icon}
                    </button>
                ))}
            </div>
        </>
    );
}

export default function ProviderPill() {
	const { settings, updateSettings, loading } = useSettings();	
	const [currentProvider, setCurrentProvider] = useState(null);

    useEffect(() => {
        if (!loading && settings) {
            setCurrentProvider(settings.currentProvider);
        }
    }, [loading, settings]);

    if (loading || !settings || !currentProvider) return <LoadingPill />;

    const selectedIndex = providers.findIndex((p) => p.namespace === currentProvider);

    const handleSelect = (namespace) => {
        setCurrentProvider(namespace);
        updateSettings({ currentProvider: namespace });
        document.cookie = `provider=${namespace}`;
    };
    document.cookie = `provider=${currentProvider}`; // Make sure cookie is always set
	return (
		<div className={styles.ProviderPill} style={{ position: "absolute" }}>
			{providers.map((element, idx) => (
				<button className={`${styles.provider} ${styles[element.namespace]} ${currentProvider === element.namespace ? styles.selected : ""}`} key={element.namespace} onClick={() => handleSelect(element.namespace)} title={`${element.name}`}>
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
	);
}
