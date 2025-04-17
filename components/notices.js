import styles from '../styles/notices.module.css';

export default function NotInMBNotice({ artist }) {
    return (
        <>
            <div className={styles.topNotice}>
                <div className={styles.topNoticeText}>
                    This artist is not in MusicBrainz.
                </div>
                <a
                    className={styles.addToMBButton}
                    href={`https://musicbrainz.org/artist/create?edit-artist.name=${artist.name}&edit-artist.sort_name=${artist.name}&edit-artist.url.0.text=https://open.spotify.com/artist/${artist.spotifyId}&edit-artist.url.0.link_type_id=194&edit-artist.edit_note=Artist sourced from Spotify using SAMBL https://open.spotify.com/artist/6Q7zxRpatEpouz1e7dLbsG`}
                    target="_blank"
                >
                    <div>Add to MusicBranz</div>
                </a>
            </div>
        </>
    )
}