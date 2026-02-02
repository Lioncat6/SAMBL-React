import styles from "../styles/buttons.module.css";
import Link from "next/link";
import text from "../utils/text";
import editNoteBuilder from "../utils/editNoteBuilder";
import { Button } from "@headlessui/react";
import toasts from "../utils/toasts";

async function deepSearch(url) {
	toasts.warn("Please double check deep searches before submitting edits!")
	try {
		const response = await toasts.dispPromise(fetch(`/api/artistDeepSearch?url=${encodeURIComponent(url)}`), "Running Deep Search...", "Deep Search failed!");
		if (response.ok) {
			console.log("a")
			let data = await response.json();
			let editNote = editNoteBuilder.buildDeepSearchEditNote(data);
			let editUrl = `https://musicbrainz.org/artist/${data.mbid}/edit?edit-artist.url.0.text=${url}&edit-artist.url.0.link_type_id=194&edit-artist.edit_note=${editNote}`;
			if (data.nameSimilarity < 0.30) {
				toasts.error(`Artist name too different for match! (${Math.round(data.nameSimilarity * 100)}% - ${data.mbName})`)
				return;
			}
			window.open(editUrl, "_blank");
		} else {
			toasts.error((await response.json()).error);
		}
	} catch (error) {
		console.error(error);
		toasts.error(error.message);
	}
}

export default function AddButtons({ artist }) {
	let editNote = editNoteBuilder.buildEditNote('Artist', artist.provider, artist.url, artist.url);
	let addUrl = `https://musicbrainz.org/artist/create?edit-artist.name=${artist.name}&edit-artist.sort_name=${artist.name}&edit-artist.url.0.text=${artist.url}&edit-artist.url.0.link_type_id=194&edit-artist.edit_note=${editNote}`
	return (
		<>
			<a
				className={styles.addToMBButton}
				href={ addUrl }
				target="_blank"
			>
				<div>Add to MusicBrainz</div>
			</a>
			<Link className={styles.addToMBButton} href={`../artist/?provider_id=${artist.id}&provider=${artist.provider}`}>
				<div>View Artist Anyway</div>
			</Link>
			<Button onClick={() => deepSearch(artist.url)} className={styles.addToMBButton}>Deep Search</Button>
		</>
	);
}
