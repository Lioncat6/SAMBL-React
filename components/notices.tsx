import styles from "../styles/notices.module.css";
import providerColors from '../styles/providerColors.module.css'
import text from "../utils/text";
import editNoteBuilder from "../utils/editNoteBuilder";
import { ArtistPageData } from "../types/component-types";
import { JSX, useState } from "react";
import { FaCircleExclamation, FaCircleInfo, FaXmark } from "react-icons/fa6";
import { Transition } from "@headlessui/react";
import editUrlBuilder from "../utils/editUrlBuilder";
import { useSettingsOrDefaults } from "./SettingsContext";
import { MessageType, ProviderNamespace, SAMBLMessage } from "../types/provider-types";
import { IoWarning } from "react-icons/io5";
import clientProviders from "../utils/clientProviders";

function NoticeBox({ color, text, button }: { color?: string, text?: string | JSX.Element, button?: JSX.Element | null }) {
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
					<div className={`${styles.boxBorder} ${color && styles[color]}`}></div>
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

function ProviderMessageNotice({message}: {message: SAMBLMessage}) {
	const icons: Record<MessageType, JSX.Element> = {
		"warning": <IoWarning />,
		"info": <FaCircleInfo />,
		"error": <FaCircleExclamation />
	}
	const colors: Record<MessageType, string> = {
		"warning": "orange",
		"info": "skyblue",
		"error": "red"
	}
	return (
		<NoticeBox 
			color={colors[message.type]}
			text={<>{message.provider && <span className={`${styles.providerIcon} ${providerColors[message.provider]}`} title={clientProviders.getDisplayName(message.provider)}>{clientProviders.getDisplayIcon(message.provider)}</span>} {icons[message.type]} Provider {text.capitalizeFirst(message.type)}: <code>{message.text}</code></>}
		/>
	)
}



const Notice = {
	noMBID: NoMBIDNotice,
	quickFetched: QuickFetchedNotice,
	aiArtist: AIArtistNotice,
	onHarmony: OnHarmonyNotice,
	notGreen: NotGreenNotice,
	providerMessage: ProviderMessageNotice,
	custom: NoticeBox
}

export default Notice;