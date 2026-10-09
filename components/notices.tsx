import styles from "../styles/notices.module.css";
import text from "../utils/text";
import editNoteBuilder from "../utils/editNoteBuilder";
import { ArtistPageData } from "../types/component-types";
import { JSX, useState } from "react";
import { FaXmark } from "react-icons/fa6";
import { Transition } from "@headlessui/react";
import editUrlBuilder from "../utils/editUrlBuilder";
import { useSettingsOrDefaults } from "./SettingsContext";

function NoticeBox({ color, text, button }: { color: string, text?: string, button?: JSX.Element | null }) {
	const [visible, setVisible] = useState(true);
	function dismiss() {
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

function NoMBIDNotice({ data }: { data?: ArtistPageData | null }) {
	const { settings } = useSettingsOrDefaults();
	if (!data?.id) {
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
					href={editUrlBuilder.buildAddArtistEditUrl(data, settings.targetBaseUrl)}
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

function OnHarmonyNotice({ url }: { url: string }) {
	return (
		<NoticeBox
			color="purple"
			text={`This provider is available on Harmony`}
			button={
				<a href={url} rel="noopener" target="_blank" className={styles.addToMBButton}>
					Lookup on Harmony
				</a>
			}
		/>
	);
}

function NotGreenNotice() {
	return (
		<NoticeBox
			color="orange"
			text={`This release is not linked with a URL. Please verify it is correct before submitting any additional data`}
		/>
	);
}

type NoticeType =
	"noMBID" |
	"quickFetched" |
	"aiArtist" |
	"onHarmony" |
	"notGreen"

export default function Notice({ data, type, text, color, button }: { data?: any, type?: NoticeType, text?: string, color?: string, button?: JSX.Element }): JSX.Element | null {
	if (type === "noMBID") {
		return <NoMBIDNotice data={data} />;
	} else if (type === "quickFetched") {
		return <QuickFetchedNotice />;
	} else if (type === "aiArtist") {
		return <AIArtistNotice />;
	} else if (type === "onHarmony") {
		return <OnHarmonyNotice url={data} />
	} else if (type === "notGreen") {
		return <NotGreenNotice />
	} else {
		return <NoticeBox
			color={color ?? "orange"}
			text={text}
			button={button}
		/>
	}
	return null;
}