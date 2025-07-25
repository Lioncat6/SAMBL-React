import styles from "../styles/notices.module.css";

function NoticeBox({ color, text, button }) {
	return (
		<div className={styles.noticeBox}>
			<div className={`${styles.boxBorder} ${styles[color]}`}></div>
			<div className={styles.topNoticeText}>{text}</div>
            {button}
		</div>
	);
}

function noQuickfetch() {
	window.location.assign(window.location.href + "&quickFetch=false");
}

export default function Notice({ data, type }) {
	if (type === "noMBID") {
		return (
			<NoticeBox
				color="red"
				text={`This artist is not in MusicBrainz`}
				button={
					<a
						className={styles.addToMBButton}
						href={`https://musicbrainz.org/artist/create?edit-artist.name=${data.name}&edit-artist.sort_name=${data.name}&edit-artist.url.0.text=https://open.spotify.com/artist/${data.spotifyId}&edit-artist.url.0.link_type_id=194&edit-artist.edit_note=Artist sourced from Spotify using SAMBL https://open.spotify.com/artist/6Q7zxRpatEpouz1e7dLbsG`}
						target="_blank"
						rel="noopener noreferrer"
					>
						<div>Add to MusicBranz</div>
					</a>
				}
			/>
		);
	} else if (type === "quickFetched") {
		return (
			<>
				<NoticeBox
					color="skyblue"
					text={`This artist has been Quick Fetched. Some data will be missing.`}
					button={
						<button
							className={styles.addToMBButton}
							onClick={() => {
								noQuickfetch();
							}}
						>
							Reload without Quickfetching
						</button>
					}
				/>
			</>
		);
	}
}
