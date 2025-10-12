import styles from "../styles/buttons.module.css";
import Link from "next/link";
import text from "../utils/text";
import editNoteBuilder from "../utils/editNoteBuilder";
import { Button } from "@headlessui/react";
import { toast, Flip } from "react-toastify";

async function deepSearch(url) {
	dispError("Please double check deep searches before submitting edits!", "warn")
	try {
		const response = await dispPromise(fetch(`/api/artistDeepSearch?url=${encodeURIComponent(url)}`), "Running Deep Search...");
		if (response.ok) {
			let data = await response.json();
			let editNote = editNoteBuilder.buildDeepSearchEditNote(data);
			let editUrl = `https://musicbrainz.org/artist/${data.mbid}/edit?edit-artist.url.0.text=${url}&edit-artist.url.0.link_type_id=194&edit-artist.edit_note=${editNote}`;
			if (data.nameSimilarity < 0.30) {
				dispError(`Artist name too different for match! (${Math.round(data.nameSimilarity * 100)}% - ${data.mbName})`)
				return;
			}
			window.open(editUrl, "_blank");
		} else {
			dispError((await response.json()).error);
		}
	} catch (error) {
		console.error(error);
		dispError(error.message);
	}
}

let toastProperties = {
	position: "top-left",
	autoClose: 5000,
	hideProgressBar: false,
	closeOnClick: false,
	pauseOnHover: true,
	draggable: true,
	progress: undefined,

	transition: Flip,
};
async function dispError(message, type = "error") {
	if (type === "error") {
		toast.error(message, toastProperties);
	} else {
		toast.warn(message, toastProperties);
	}
}


async function dispPromise(promise, message) {
		return toast
			.promise(
				promise,
				{
					pending: message,
					error: "Data not found!",
				},
				toastProperties
			)
			.finally(() => {});
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
