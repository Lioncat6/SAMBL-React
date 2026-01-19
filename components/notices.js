import styles from "../styles/notices.module.css";
import text from "../utils/text";
import editNoteBuilder from "../utils/editNoteBuilder";

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

function NoMBIDNotice(data) {
	let editNote = editNoteBuilder.buildEditNote('Artist', data.provider, data.url, data.url);
	return (
		<NoticeBox
			color="red"
			text={`This artist is not in MusicBrainz`}
			button={
				<a
					className={styles.addToMBButton}
					href={`https://musicbrainz.org/artist/create?edit-artist.name=${data.name}&edit-artist.sort_name=${data.name}&edit-artist.url.0.text=${data.url}&edit-artist.url.0.link_type_id=194&edit-artist.edit_note=${editNote}`}
					target="_blank"
					rel="noopener noreferrer"
				>
					<div>Add to MusicBrainz</div>
				</a>
			}
		/>
	);
}

function QuickFetchedNotice() {
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

function AIArtistNotice() {
	return (
		<NoticeBox
			color="orange"
			text={`This artist uses partially or entirely AI-generated content.`}
		/>
	);
}

export default function Notice({ data, type }) {
	if (type === "noMBID") {
		return <NoMBIDNotice data={data} />;
	} else if (type === "quickFetched") {
		return <QuickFetchedNotice />;
	} else if (type === "aiArtist") {
		return <AIArtistNotice />;
	}
}