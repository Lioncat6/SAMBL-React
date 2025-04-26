import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import { useEffect, useState } from "react";
import styles from "../styles/popups.module.css";
import { useSettings } from "./SettingsContext";


function ConfigureMenu({ close }) {
    const { settings, updateSettings } = useSettings();
    const [showHarmony, setShowHarmony] = useState(settings.showHarmony);
    const [showATisket, setShowATisket] = useState(settings.showATisket);

    const saveConfig = () => {
        const newSettings = { showHarmony, showATisket };
        updateSettings(newSettings);
        close();
    };

    return (
        <>        <div className={styles.header}> <i className="fa-solid fa-gear" /> Configure SAMBL </div>
            <div className={styles.content}>
                <div className={styles.configureMenu}>
                    <div className="checkbox-wrapper">
                        <input
                            type="checkbox"
                            className="substituted"
                            id="showHarmony"
                            checked={showHarmony}
                            onChange={(e) => setShowHarmony(e.target.checked)}
                        />
                        <label htmlFor="showHarmony">Show Harmony Button</label>
                    </div>
                    <div className="checkbox-wrapper">
                        <input
                            type="checkbox"
                            id="showATisket"
                            checked={showATisket}
                            onChange={(e) => setShowATisket(e.target.checked)}
                            className="substituted"
                        />
                        <label htmlFor="showATisket">Show A-tisket Button</label>
                    </div>
                </div>
            </div>
            <div className={styles.actions}>
                <button className={styles.button} onClick={() => {
                    saveConfig();
                }}>Save</button>
            </div></>


    );
}

export default function SAMBLPopup({ button, type }) {
    return (
        <Popup trigger={button} position="right center" modal nested>
            {close => (
                <div className={styles.modal}>
                    <button className={styles.close} onClick={close}>
                        <i class="fa-solid fa-xmark"></i>
                    </button>

                    <ConfigureMenu close={close} />
                </div>
            )}
        </Popup>
    );
}