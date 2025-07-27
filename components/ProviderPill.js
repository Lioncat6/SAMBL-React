import { FaSpotify, FaDeezer } from "react-icons/fa6";
import { SiItunes } from "react-icons/si";

import { SiTidal } from "react-icons/si";

import styles from "../styles/ProviderPill.module.css";

export default function ProviderPill({ provider, onClick, selected="spotify" }) {
    const providers = [
        {
            name: "Spotify",
            namespace: "spotify",
            icon: <FaSpotify />
        }, {
            name: "Deezer",
            namespace: "deezer",
            icon: <FaDeezer />
        }, {
            name: "Tidal",
            namespace: "tidal",
            icon: <SiTidal />
        },
        { 
            name: "Apple Music",
            namespace: "itunes",
            icon: <SiItunes />
        }
    ]

    const selectedIndex = providers.findIndex(p => p.namespace === selected);

    return (
        <div className={styles.ProviderPill} style={{ position: "absolute" }}>
            {providers.map((element, idx) => (
                <button
                    className={styles.provider}
                    key={element.namespace}
                    onClick={() => onClick(element.namespace)}
                >
                    {element.icon}
                </button>
            ))}
            <div
                className={styles.SelectedProvider}
                style={{
                    left: `${4.5 + selectedIndex * 36}px`, // 30px width + 6px margin/padding
                    transition: "left 0.3s cubic-bezier(0.4,0,0.2,1)"
                }}
            />
        </div>
    );
}