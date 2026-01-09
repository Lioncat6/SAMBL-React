import { useEffect, useState, Fragment, cloneElement } from "react";
import styles from "../styles/popups.module.css";
import { useSettings } from "./SettingsContext";
import { FaXmark, FaGear, FaFilter, FaCopy, FaMagnifyingGlass, FaChevronDown, FaChevronRight, FaBarcode, FaCaretDown } from "react-icons/fa6";
import { TbTableExport } from "react-icons/tb";
import { useExport } from "./ExportState";
import { toast, Flip, ToastOptions } from "react-toastify";
import getConfig from "next/config";
import { MdOutlineAlbum, MdPerson, MdOutlineCalendarMonth, MdDoNotDisturbOnTotalSilence, MdOutlineWarningAmber } from "react-icons/md";
import { Dialog, Transition, Menu, MenuButton, MenuItem, MenuItems, TransitionChild, DialogPanel, Listbox, ListboxButton, ListboxOption, ListboxOptions, Label } from "@headlessui/react";
import text from "../utils/text";
import seeders from "../lib/seeders/seeders";
import { ProviderNamespace, TrackObject } from "../pages/api/providers/provider-types";
import { AggregatedAlbum, AggregatedTrack, AlbumStatus, TrackIssue, TrackStatus } from "../utils/aggregated-types";

let toastProperties: ToastOptions = {
	position: "top-left",
	autoClose: 5000,
	hideProgressBar: false,
	closeOnClick: false,
	pauseOnHover: true,
	draggable: true,
	progress: undefined,
	transition: Flip,
};

function handleCopy(text: string, all: boolean = false) {
	if (text.length > 0) {
		navigator.clipboard.writeText(text);
		toast.info(`Copied ${all ? "All Properties" : "Property"} to Clipboard`, toastProperties);
	}
}

function ConfigureMenu({ close }) {
	const { publicRuntimeConfig } = getConfig();
	const { settings, updateSettings } = useSettings();
	const [enabledSeeders, setEnabledSeeders] = useState(settings.enabledSeeders);
	const [showExport, setShowExport] = useState(settings.showExport);
	const [listVirtualization, setListVirtualization] = useState(settings.listVirtualization);
	const [quickFetchThreshold, setQuickFetchThreshold] = useState(settings.quickFetchThreshold);
	const saveConfig = () => {
		const newSettings = { enabledSeeders, showExport, listVirtualization, quickFetchThreshold };
		updateSettings(newSettings);
		close();
	};

	return (
		<>
			{" "}
			<div className={styles.header}>
				{" "}
				<FaGear /> Configure SAMBL <p className={styles.version}>{publicRuntimeConfig?.version}</p>
			</div>
			<div className={styles.content}>
				<div className={styles.configureMenu}>
					{seeders.getAllSeeders().map((seeder) => (
						<div key={seeder.namespace} className="checkbox-wrapper">
							<input
								type="checkbox"
								id={`seeder-${seeder.namespace}`}
								checked={enabledSeeders?.includes(seeder.namespace)}
								onChange={(e) => {
									if (e.target.checked) {
										setEnabledSeeders([...enabledSeeders, seeder.namespace]);
									} else {
										setEnabledSeeders(enabledSeeders.filter((ns) => ns !== seeder.namespace));
									}
								}}
								className="substituted"
							/>
							<label htmlFor={`seeder-${seeder.namespace}`}>Show {seeder.displayName} button</label>
						</div>
					))}
					<br />
					<div className="checkbox-wrapper">
						<input type="checkbox" id="showExport" checked={showExport} onChange={(e) => setShowExport(e.target.checked)} className="substituted" />
						<label htmlFor="showExport">Always show export Button</label>
					</div>
					<br />
					<div className="checkbox-wrapper">
						<input type="checkbox" id="listVirtualization" checked={listVirtualization} onChange={(e) => setListVirtualization(e.target.checked)} className="substituted" />
						<label htmlFor="listVirtualization" title="Enable list virtualization for artists over a certain amount of albums to speed up filtering. Disable for userscript compatibility." className={styles.info}>
							Enable List virtualization
						</label>
					</div>
					<div className={styles.settingsInputWrapper}>
						<input className={styles.settingsInput} type="number" id="quickFetchThreshold" value={quickFetchThreshold} onChange={(e) => setQuickFetchThreshold(Number(e.target.value))} />
						<label htmlFor="quickFetchThreshold">Quick Fetch Threshold (Albums)</label>
					</div>
				</div>
			</div>
			<div className={styles.actions}>
				<button
					className={styles.button}
					onClick={() => {
						saveConfig();
					}}
				>
					Save
				</button>
			</div>
		</>
	);
}

