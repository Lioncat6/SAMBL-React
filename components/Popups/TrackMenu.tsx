import styles from "../../styles/popups.module.css";
import { FaCopy, FaMagnifyingGlass, FaBarcode } from "react-icons/fa6";
import { MdOutlineAlbum, MdPerson, MdOutlineCalendarMonth, MdOutlineWarningAmber } from "react-icons/md";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import text from "../../utils/text";
import { ProviderNamespace, TrackObject } from "../../types/provider-types";
import { AggregatedAlbum, AggregatedTrack, AlbumStatus, TrackIssue, TrackStatus } from "../../types/aggregated-types";
import Popup from "../Popup";
import { JSX } from "react";

function MbUrlIcon({ status, url, styleClass, isAlbum = true }: { status: AlbumStatus | TrackStatus, url: string, styleClass: string, isAlbum?: boolean }) {
	return (
		<>
			{url && (
				<a href={url} target="_blank" rel="noopener noreferrer">
					<img
						className={styleClass}
						src={status === "green" ? "../assets/images/MusicBrainz_logo_icon.svg" : "../assets/images/MB_Error.svg"}
						alt="MusicBrainz"
						title={status === "green" ? "View on MusicBrainz" : isAlbum ? "Warning: This could be the incorrect MB release for this album!" : "Warning: This could be the incorrect MB recording for this track!"}
					/>
				</a>
			)}
		</>
	)
}

function AlbumDetails({ data }) {
	const {
		provider,
		id,
		name,
		url,
		imageUrl,
		imageUrlSmall,
		albumArtists,
		releaseDate,
		trackCount,
		albumType,
		status,
		mbAlbum,
		highlightTracks,
		upc,
	} = data;

	const barcode = upc || mbAlbum?.upc || null;

	return (
		<div className={styles.albumDetails}>
			{(imageUrlSmall || imageUrl) && (
				<div className={styles.albumCover}>
					<a href={imageUrl} target="_blank" rel="noopener noreferrer">
						<img src={imageUrlSmall || imageUrl} alt={`${name} cover`} loading="lazy" />
					</a>
				</div>
			)}
			<div className={styles.albumInfo}>
				<div className={styles.albumTitle}>
					<a href={url} target="_blank" rel="noopener noreferrer">
						{name}
					</a>
					<MbUrlIcon status={status} url={mbAlbum?.url || ""} styleClass={styles.albumMB} />
				</div>
				<div className={styles.artists}>
					<MdPerson />
					{albumArtists.map((artist, index) => (
						<span key={artist.id}>
							{index > 0 && ", "}
							<a href={artist.url} target="_blank" rel="noopener noreferrer" className={styles.artistLink}>
								{artist.name}
							</a>
							<a href={`../newartist?provider_id=${artist.id}&provider=${artist.provider}`} target="_blank" rel="noopener noreferrer">
								<img className={styles.SAMBLicon} src="../assets/images/favicon.svg" alt="SAMBL" />
							</a>
						</span>
					))}
				</div>
				<span className={styles.releaseDate}><MdOutlineCalendarMonth /> {releaseDate}</span>
				<span className={styles.albumType}><MdOutlineAlbum /> {text.capitalizeFirst(albumType)}</span>
				{barcode && <span className={styles.barcode}><FaBarcode /> {barcode} <a
					className={styles.lookupButton}
					href={`/find?query=${encodeURIComponent(barcode)}`}
					target="_blank"
					rel="noopener noreferrer"
					title={"Lookup Barcode"}
				>
					<FaMagnifyingGlass />
				</a></span>}
			</div>
		</div>
	);
}

