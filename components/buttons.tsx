import styles from "../styles/buttons.module.css";
import Link from "next/link";
import text from "../utils/text";
import editNoteBuilder from "../utils/editNoteBuilder";
import { Button } from "@headlessui/react";
import toasts from "../utils/toasts";
import editUrlBuilder from "../utils/editUrlBuilder";
import { DeepSearchData } from "../types/api-types";
import { ArtistObject } from "../types/provider-types";
import DeepSearchMenuPopup from "./Popups/DeepSearchMenu";
import { AggregatedAlbum } from "../types/aggregated-types";
import { FaMagnifyingGlass } from "react-icons/fa6";

export default function AddButtons({ artist }: { artist: ArtistObject }) {
	let addUrl = editUrlBuilder.buildAddArtistEditUrl(artist);
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

function LookupButtonInner(){
	return <><FaMagnifyingGlass /> Lookup</>
}

function FindButtonInner(){
	return <><FaMagnifyingGlass /> Find</>
}

function SearchButtonInner(){
	return <>Search</>
}

export function ActionButton({ type, onClick, isLoading, data }: { type: "lookup" | "find" | "search", onClick: () => void, isLoading?: boolean, data?: any}) {
	let buttonContent = <>Enter</>;
	let className = styles.actionButton;
	let buttonId = "actionButton";

	switch (type) {
		case "lookup":
			buttonContent = <LookupButtonInner />;
			className = styles.lookupButton;
			buttonId = "lookupButton";
			break;
		case "find":
			buttonContent = <FindButtonInner />;
			className = styles.findButton;
			buttonId = "findButton";
			break;
		case "search":
			buttonContent = <SearchButtonInner />;
			className = styles.searchButton;
			buttonId = "searchEnter";
			break;
	}

	return (
		<button type="button" className={className} id={buttonId} onClick={onClick}>
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