function SelectedItem({ item, onRemove, exclusive }) {
	return <div className={`${styles.selectedItem}  ${exclusive && styles.exclusive}`}><span className={styles.selectedItemName}>{item.name}</span><div className={styles.selectedItemButton} onClick={onRemove}><FaXmark /></div></div>;
}

function FilterMenu({ close, data, apply }) {
	const listFilterOptions = [
		{ id: 1, name: 'Green', key: 'showGreen' },
		{ id: 2, name: 'Orange', key: 'showOrange' },
		{ id: 3, name: 'Red', key: 'showRed' },
		{ id: 4, name: 'Various Artists', key: 'showVarious' },
		{ id: 5, name: 'Album Issues', key: 'onlyIssues', exclusive: true },
	]
	const [filter, setFilter] = useState({ ...data });
	const [selectedOptions, setSelectedOptions] = useState([listFilterOptions[0], listFilterOptions[1], listFilterOptions[2]]);

	return (
		<>
			{" "}
			<div className={styles.header}>
				{" "}
				<FaFilter /> Filter Items{" "}
			</div>
			<div className={styles.content}>
				<div className={styles.configureMenu}>
					<div className="checkbox-wrapper">
						<input
							type="checkbox"
							className="substituted"
							id="showGreen"
							checked={filter.showGreen}
							onChange={(e) => {
								setFilter({ ...filter, showGreen: e.target.checked });
							}}
						/>
						<label htmlFor="showGreen">Show Green</label>
					</div>
					<div className="checkbox-wrapper">
						<input
							type="checkbox"
							className="substituted"
							id="showOrange"
							checked={filter.showOrange}
							onChange={(e) => {
								setFilter({ ...filter, showOrange: e.target.checked });
							}}
						/>
						<label htmlFor="showOrange">Show Orange</label>
					</div>
					<div className="checkbox-wrapper">
						<input
							type="checkbox"
							className="substituted"
							id="showRed"
							checked={filter.showRed}
							onChange={(e) => {
								setFilter({ ...filter, showRed: e.target.checked });
							}}
						/>
						<label htmlFor="showRed">Show Red</label>
					</div>
					<br />
					<div className="checkbox-wrapper">
						<input
							type="checkbox"
							className="substituted"
							id="showVarious"
							checked={filter.showVarious}
							onChange={(e) => {
								setFilter({ ...filter, showVarious: e.target.checked });
							}}
						/>
						<label htmlFor="showVarious">Show Various Artists</label>
					</div>
					<div className="checkbox-wrapper">
						<input
							type="checkbox"
							className="substituted"
							id="onlyIssues"
							checked={filter.onlyIssues}
							onChange={(e) => {
								setFilter({ ...filter, onlyIssues: e.target.checked });
							}}
						/>
						<label htmlFor="onlyIssues">Only Albums With Issues</label>
					</div>
					<Listbox value={selectedOptions} onChange={setSelectedOptions} multiple>
						{({ open }) => (
							<>
								<Label className={styles.selectLabel}>Status Filter</Label>
								<ListboxButton className={styles.selectBox}>
									<FaCaretDown className={`${styles.carrot} ${open && styles.open}`} />
									{selectedOptions.map((item) => (
										<SelectedItem
											key={item.id}
											item={item}
											exclusive={item.exclusive}
											onRemove={() => setSelectedOptions(selectedOptions.filter((option) => option.id !== item.id))}
										/>
									))}
								</ListboxButton>
								<Transition
									show={open}
									as={Fragment}
									enter={styles.selectOptionsEnter}
									enterFrom={styles.selectOptionsEnterFrom}
									enterTo={styles.selectOptionsEnterTo}
									leave={styles.selectOptionsLeave}
									leaveFrom={styles.selectOptionsLeaveFrom}
									leaveTo={styles.selectOptionsLeaveTo}
								>
									<ListboxOptions anchor="bottom" className={styles.selectOptions}>
										{listFilterOptions.map((option) => (
											<ListboxOption key={option.id} value={option} as={Fragment}>
												{({ focus, selected }) => (
													<div className={`${styles.selectOption} ${focus ? styles.focused : ""} ${selected ? styles.selected : ""}  ${option.exclusive && styles.exclusive}`}>
														<div className={styles.optionTextContainer}><span className={styles.optionText}>{option.name} {option.exclusive && <span className={styles.exclusiveIcon} title="Shows items that only match this filter"><MdDoNotDisturbOnTotalSilence /></span>}</span></div>
														{selected && <FaXmark />}
													</div>
												)}
											</ListboxOption>
										))}
									</ListboxOptions>
								</Transition>
							</>
						)}
					</Listbox>
				</div>
			</div>
			<div className={styles.actions}>
				<button
					className={styles.button}
					onClick={() => {
						apply(filter);
						close();
					}}
				>
					Apply
				</button>
			</div>
		</>
	);
}

