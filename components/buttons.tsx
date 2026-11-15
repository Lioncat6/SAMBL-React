import styles from "../styles/buttons.module.css";
import Link from "next/link";
import { Button } from "@headlessui/react";
import editUrlBuilder from "../utils/editUrlBuilder";
import { ArtistObject } from "../types/provider-types";
import DeepSearchMenuPopup from "./Popups/DeepSearchMenu";
import { FaLink, FaMagnifyingGlass, FaSeedling, FaVideo, FaYoutube } from "react-icons/fa6";
import { AlbumStack } from "../types/aggregated-types";
import albumStack from "../utils/albumStack";
import { HTMLAttributeAnchorTarget, JSX } from "react";
import { useSettingsOrDefaults } from "./SettingsContext";
import { PiFlowerTulipBold } from "react-icons/pi";

export function AddButtons({ artist }: { artist: ArtistObject }) {
	const { settings } = useSettingsOrDefaults();
	let addUrl = editUrlBuilder.buildAddArtistEditUrl(artist, settings.targetBaseUrl);
	return (
		<>
			<a
				className={styles.addToMBButton}
				href={addUrl}
				target="_blank"
			>
				<div>Add to MusicBrainz</div>
			</a>
			<Link className={styles.addToMBButton} href={`../artist/?provider_id=${artist.id}&provider=${artist.provider}`}>
				<div>View Artist Anyway</div>
			</Link>
			<DeepSearchMenuPopup
				button={
					<Button className={styles.addToMBButton}>Deep Search</Button>
				}
				data={artist}
			/>
		</>
	);
}

export function ActionButton({ type, onClick, isLoading, data }: { type: "lookup" | "find" | "search" | "seed" | "releaseActions" | "recording", onClick?: () => void, isLoading?: boolean, data?: any }) {
	let buttonContent = <>Enter</>;
	let buttonStyles = styles.actionButton;
	let buttonId = "actionButton";
	let title: string | undefined = undefined;
	switch (type) {
		case "lookup":
			buttonContent = <><FaMagnifyingGlass /> Lookup</>;
			buttonStyles = styles.lookupButton;
			buttonId = "lookupButton";
			break;
		case "find":
			buttonContent = <><FaMagnifyingGlass /> Find</>;
			buttonStyles = styles.findButton;
			buttonId = "findButton";
			break;
		case "search":
			buttonContent = <>Search</>;
			buttonStyles = styles.searchButton;
			buttonId = "searchEnter";
			break;
		case "seed":
			buttonContent = <><FaSeedling /> Seed Release</>;
			buttonStyles = styles.seedButton;
			buttonId = "seedButton";
			break;
		case "recording":
			buttonContent = <><FaYoutube/> <PiFlowerTulipBold /> Seed Standalone Video Recording</>;
			buttonStyles = styles.seedRecordingButton;
			buttonId = "seedRecordingButton";
			title = "Seed video release as a standalone recording"
			break;
		case "releaseActions":
			buttonContent = <><FaLink /> Release Actions</>;
			buttonStyles = styles.releaseActionsButton;
			buttonId = "releaseActionsButton"
			break
	}

	return (
		<button type="button" className={`${buttonStyles ? `${buttonStyles} ` : ''}${styles.actionButton}`} id={buttonId} onClick={onClick} title={title}>
			{isLoading ? (
				<div className="lds-ellipsis">
					<div></div>
					<div></div>
					<div></div>
					<div></div>
				</div>
			) : (
				buttonContent
			)}
		</button>
	);
}


export function PopupActionButton({ children, type = "button", style = "normal", onClick, href, target = "_blank", disabled = false, warning = false, title }: { children: React.ReactNode, type?: "link" | "button", style?: "normal"| "compact", onClick?: () => void, disabled?: boolean, warning?: boolean, href?: URL | string | null, target?: HTMLAttributeAnchorTarget, title?: string | null }) {
	const classes = `${styles.popupActionButton}${disabled ? ` ${styles.disabled}` : ''}${warning ? ` ${styles.warning}` : ''}${style =="compact" ? ` ${styles.compact}` : ''}`
	const buttonChildren = style == "normal" ? children : <span className={styles.compactButtonInner}>{children}</span>;
	return (
		<>
			{type == "link" ?
				<a
					className={classes}
					title={title ?? undefined}
					onClick={onClick}
					href={href?.toString()}
					target={target}
				>
					{buttonChildren}
				</a> :
				<button
					className={classes}
					title={title ?? undefined}
					onClick={onClick}
					disabled={disabled}
				>
					{buttonChildren}
				</button>
			}
		</>
	)
}