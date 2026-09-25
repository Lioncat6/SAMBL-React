import styles from "../styles/buttons.module.css";
import Link from "next/link";
import { Button } from "@headlessui/react";
import editUrlBuilder from "../utils/editUrlBuilder";
import { ArtistObject } from "../types/provider-types";
import DeepSearchMenuPopup from "./Popups/DeepSearchMenu";
import { FaLink, FaMagnifyingGlass, FaSeedling } from "react-icons/fa6";
import { AlbumStack } from "../types/aggregated-types";
import albumStack from "../utils/albumStack";
import { HTMLAttributeAnchorTarget, JSX } from "react";
import { useSettingsOrDefaults } from "./SettingsContext";

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

function LookupButtonInner() {
	return <><FaMagnifyingGlass /> Lookup</>
}

function FindButtonInner() {
	return <><FaMagnifyingGlass /> Find</>
}

function SearchButtonInner() {
	return <>Search</>
}

function SeedButtonInner() {
	return (
		<><FaSeedling /> Seed Release</>
	)
}

function ReleaseActionsButtonInner() {
	return <><FaLink /> Release Actions</>
}

export function ActionButton({ type, onClick, isLoading, data }: { type: "lookup" | "find" | "search" | "seed" | "releaseActions", onClick?: () => void, isLoading?: boolean, data?: any }) {
	let buttonContent = <>Enter</>;
	let buttonStyles = styles.actionButton;
	let buttonId = "actionButton";

	switch (type) {
		case "lookup":
			buttonContent = <LookupButtonInner />;
			buttonStyles = styles.lookupButton;
			buttonId = "lookupButton";
			break;
		case "find":
			buttonContent = <FindButtonInner />;
			buttonStyles = styles.findButton;
			buttonId = "findButton";
			break;
		case "search":
			buttonContent = <SearchButtonInner />;
			buttonStyles = styles.searchButton;
			buttonId = "searchEnter";
			break;
		case "seed":
			buttonContent = <SeedButtonInner />;
			buttonStyles = styles.seedButton;
			buttonId = "seedButton";
			break;
		case "releaseActions":
			buttonContent = <ReleaseActionsButtonInner />;
			buttonStyles = styles.releaseActionsButton;
			buttonId = "releaseActionsButton"
			break
	}

	return (
		<button type="button" className={`${buttonStyles ? `${buttonStyles} ` : ''}${styles.actionButton}`} id={buttonId} onClick={onClick}>
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