function CopyButton({ value }) {

	return (
		<button
			className={`${styles.copyButton} ${value?.toString().length > 0 ? "" : styles.disabled}`}
			onClick={() => handleCopy(Array.isArray(value) && typeof value[0] === "object" ? JSON.stringify(value, null, 2) : String(value))}
			title={value?.toString().length > 0 ? "Copy to Clipboard" : "No data available to copy"}
			disabled={value?.toString().length > 0 ? false : true}
		>
			<FaCopy />
		</button>
	);
}

function ExportMenu({ data, close }) {

	return (
		<>
			{" "}
			<div className={styles.header}>
				{" "}
				<TbTableExport /> Export Item{" "}
			</div>
			<div className={styles.content}>
				{Object.entries(data).map(([key, value]) => {
					if ((typeof value === "object" && value !== null && !Array.isArray(value))) {
						value = [value];
					}
					// If value is an array of objects, display subkeys and values
					if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object" && !Array.isArray(value[0])) {
						const [expanded, setExpanded] = useState(false);
						return (
							<div key={key} className={`${styles.propertyRow} ${expanded ? styles.expanded : ""}`}>
								<div className={styles.property}>
									<CopyButton value={value} />
									{key}
									<button className={styles.expandButton} onClick={() => setExpanded(!expanded)} title={expanded ? "Collapse" : "Expand"}>
										{expanded ? <FaChevronRight /> : <FaChevronDown />}
									</button>
								</div>

								{expanded ? (
									<div className={styles.propertyData}>
										{value.map((subObj, subIndex) => (
											<div key={subIndex} className={styles.subPropertyRow}>
												{value.length > 1 && (
													<div className={styles.subKey}>
														<CopyButton value={JSON.stringify(subObj)} />
														{String(subIndex)}
													</div>
												)}
												<div className={styles.subPropertyDataColumn}>
													{Object.entries(subObj).map(([subKey, subValue]) => (
														<div key={subKey} className={styles.subPropertyData}>
															<div className={styles.subPropertyDataKey}>
																<CopyButton value={typeof subValue == "object" && !Array.isArray(subValue) && subValue !== null ? JSON.stringify(subValue) : Array.isArray(subValue) && typeof subValue[0] == "object" ? JSON.stringify(subValue) : subValue != null ? String(subValue) : ""} />

																{subKey}
															</div>
															<div className={styles.subPropertyDataValue}>{typeof subValue == "object" && !Array.isArray(subValue) && subValue !== null ? JSON.stringify(subValue) : Array.isArray(subValue) && typeof subValue[0] == "object" ? JSON.stringify(subValue) : subValue != null ? String(subValue) : ""}</div>
														</div>
													))}
												</div>
											</div>
										))}
									</div>
								) : (
									<div className={styles.propertyData}>{!value ? "" : Array.isArray(value) && typeof value[0] === "object" ? JSON.stringify(value, null, 2) : String(value)}</div>
								)}
							</div>
						);
					} else {
						return (
							<div key={key} className={styles.propertyRow}>
								<div className={styles.property}>
									{" "}
									<CopyButton value={value} />
									{key}
								</div>
								<div className={styles.propertyData}>{!value ? "" : (Array.isArray(value) && typeof value[0] === "object") ? JSON.stringify(value, null, 2) : String(value)}</div>
							</div>
						);
					}
				})}
			</div>
			<div className={styles.actions}>
				<button
					className={styles.button}
					onClick={() => {
						handleCopy(JSON.stringify(data, null, 2), true);
					}}
				>
					<FaCopy /> Copy All
				</button>
			</div>
		</>
	);
}

