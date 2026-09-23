import { JSX } from "react/jsx-runtime";
import { AlbumStack } from "../../types/aggregated-types";
import Popup from "../Popup";
import styles from "../../styles/popups.module.css"
import { FaChevronDown, FaChevronRight, FaLink } from "react-icons/fa6";
import albumStack from "../../utils/albumStack";
import { AlbumDetails } from "./TrackMenu";
import { TbPhotoPlus } from "react-icons/tb";
import { FiGlobe } from "react-icons/fi";
import editUrlBuilder from "../../utils/editUrlBuilder";
import { PopupActionButton } from "../buttons";
import clientProviders from "../../utils/clientProviders";
import { SAMBLSettingsContext, useSettings, useSettingsOrDefaults } from "../SettingsContext";
import medium from "../../utils/medium";
import { useState } from "react";

function ReleaseActionsMenu({ close, data }: { close?: () => void, data: AlbumStack }) {
    const { settings } = useSettingsOrDefaults();
    console.log(settings)
    const [aggregatedAlbum, sourceAlbum, targetAlbum] = albumStack.unstack(data)
    const isrcSeedUrl = editUrlBuilder.buildISRCEditUrl(data);
    const coverArtAddUrl = aggregatedAlbum.mbid ? `https://${settings.targetBaseUrl}/release/${aggregatedAlbum.mbid}/cover-art` : null;
    const buildCoverArtSeedUrl = editUrlBuilder.buildCoverArtSeedUrl(data, window.location.href, settings.targetBaseUrl);
    const enableCoverArtSeeding = settings.enableCoverArtSeeding;
    // const mediums = aggregatedAlbum.mediums.length > 0 ? aggregatedAlbum.mediums : sourceAlbum?.mediums || [];
    const mediums = aggregatedAlbum.mediums;
    const tracks = mediums.flatMap(medium => medium.tracks);
    const tracksAvalible = tracks.length > 0;
    const [tracksExpanded, setTracksExpanded] = useState(false);
    return (
        <>
            <div className={styles.trackBg} style={{ "--background-image": `url(${aggregatedAlbum.imageUrl})` } as React.CSSProperties} ></div>
            <div className={styles.header}>
                {" "}
                <FaLink /> Release Actions{" "}
            </div>
            <div className={styles.content}>
                {/* <AlbumDetails data={data} /> */}
                <PopupActionButton
                    type="link"
                    href={isrcSeedUrl}
                    disabled={!isrcSeedUrl}
                    title={isrcSeedUrl ? `Submit ISRCs from ${sourceAlbum?.provider ? clientProviders.getDisplayName(sourceAlbum?.provider) : 'Unknown'} to ${targetAlbum?.provider ? clientProviders.getDisplayName(targetAlbum?.provider) : 'Unknown'} with MagicISRC` : 'This release has no ISRCs'}
                >
                    <FiGlobe /> Submit ISRCs
                </PopupActionButton>
                <PopupActionButton
                    type="link"
                    disabled={!coverArtAddUrl}
                    href={coverArtAddUrl}
                    title={"Open this release's cover art page"}
                >
                    <TbPhotoPlus /> Add cover art
                </PopupActionButton>
                <PopupActionButton
                    type="link"
                    disabled={!buildCoverArtSeedUrl || !enableCoverArtSeeding}
                    href={enableCoverArtSeeding ? buildCoverArtSeedUrl : undefined}
                    title={enableCoverArtSeeding ? `Seed cover art from ${clientProviders.getDisplayName(aggregatedAlbum.provider)} using MB: Enhanced Cover Art Uploads` : 'Enable Cover Art Seeding in the Configure menu to use this!'}
                >
                    {clientProviders.getDisplayIcon(aggregatedAlbum.provider)} Import cover art from {clientProviders.getDisplayName(aggregatedAlbum.provider)}
                </PopupActionButton>
                <PopupActionButton
                    type="button"
                    style="compact"
                    onClick={() => setTracksExpanded(!tracksExpanded)}
                    title={tracksAvalible ? tracksExpanded ? "Collapse" : "Expand": "Track aggregation failed!"}
                    disabled={!tracksAvalible}
                >
                    <FaLink /> Import track URLs {tracksExpanded ? <FaChevronRight /> : <FaChevronDown />}
                </PopupActionButton>
                {tracksExpanded &&
                    <>
                        <br />
                        {tracks.map(track => {
                            const trackUrlSeedUrl = editUrlBuilder.buildRecordingUrlSeedUrl(track, data, settings.targetBaseUrl);
                            return (
                                <div className={styles.miniTrackContainer}>
                                    <span className={styles.trackNumber}>{track.trackNumber}</span> <span className={styles.miniTrackTitle}>{track.name}</span>
                                    {trackUrlSeedUrl &&
                                        <div className={styles.linkImportButton}>
                                            <PopupActionButton
                                                type="link"
                                                href={trackUrlSeedUrl}
                                            >
                                                {clientProviders.getDisplayIcon(track.provider)} Seed Urls
                                            </PopupActionButton>
                                        </div>
                                    }
                                </div>
                            )

                        })}
                    </>
                }
            </div>
            <div className={styles.actions}>
                <PopupActionButton
                    onClick={() => { close && close() }}
                    type="button"
                >
                    Close
                </PopupActionButton>
            </div>
        </>
    )
}

export default function ReleaseActionsPopup({ data, button, open }: { data: AlbumStack, button?: JSX.Element, open?: boolean }) {
    return (
        <Popup button={button} open={open}>
            <ReleaseActionsMenu data={data} />
        </Popup>
    );
}