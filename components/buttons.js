import styles from "../styles/buttons.module.css";
export default function AddButtons({ artist }) {
    return (
        <>
            <a
                className={styles.addToMBButton}
                href={`https://musicbrainz.org/artist/create?edit-artist.name=${artist.name}&edit-artist.sort_name=${artist.name}&edit-artist.url.0.text=https://open.spotify.com/artist/${artist.spotifyId}&edit-artist.url.0.link_type_id=194&edit-artist.edit_note=Artist sourced from Spotify using SAMBL https://open.spotify.com/artist/6Q7zxRpatEpouz1e7dLbsG`}
                target="_blank"
            >
                <div>Add to MusicBranz</div>
            </a>
            <a
                className={styles.addToMBButton}
                href="../artist/?spid=6Q7zxRpatEpouz1e7dLbsG&newArtist=true"
                target="_blank"
            >
                <div>View Artist Anyway</div>
            </a>
        </>
    )
}