import { useState, Fragment, JSX } from "react";
import styles from "../../styles/popups.module.css";
import { SAMBLSettingsContext, useSettings } from "../SettingsContext";
import { FaCaretDown, FaCircleInfo, FaGear, FaXmark } from "react-icons/fa6";
import seeders from "../../lib/seeders/seeders";
import Popup from "../Popup";
import { SAMBLSettings } from "../../types/component-types";
import { Transition, Listbox, ListboxButton, ListboxOption, ListboxOptions, Label, Button, Input, Field, Fieldset, Checkbox } from "@headlessui/react";
import { Seeder } from "../../types/seeder-types";
import { PopupActionButton } from "../buttons";

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
    const [enableCoverArtSeeding, setEnableCoverArtSeeding] = useState(settings.enableCoverArtSeeding);
    const [targetBaseUrl, setTargetBaseUrl] = useState(settings.targetBaseUrl);
    const saveConfig = () => {
        const newSettings: Partial<SAMBLSettings> = { enabledSeeders: enabledSeeders.map((seeder) => seeder.namespace), showExport, listVirtualization, quickFetchThreshold, saveSort, saveFilter, enableCoverArtSeeding, targetBaseUrl };
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
                <Fieldset className={styles.configureMenu}>
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
                    <Field className={styles.settingsInputWrapper}>
                        <Input className={styles.settingsInput} type="text" id="targetBaseUrl" value={targetBaseUrl} onChange={(e) => setTargetBaseUrl(e.target.value)} />
                        <Label>MusicBrainz base URL</Label>
                    </Field>
                    <hr/>
                    <Field className={styles.checkboxField}>
                        <Checkbox className={styles.checkboxWrapper} checked={showExport} onChange={setShowExport}>
                            <span className={styles.checkbox}></span>
                        </Checkbox>
                        <Label>Always show export Button</Label>
                    </Field>
                    <Field className={styles.checkboxField}>
                        <Checkbox className={styles.checkboxWrapper} checked={listVirtualization} onChange={setListVirtualization}>
                            <span className={styles.checkbox}></span>
                        </Checkbox>
                        <Label title="Enable list virtualization for artists over a certain amount of albums to speed up filtering. Disable for userscript compatibility." className={styles.info}>
                            Enable List virtualization <FaCircleInfo />
                        </Label>
                    </Field>
                    <hr/>
                    <Field className={styles.settingsInputWrapper}>
                        <Input className={styles.settingsInput} type="number" id="quickFetchThreshold" value={quickFetchThreshold} onChange={(e) => setQuickFetchThreshold(Number(e.target.value))} />
                        <Label>Quick Fetch Threshold (Albums)</Label>
                    </Field>
                    <hr/>
                    <Field className={styles.checkboxField}>
                        <Checkbox className={styles.checkboxWrapper} checked={saveFilter} onChange={setSaveFilter}>
                            <span className={styles.checkbox}></span>
                        </Checkbox>
                        <Label>Save selected filter</Label>
                    </Field>
                    <Field className={styles.checkboxField}>
                        <Checkbox className={styles.checkboxWrapper} checked={saveSort} onChange={setSaveSort}>
                            <span className={styles.checkbox}></span>
                        </Checkbox>
                        <Label>Save selected sort option</Label>
                    </Field>
                    <hr/>
                    <Field className={styles.checkboxField}>
                        <Checkbox className={styles.checkboxWrapper} checked={enableCoverArtSeeding} onChange={setEnableCoverArtSeeding}>
                            <span className={styles.checkbox}></span>
                        </Checkbox>
                        <Label title="Requires MB: Enhanced Cover Art Uploads to function. https://github.com/ROpdebee/mb-userscripts#mb-enhanced-cover-art-uploads" className={styles.info}>
                            Enable cover art seeding <FaCircleInfo />
                        </Label>
                    </Field>
                </Fieldset>
            </div>
            <div className={styles.actions}>
                <PopupActionButton
                    onClick={() => {
                        saveConfig();
                    }}
                >
                    Save
                </PopupActionButton>
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