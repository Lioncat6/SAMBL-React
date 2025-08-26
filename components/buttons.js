import styles from "../styles/buttons.module.css";
import Link from "next/link";
import ArtistInfo from "./ArtistInfo";
export default function AddButtons({ artist }) {
	let editNote = `Artist sourced from ${artist.provider.charAt(0).toUpperCase() + artist.provider.slice(1)} using SAMBL (Streaming Artist MusicBrainz Lookup) https://open.spotify.com/artist/${artist.spotifyId}`;
	let addUrl = `https://musicbrainz.org/artist/create?edit-artist.name=${artist.name}&edit-artist.sort_name=${artist.name}&edit-artist.url.0.text=${artist.url}&edit-artist.url.0.link_type_id=194&edit-artist.edit_note=${encodeURIComponent(editNote)}`
	return (
		<>
			<a
				className={styles.addToMBButton}
				href={ addUrl }
				target="_blank"
			>
				<div>Add to MusicBranz</div>
			</a>
			<Link className={styles.addToMBButton} href={`../artist/?provider_id=${artist.id}&provider=${artist.provider}`}>
				<div>View Artist Anyway</div>
			</Link>
		</>
	);
}
