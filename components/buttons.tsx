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
