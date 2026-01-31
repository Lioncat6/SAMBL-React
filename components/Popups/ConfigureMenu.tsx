import { useState, JSX } from "react";
import styles from "../../styles/popups.module.css";
import { useSettings } from "../SettingsContext";
import { FaGear } from "react-icons/fa6";
import getConfig from "next/config";
import seeders from "../../lib/seeders/seeders";
import Popup from "../Popup";


function ConfigureMenu({ close }: { close?: () => void }) {
    const { publicRuntimeConfig } = getConfig();
    const { settings, updateSettings } = useSettings();
    const [enabledSeeders, setEnabledSeeders] = useState(settings.enabledSeeders);
    const [showExport, setShowExport] = useState(settings.showExport);
    const [listVirtualization, setListVirtualization] = useState(settings.listVirtualization);
    const [quickFetchThreshold, setQuickFetchThreshold] = useState(settings.quickFetchThreshold);
    const saveConfig = () => {
        const newSettings = { enabledSeeders, showExport, listVirtualization, quickFetchThreshold };
        updateSettings(newSettings);
        if (close) close();
    };

    return (
        <>
            {" "}
            <div className={styles.header}>
                {" "}
                <FaGear /> Configure SAMBL <p className={styles.version}>{publicRuntimeConfig?.version}</p>
            </div>
            <div className={styles.content}>
                <div className={styles.configureMenu}>
                    {seeders.getAllSeeders().map((seeder) => (
                        <div key={seeder.namespace} className="checkbox-wrapper">
                            <input
                                type="checkbox"
                                id={`seeder-${seeder.namespace}`}
                                checked={enabledSeeders?.includes(seeder.namespace)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setEnabledSeeders([...enabledSeeders, seeder.namespace]);
                                    } else {
                                        setEnabledSeeders(enabledSeeders.filter((ns) => ns !== seeder.namespace));
                                    }
                                }}
                                className="substituted"
                            />
                            <label htmlFor={`seeder-${seeder.namespace}`}>Show {seeder.displayName} button</label>
                        </div>
                    ))}
                    <br />
                    <div className="checkbox-wrapper">
                        <input type="checkbox" id="showExport" checked={showExport} onChange={(e) => setShowExport(e.target.checked)} className="substituted" />
                        <label htmlFor="showExport">Always show export Button</label>
                    </div>
                    <br />
                    <div className="checkbox-wrapper">
                        <input type="checkbox" id="listVirtualization" checked={listVirtualization} onChange={(e) => setListVirtualization(e.target.checked)} className="substituted" />
                        <label htmlFor="listVirtualization" title="Enable list virtualization for artists over a certain amount of albums to speed up filtering. Disable for userscript compatibility." className={styles.info}>
                            Enable List virtualization
                        </label>
                    </div>
                    <div className={styles.settingsInputWrapper}>
                        <input className={styles.settingsInput} type="number" id="quickFetchThreshold" value={quickFetchThreshold} onChange={(e) => setQuickFetchThreshold(Number(e.target.value))} />
                        <label htmlFor="quickFetchThreshold">Quick Fetch Threshold (Albums)</label>
                    </div>
                </div>
            </div>
            <div className={styles.actions}>
                <button
                    className={styles.button}
                    onClick={() => {
                        saveConfig();
                    }}
                >
                    Save
                </button>
            </div>
        </>
    );
}

export default function ConfigureMenuPopup({ button }: { button?: JSX.Element }) {
    return (
        <Popup button={button}>
            <ConfigureMenu />
        </Popup>
    );
}