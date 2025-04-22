import styles from '../styles/notices.module.css';

export default function Notice({ data, type }) {
    return (
        <>
            <div className={styles.noticeBox}>
                <div className={styles.boxBorder}></div>
                <div className={styles.topNoticeText}>
                    This artist is not in MusicBrainz
                </div>
                <a
                    className={styles.addToMBButton}
                    href={`https://musicbrainz.org/artist/create?edit-artist.name=${data.name}&edit-artist.sort_name=${data.name}&edit-artist.url.0.text=https://open.spotify.com/artist/${data.spotifyId}&edit-artist.url.0.link_type_id=194&edit-artist.edit_note=Artist sourced from Spotify using SAMBL https://open.spotify.com/artist/6Q7zxRpatEpouz1e7dLbsG`}
                    target="_blank"
                >
                    <div>Add to MusicBranz</div>
                </a>
            </div>
        </>
    )
}