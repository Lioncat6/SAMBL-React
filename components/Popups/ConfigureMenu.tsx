import { useState, Fragment, JSX } from "react";
import styles from "../../styles/popups.module.css";
import { SAMBLSettingsContext, useSettings } from "../SettingsContext";
import { FaCaretDown, FaGear, FaXmark } from "react-icons/fa6";
import seeders from "../../lib/seeders/seeders";
import Popup from "../Popup";
import { SAMBLSettings } from "../../types/component-types";
import { Transition, Listbox, ListboxButton, ListboxOption, ListboxOptions, Label, Button } from "@headlessui/react";
import { Seeder } from "../../types/seeder-types";

function SelectedItem({ item, onRemove }: { item: Seeder, onRemove: (() => void) | false, exclusive?: boolean }) {
    return <div className={styles.selectedItem}><span className={styles.selectedItemName}>{item.displayName}</span>{onRemove && <div className={styles.selectedItemButton} onClick={onRemove}><FaXmark /></div>}</div>;
}

function ConfigureMenu({ close }: { close?: () => void }) {
    const { settings, updateSettings } = useSettings() as SAMBLSettingsContext;
    const [enabledSeeders, setEnabledSeeders] = useState(seeders.getSeeders(settings.enabledSeeders) || seeders.getDefaultSeeders());
    const [showExport, setShowExport] = useState(settings.showExport);
    const [listVirtualization, setListVirtualization] = useState(settings.listVirtualization);
    const [quickFetchThreshold, setQuickFetchThreshold] = useState(settings.quickFetchThreshold);
    const [saveSort, setSaveSort] = useState(settings.saveSort)
    const [saveFilter, setSaveFilter] = useState(settings.saveFilter)
    const saveConfig = () => {
        const newSettings: Partial<SAMBLSettings> = { enabledSeeders: enabledSeeders.map((seeder) => seeder.namespace), showExport, listVirtualization, quickFetchThreshold, saveSort, saveFilter };
        updateSettings(newSettings);
        if (close) close();
    };

    return (
        <>
            {" "}
            <div className={styles.header}>
                {" "}
                <FaGear /> Configure SAMBL <p className={styles.version}>{process.env.NEXT_PUBLIC_VERSION}</p>
            </div>
            <div className={styles.content}>
                <div className={styles.configureMenu}>
                    <Listbox value={enabledSeeders} onChange={setEnabledSeeders} multiple>
                        {({ open }) => (
                            <>
                                <Label className={styles.selectLabel}>Enabled Seeders</Label>
                                <ListboxButton className={styles.selectBox}>
                                    <FaCaretDown className={`${styles.carrot} ${open && styles.open}`} />
                                    {enabledSeeders.map((item) => (
                                        <SelectedItem
                                            key={item.namespace}
                                            item={item}
                                            onRemove={() => setEnabledSeeders(enabledSeeders.filter((seeder) => seeder.namespace !== item.namespace))}
                                        />
                                    ))}
                                </ListboxButton>
                                <Transition
                                    show={open}
                                    as={Fragment}
                                    enter={styles.selectOptionsEnter}
                                    enterFrom={styles.selectOptionsEnterFrom}
                                    enterTo={styles.selectOptionsEnterTo}
                                    leave={styles.selectOptionsLeave}
                                    leaveFrom={styles.selectOptionsLeaveFrom}
                                    leaveTo={styles.selectOptionsLeaveTo}
                                >
                                    <ListboxOptions anchor="bottom" className={styles.selectOptions}>
                                        {seeders.getAllSeeders().map((option) => (
                                            <ListboxOption key={option.namespace} value={option} as={Fragment}>
                                                {({ focus, selected }) => (
                                                    <div className={`${styles.selectOption} ${focus ? styles.focused : ""} ${selected ? styles.selected : ""}`}>
                                                        <div className={styles.optionTextContainer}><span className={styles.optionText}>{option.displayName} </span></div>
                                                        {selected && <FaXmark />}
                                                    </div>
                                                )}
                                            </ListboxOption>
                                        ))}
                                    </ListboxOptions>
                                </Transition>
                            </>
                        )}
                    </Listbox>
                    <hr/>
                    <div className="checkbox-wrapper">
                        <input type="checkbox" id="showExport" checked={showExport} onChange={(e) => setShowExport(e.target.checked)} className="substituted" />
                        <label htmlFor="showExport">Always show export Button</label>
                    </div>
                    <div className="checkbox-wrapper">
                        <input type="checkbox" id="listVirtualization" checked={listVirtualization} onChange={(e) => setListVirtualization(e.target.checked)} className="substituted" />
                        <label htmlFor="listVirtualization" title="Enable list virtualization for artists over a certain amount of albums to speed up filtering. Disable for userscript compatibility." className={styles.info}>
                            Enable List virtualization
                        </label>
                    </div>
                    <hr/>
                    <div className={styles.settingsInputWrapper}>
                        <input className={styles.settingsInput} type="number" id="quickFetchThreshold" value={quickFetchThreshold} onChange={(e) => setQuickFetchThreshold(Number(e.target.value))} />
                        <label htmlFor="quickFetchThreshold">Quick Fetch Threshold (Albums)</label>
                    </div>
                    <hr/>
                    <div className="checkbox-wrapper">
                        <input type="checkbox" id="saveFilter" checked={saveFilter} onChange={(e) => setSaveFilter(e.target.checked)} className="substituted" />
                        <label htmlFor="saveFilter">Save selected filter</label>
                    </div>
                    <div className="checkbox-wrapper">
                        <input type="checkbox" id="saveSort" checked={saveSort} onChange={(e) => setSaveSort(e.target.checked)} className="substituted" />
                        <label htmlFor="saveSort">Save selected sort option</label>
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