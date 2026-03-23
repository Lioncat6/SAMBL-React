import styles from "../styles/notices.module.css";
import text from "../utils/text";
import editNoteBuilder from "../utils/editNoteBuilder";
import { ArtistPageData } from "../types/component-types";
import { JSX, useState } from "react";
import { FaXmark } from "react-icons/fa6";
import { Transition } from "@headlessui/react";
import editUrlBuilder from "../utils/editUrlBuilder";

function NoticeBox({ color, text, button}: {color: string, text: string, button?: JSX.Element | null}) {
	const [visible, setVisible] = useState(true);
	function dismiss(){
		setVisible(false);
	}
	return (
		<>
			<Transition 
				show={visible}
				// as={Fragment}
				leave={styles.noticeLeave}
				leaveFrom={styles.noticeLeaveFrom}
				leaveTo={styles.noticeLeaveTo}
			>
				<div className={styles.noticeBox}>
					<div className={`${styles.boxBorder} ${styles[color]}`}></div>
					<div className={styles.noticeContent}>
						<div className={styles.topNoticeText}>{text}</div>
						{button}
					</div>
					<button title={"Dismiss"} className={styles.dismiss} onClick={dismiss}>
						<FaXmark />
					</button>
				</div>
			</Transition>
		</>
	);
}

function NoMBIDNotice({data}: {data?: ArtistPageData | null}) {
	if (!data) {
		return (
			<NoticeBox color="red"
			text={`This artist is not in MusicBrainz`} />
		)
	}
	const url = data.url || "";
	return (
		<NoticeBox
			color="red"
			text={`This artist is not in MusicBrainz`}
			button={
				<a
					className={styles.addToMBButton}
					href={editUrlBuilder.buildAddArtistEditUrl(data)}
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
	function noQuickfetch() {
		window.location.assign(window.location.href + "&quickFetch=false");
	}
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
			button={
				<a href="https://en.wikipedia.org/wiki/AI_slop#In_music" rel="noopener" target="_blank" className={styles.addToMBButton}>
					Learn More
				</a>
			}
		/>
	);
}

export default function Notice({ data, type }: {data?: null | ArtistPageData, type:  "noMBID" | "quickFetched" | "aiArtist"}) {
	if (type === "noMBID") {
		return <NoMBIDNotice data={data} />;
	} else if (type === "quickFetched") {
		return <QuickFetchedNotice />;
	} else if (type === "aiArtist") {
		return <AIArtistNotice />;
	}
}