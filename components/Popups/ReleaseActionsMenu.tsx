import { JSX } from "react/jsx-runtime";
import { AlbumStack } from "../../types/aggregated-types";
import Popup from "../Popup";
import styles from "../../styles/popups.module.css"
import { FaLink } from "react-icons/fa6";
import albumStack from "../../utils/albumStack";
import { AlbumDetails } from "./TrackMenu";
import { TbPhotoPlus } from "react-icons/tb";
import { FiGlobe } from "react-icons/fi";
import editUrlBuilder from "../../utils/editUrlBuilder";
import { PopupActionButton } from "../buttons";
import clientProviders from "../../utils/clientProviders";
import { SAMBLSettingsContext, useSettings, useSettingsOrDefaults } from "../SettingsContext";

function ReleaseActionsMenu({ close, data }: { close?: () => void, data: AlbumStack }) {
    const { settings } = useSettingsOrDefaults();
    console.log(settings)
    const [aggregatedAlbum, sourceAlbum, targetAlbum] = albumStack.unstack(data)
    const isrcSeedUrl = editUrlBuilder.buildISRCEditUrl(data);
    const coverArtAddUrl = aggregatedAlbum.mbid ? `https://${settings.targetBaseUrl}/release/${aggregatedAlbum.mbid}/cover-art` : null;
    const buildCoverArtSeedUrl = editUrlBuilder.buildCoverArtSeedUrl(data, window.location.href, settings.targetBaseUrl);
    const enableCoverArtSeeding = settings.enableCoverArtSeeding;
    return (
        <>
            <div className={styles.header}>
                {" "}
                <FaLink /> Release Actions{" "}
            </div>
            <div className={styles.content}>
                <AlbumDetails data={data} />
            </div>
            <div className={styles.actions}>
                <PopupActionButton
                    type="link"
                    href={isrcSeedUrl}
                    disabled={!isrcSeedUrl}
                    title={`Submit ISRCs from ${sourceAlbum?.provider ? clientProviders.getDisplayName(sourceAlbum?.provider): 'Unknown'} to ${targetAlbum?.provider ? clientProviders.getDisplayName(targetAlbum?.provider): 'Unknown'} with MagicISRC`}
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
                    href={enableCoverArtSeeding ? buildCoverArtSeedUrl: undefined}
                    title={enableCoverArtSeeding ? `Seed cover art from ${clientProviders.getDisplayName(aggregatedAlbum.provider)} using MB: Enhanced Cover Art Uploads`: 'Enable Cover Art Seeding in the Configure menu to use this!'}
                >
                    {clientProviders.getDisplayIcon(aggregatedAlbum.provider)} Import cover art from {clientProviders.getDisplayName(aggregatedAlbum.provider)}
                </PopupActionButton>
                <hr />
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

export default function ReleaseActionsPopup({ data, button }: { data: AlbumStack, button?: JSX.Element }) {
    return (
        <Popup button={button}>
            <ReleaseActionsMenu data={data} />
        </Popup>
    );
}