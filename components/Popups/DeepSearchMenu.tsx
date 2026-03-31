import { JSX, useState } from "react";
import { DeepSearchData } from "../../types/api-types";
import { ArtistPageData, DeepSearchSelection } from "../../types/component-types";
import { ArtistObject } from "../../types/provider-types";
import editUrlBuilder from "../../utils/editUrlBuilder";
import toasts from "../../utils/toasts";
import Popup from "../Popup";
import styles from "../../styles/popups.module.css"
import { FaSearch } from "react-icons/fa";
import { MdLocationSearching } from "react-icons/md";
import { Checkbox, Field, Fieldset, Input, Label, Legend, Radio, RadioGroup, Transition } from "@headlessui/react";
import { PiSealWarningFill } from "react-icons/pi";
import text from "../../utils/text";



function DeepSearchMenu({ close, data }: { close?: () => void, data: ArtistObject }) {
    const artist = data;
    const [dsData, setDsData] = useState(null as null | DeepSearchData)
    const [albums, setAlbums] = useState(5);
    const [searchUPCs, setSearchUPCs] = useState(true);
    const [searchURLs, setSearchURLs] = useState(true);
    const [trackArtists, setTrackArtists] = useState(false);
    const [selectedArtist, setSelectedArtist] = useState(null as string | null)
    const [warning, setWarning] = useState(null as string | null);
    async function deepSearch(url: string) {
        setDsData(null)
        setSelected(null);
        toasts.warn("Please double check deep searches before submitting edits!")
        try {
            const response = await toasts.dispPromise(fetch(`/api/artistDeepSearch?url=${encodeURIComponent(url)}&count=${albums}&searchURLs=${searchURLs}&searchUPCs=${searchUPCs}&trackArtists=${trackArtists}`), "Running Deep Search...", "Deep Search failed!");
            if (response.ok) {
                let data = await response.json() as DeepSearchData;
                // let editUrl = editUrlBuilder.buildDeepSearchEditUrl(data);
                // if (data.nameSimilarity < 0.30) {
                //     toasts.error(`Artist name too different for match! (${Math.round(data.nameSimilarity * 100)}% - ${data.mbName})`)
                //     return;
                // }
                // window.open(editUrl, "_blank");
                setDsData(data);
            } else {
                toasts.error((await response.json()).error);
            }
        } catch (error) {
            console.error(error);
            toasts.error(error.message);
        }
    }

    function setSelected(mbid: string | (() => string) | null) {
        if (mbid && typeof mbid != 'string') {
            mbid = mbid();
        }
        setSelectedArtist(mbid);
        const artist = dsData?.mbArtists.find((artist) => artist.id == mbid);
        if (artist && artist.nameSimilarity < 0.3) {
            setWarning(`Low artist name similarity! (${text.truncateToTwo(artist.nameSimilarity * 100)}%)`)
        } else {
            setWarning(null);
        }
    }

    function seedUrl() {        
        if (!selectedArtist || !dsData) return;
        const artist = dsData.mbArtists.find((artist) => artist.id == selectedArtist);
        if (!artist) return;
        const selection: DeepSearchSelection = {
            data: dsData,
            userSelected: (selectedArtist != dsData.mbArtists[0].id),
            mbid: selectedArtist,
            trackArtists: trackArtists
        }
        const editUrl = editUrlBuilder.buildDeepSearchEditUrl(selection);
        window.open(editUrl, "_blank");
    }

    return (

        <>
            {" "}
            <div className={styles.header}>
                {" "}
                <MdLocationSearching /> Artist Deep Search{" "}
            </div>
            <div className={styles.content}>
                <Fieldset className={styles.deepSearchContent}>
                    <Fieldset className={styles.section}>
                        <Legend className={styles.sectionHeader}>Options</Legend>
                        <Field className={styles.settingsInputWrapper}>
                            <Label>Album search count</Label>
                            <Input className={styles.settingsInput} type="number" value={albums} onChange={(e) => setAlbums(Number(e.target.value))} />
                        </Field>
                        <Field className={styles.checkboxField}>
                            <Checkbox className={styles.checkboxWrapper} checked={searchUPCs} onChange={setSearchUPCs}>
                                <span className={styles.checkbox}></span>
                            </Checkbox>
                            <Label>Search for UPCs</Label>
                        </Field>
                        <Field className={styles.checkboxField}>
                            <Checkbox className={styles.checkboxWrapper} checked={searchURLs} onChange={setSearchURLs}>
                                <span className={styles.checkbox}></span>
                            </Checkbox>
                            <Label>Search for URLs</Label>
                        </Field>
                        <Field className={styles.checkboxField}>
                            <Checkbox className={styles.checkboxWrapper} checked={trackArtists} onChange={setTrackArtists}>
                                <span className={styles.checkbox}></span>
                            </Checkbox>
                            <Label>Use track artists</Label>
                        </Field>
                    </Fieldset>
                    <Transition
                        show={(dsData != null)}
                        as={'div'}
                        className={styles.container}
                        enter={styles.resultsEnter}
                        enterFrom={styles.resultsEnterFrom}
                        enterTo={styles.resultsEnterTo}
                    >
                        <hr />
                        {dsData &&
                            <Fieldset className={styles.section}>
                                <Legend className={styles.sectionHeader}>Results</Legend>
                                <div className={styles.sourceArtist}>
                                    {dsData.sourceArtist.imageUrlSmall && <a className={styles.sourceArtistImage} href={dsData.sourceArtist.imageUrl || dsData.sourceArtist.imageUrlSmall} target="_blank"><img src={dsData.sourceArtist.imageUrlSmall}></img></a>}
                                    <div className={styles.sourceArtistText}>
                                        <a className={styles.sourceArtistName} href={dsData.sourceArtist.url.url} target="_blank">{dsData.sourceArtist.name}</a>
                                        <div className={styles.sourceArtistDescription}>{dsData.sourceArtist.relevance}</div>
                                    </div>
                                </div>
                                {dsData.mbArtists.length > 0 ?
                                    <>
                                        <RadioGroup
                                            className={styles.mbArtistContainer}
                                            defaultValue={() => {
                                                const artist = dsData.mbArtists[0].id;
                                                setSelected(artist); //Necessary since onChange doesn't get fired initially
                                                return artist;
                                            }}
                                            onChange={setSelected}
                                        >
                                            {dsData.mbArtists.map((artist) => {
                                                return (
                                                    <Radio className={styles.mbArtist} key={artist.id} value={artist.id}>
                                                        {({ checked, disabled, hover, focus }) => (
                                                            <>
                                                                <div className={styles.mbArtistLabel}>
                                                                    <div className={styles.checkboxWrapper} {...(checked && { "data-checked": true })} {...(focus && { "data-focus": true })}>
                                                                        <span className={styles.checkbox}></span>
                                                                    </div>
                                                                    <img src={artist.imageUrlSmall || ""}></img>
                                                                    <div className={`${styles.deepSearchStatusPill} ${artist.mostCommonMBID ? styles.blue : styles.orange}`} title={`${artist.mostCommonMBID ? "Most common MBID | " : ""}${text.truncateToTwo(artist.nameSimilarity * 100)}% Similarity`}><div className={styles.deepSearchStatusPillInner} style={{ height: `${(artist.nameSimilarity * 100).toFixed(1)}%` }}></div></div>
                                                                    <a className={styles.mbArtistName} href={artist.url.url} target={"_blank"}>{artist.name}</a>
                                                                </div>
                                                                {('info' in artist && artist.info) && <p className={styles.mbArtistDescription}>({artist.info as string})</p>}
                                                            </>
                                                        )}
                                                    </Radio>
                                                )
                                            })}
                                        </RadioGroup>
                                    </>
                                    :
                                    <h3>No MusicBrainz artists found</h3>
                                }
                            </Fieldset>
                        }
                    </Transition>
                </Fieldset>
            </div>
            <div className={styles.actions}>
                {selectedArtist &&
                    <button
                        className={`${styles.button} ${warning && styles.warning}`}
                        onClick={() => { seedUrl() }}
                        title={warning ? warning : undefined}
                    >
                        {warning && <><PiSealWarningFill /> </>}
                        Seed URL
                    </button>}
                <button
                    className={styles.button}
                    onClick={() => { deepSearch(artist.url.url) }}
                >
                    <MdLocationSearching /> Run Search
                </button>
                <button
                    className={styles.button}
                    onClick={() => { close && close() }}
                >
                    Close
                </button>
            </div>
        </>
    );
}

export default function DeepSearchMenuPopup({ data, button }: { data: ArtistObject, button?: JSX.Element }) {
    return (
        <Popup button={button}>
            <DeepSearchMenu data={data} />
        </Popup>
    );
}