function MbUrlIcon({status, url, styleClass}: {status: AlbumStatus | TrackStatus, url: string, styleClass: string}) {
	return (
		<>
			{url && (
				<a href={url} target="_blank" rel="noopener noreferrer">
					<img
						className={styleClass}
						src={status === "green" ? "../assets/images/MusicBrainz_logo_icon.svg" : "../assets/images/MB_Error.svg"}
						alt="MusicBrainz"
						title={status === "green" ? "View on MusicBrainz" : "Warning: This could be the incorrect MB release for this album!"}
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

	const barcode = upc || mbAlbum.upc;

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

	switch(status) {
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
					onClick={() => handleCopy(Array.isArray(track.isrcs) && typeof track[0] === "object" ? JSON.stringify(track, null, 2) : String(track.isrcs))}
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
					<a className={styles.trackTitle} href={track.url || ""} > {track.name}</a> <MbUrlIcon status={status} url={mbUrl || ""} styleClass={styles.trackMB} />
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
								<a href={`../newartist?provider_id=${artist.id}&provider=${artist.provider}`} target="_blank" rel="noopener noreferrer">
									<img className={styles.SAMBLicon} src="../assets/images/favicon.svg" alt="SAMBL" />
								</a>
							</span>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

function TrackMenu({ data, close }: { data: AggregatedAlbum, close: () => void }) {
	let trackData: TrackObject[] | AggregatedTrack[] = [];
	let trackDataSource: ProviderNamespace | null = null as ProviderNamespace | null;
	let hasFullTrackData: boolean = false;
	function getTrackData() {
		if (data.aggregatedTracks?.length > 0){
			trackData = data.aggregatedTracks;
			hasFullTrackData = true;
		} else if ( data.albumTracks?.length > 0) {
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
					<MdOutlineWarningAmber /> Refresh this album to see full track data
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

export default function SAMBLPopup({ button, type, data, apply }) {
	const [isOpen, setIsOpen] = useState(false);

	function closeModal() {
		setIsOpen(false);
	}

	function openModal(e) {
		e?.preventDefault?.();
		setIsOpen(true);
	}

	return (
		<>
			{/* Render the trigger button */}
			{button &&
				// Clone the passed element and add onClick
				typeof button === "object" &&
				button !== null &&
				"type" in button ? (
				// React element: clone and add onClick
				// eslint-disable-next-line react/jsx-props-no-spreading
				cloneElement(button, { onClick: openModal })
			) : (
				// Not a React element: fallback to span
				<span onClick={openModal}>{button}</span>
			)}

			<Transition appear show={isOpen} as={Fragment}>
				<Dialog as="div" className={styles.dialogRoot} onClose={closeModal}>
					<TransitionChild as={Fragment} enter={styles.overlayEnter} enterFrom={styles.overlayEnterFrom} enterTo={styles.overlayEnterTo} leave={styles.overlayLeave} leaveFrom={styles.overlayLeaveFrom} leaveTo={styles.overlayLeaveTo}>
						<div className={styles.dialogBackdrop} aria-hidden="true" />
					</TransitionChild>
					<div className={styles.dialogContainer}>
						<TransitionChild as={Fragment} enter={styles.dialogEnter} enterFrom={styles.dialogEnterFrom} enterTo={styles.dialogEnterTo} leave={styles.dialogLeave} leaveFrom={styles.dialogLeaveFrom} leaveTo={styles.dialogLeaveTo}>
							<DialogPanel className={styles.modal}>
								<button className={styles.close} onClick={closeModal}>
									<FaXmark />
								</button>
								{type === "configure" && <ConfigureMenu close={closeModal} />}
								{type === "filter" && <FilterMenu close={closeModal} data={data} apply={apply} />}
								{type === "export" && <ExportMenu close={closeModal} data={data} />}
								{type === "track" && <TrackMenu close={closeModal} data={data} />}
							</DialogPanel>
						</TransitionChild>
					</div>
				</Dialog>
			</Transition>
		</>
	);
}