function TrackItem({ index, track, album, highlight }: { index: string, track: TrackObject | AggregatedTrack, album: AggregatedAlbum, highlight: boolean }) {
	let mbid: string | null = null;
	let mbUrl: string | null = null;
	let status: TrackStatus = "grey"
	let trackIssues: TrackIssue[] = [];

	if ((track as AggregatedTrack).mbid !== undefined) {
		mbid = (track as AggregatedTrack).mbid;
		mbUrl = (track as AggregatedTrack).mbTrack?.url || null;
		status = (track as AggregatedTrack).status;
		trackIssues = (track as AggregatedTrack).trackIssues;
	}

	function showArtistCredit(): boolean {
		const albumCredit = album.albumArtists;
		const trackCredit = track.trackArtists;
		if (albumCredit?.length > 0 && trackCredit?.length > 0) {
			const albumArtistIds = albumCredit.map((artist) => artist.id);
			const trackArtistIds = trackCredit?.map((artist) => artist.id);
			// Check if credits differ
			return !(albumArtistIds.every((id) => trackArtistIds.includes(id)) && trackArtistIds.every((id) => albumArtistIds.includes(id)));
		}
		return false;
	}

	let pillTooltipText = "There is not enough data to compare this track";

	switch (status) {
		case "green":
			pillTooltipText = "This track has a MB track with a matching URL"
			break;
		case "orange":
			pillTooltipText = "This track does not have a matching URL on MusicBrainz"
		case "blue":
			pillTooltipText = "This track has a matching ISRC, but no URL on MusicBrainz"
	}


	return (
		<div key={index} className={styles.trackContainter}>
			<div className={styles.trackButtonContainer}>
				{/* Copy Button */}
				<button
					className={`${styles.copyButton} ${track.isrcs.length > 0 ? "" : styles.disabled}`}
					onClick={() => text.copy(Array.isArray(track.isrcs) && typeof track[0] === "object" ? JSON.stringify(track, null, 2) : String(track.isrcs))}
					title={track.isrcs.length > 0 ? "Copy to Clipboard" : "No ISRC data available"}
				>
					<FaCopy />
				</button>
				{/* Lookup Button */}
				{track.isrcs.length <= 1 ? (
					<a
						className={`${styles.lookupButton} ${track.isrcs.length > 0 ? "" : styles.disabled}`}
						href={track.isrcs.length ? `/find?query=${encodeURIComponent(track.isrcs[0])}` : undefined}
						target="_blank"
						rel="noopener noreferrer"
						title={track.isrcs.length > 0 ? "Lookup ISRC" : "No ISRC data available"}
					>
						<FaMagnifyingGlass />
					</a>
				) : (
					<Menu as="div" className={styles.isrcDropdownWrapper}>
						<MenuButton className={styles.lookupButton} title="Lookup ISRC">
							<FaMagnifyingGlass />
						</MenuButton>
						<MenuItems className={styles.dropdownMenu} anchor="bottom end">
							{track.isrcs.map((isrc, idx) => (
								<MenuItem key={isrc}>
									<a className={styles.menuItem} href={`/find?query=${encodeURIComponent(isrc)}`} target="_blank" rel="noopener noreferrer">
										{isrc}
									</a>
								</MenuItem>
							))}
						</MenuItems>
					</Menu>
				)}
				<div className={styles.trackNumber}>{(Number(index) + 1).toString().padStart(2, "0")}</div>
				<div className={`${styles.statusPill} ${styles[status]}`} title={pillTooltipText}></div>
			</div>
			<div className={styles.trackInfo}>
				<div className={styles.trackTopRow}>
					<a className={styles.trackTitle} href={track.url || ""} > {track.name}</a> <MbUrlIcon status={status} url={mbUrl || ""} styleClass={styles.trackMB} isAlbum={false} />
					<div className={styles.trackISRCs}>{Array.isArray(track) && typeof track[0] === "object" ? JSON.stringify(track, null, 2) : String(track.isrcs)}</div>
				</div>
				{showArtistCredit() && (
					<div className={styles.trackArtists}>
						{track.trackArtists.map((artist, index) => (
							<span key={artist.id}>
								{index > 0 && ", "}
								<a href={artist.url} target="_blank" rel="noopener noreferrer" className={styles.artistLink}>
									{artist.name}
								</a>
								{artist.provider != "musicbrainz" &&
									<a href={`../newartist?provider_id=${artist.id}&provider=${artist.provider}`} target="_blank" rel="noopener noreferrer">
										<img className={styles.SAMBLicon} src="../assets/images/favicon.svg" alt="SAMBL" />
									</a>
								}
							</span>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

function TrackMenu({ data, close }: { data: AggregatedAlbum, close?: () => void }) {
	let trackData: TrackObject[] | AggregatedTrack[] = [];
	let trackDataSource: ProviderNamespace | null = null as ProviderNamespace | null;
	let hasFullTrackData: boolean = false;
	function getTrackData() {
		if (data.aggregatedTracks?.length > 0) {
			trackData = data.aggregatedTracks;
			hasFullTrackData = true;
		} else if (data.albumTracks?.length > 0) {
			trackData = data.albumTracks;
			trackDataSource = data.provider;
		} else if (data.mbAlbum?.albumTracks && data.mbAlbum.albumTracks.length > 0) {
			trackData = data.mbAlbum.albumTracks;
			trackDataSource = "musicbrainz";
		}
	}
	getTrackData();
	return (
		<>
			<div className={styles.trackBg} style={{ "--background-image": `url(${data.imageUrl})` } as React.CSSProperties} >
				{" "}
				<div className={styles.header}>
					{" "}
					<MdOutlineAlbum /> Tracks for {data.name}
				</div>
			</div>
			<AlbumDetails data={data} />
			{!hasFullTrackData && (
				<div className={styles.noAggregatedTracksWarning}>
					<MdOutlineWarningAmber /> {data.status == "red" && trackData.length > 0 ? "Add this album to musicbrainz to see full track data" : "Refresh this album to see full track data"}
					{trackDataSource && (<div className={styles.trackDataSource}>Currently viewing track data from <span>{text.capitalizeFirst(trackDataSource)}</span></div>)}
				</div>
			)}
			<div className={styles.content}>
				{Object.entries(trackData).map(([key, value]) => {
					return (
						<TrackItem index={key} track={value} album={data} highlight={false} />
					)

				})}
			</div>
			<div className={styles.actions}>
				<button className={styles.button} onClick={close}>
					Close
				</button>
			</div>

		</>
	);
}

export default function TrackMenuPopup({ data, button }: { data: AggregatedAlbum, button?: JSX.Element }) {
    return (
        <Popup button={button}>
            <TrackMenu data={data} />
        </Popup>
    );
}