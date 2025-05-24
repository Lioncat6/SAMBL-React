import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import { useEffect, useState } from "react";
import styles from "../styles/popups.module.css";
import { useSettings } from "./SettingsContext";
import { FaXmark, FaGear, FaFilter, FaCopy, FaMagnifyingGlass, FaChevronDown, FaChevronRight } from "react-icons/fa6";
import { TbTableExport } from "react-icons/tb";
import { useExport } from "./ExportState";
import { toast, Flip } from "react-toastify";
import getConfig from "next/config";
import { MdOutlineAlbum } from "react-icons/md";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";

function ConfigureMenu({ close }) {
	const { publicRuntimeConfig } = getConfig();
	const { settings, updateSettings } = useSettings();
	const [showHarmony, setShowHarmony] = useState(settings.showHarmony);
	const [showATisket, setShowATisket] = useState(settings.showATisket);
	const [showExport, setShowExport] = useState(settings.showExport);
	const [listVirtualization, setListVirtualization] = useState(settings.listVirtualization);
	const saveConfig = () => {
		const newSettings = { showHarmony, showATisket, showExport, listVirtualization };
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
					<div className="checkbox-wrapper">
						<input type="checkbox" className="substituted" id="showHarmony" checked={showHarmony} onChange={(e) => setShowHarmony(e.target.checked)} />
						<label htmlFor="showHarmony">Show Harmony Button</label>
					</div>
					<div className="checkbox-wrapper">
						<input type="checkbox" id="showATisket" checked={showATisket} onChange={(e) => setShowATisket(e.target.checked)} className="substituted" />
						<label htmlFor="showATisket">Show A-tisket Button</label>
					</div>
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

function FilterMenu({ close, data, apply }) {
	const [filter, setFilter] = useState({ ...data });
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
	let toastProperties = {
		position: "top-left",
		autoClose: 5000,
		hideProgressBar: false,
		closeOnClick: false,
		pauseOnHover: true,
		draggable: true,
		progress: undefined,
		transition: Flip,
	};

	function handleCopy(text, all) {
		if (text.length > 0) {
			navigator.clipboard.writeText(text);
			toast.info(`Copied ${all ? "All Properties" : "Property"} to Clipboard`, toastProperties);
		}
	}

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
	let toastProperties = {
		position: "top-left",
		autoClose: 5000,
		hideProgressBar: false,
		closeOnClick: false,
		pauseOnHover: true,
		draggable: true,
		progress: undefined,
		transition: Flip,
	};
	function handleCopy(text, all) {
		if (text.length > 0) {
			navigator.clipboard.writeText(text);
			toast.info(`Copied ${all ? "All Properties" : "Property"} to Clipboard`, toastProperties);
		}
	}

	return (
		<>
			{" "}
			<div className={styles.header}>
				{" "}
				<TbTableExport /> Export Item{" "}
			</div>
			<div className={styles.content}>
				{Object.entries(data).map(([key, value]) => {
					// If value is an array of objects, display subkeys and values
					if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object" && !Array.isArray(value[0])) {
						const [expanded, setExpanded] = useState(false);
						return (
							<div key={key} className={styles.propertyRow}>
								<div className={styles.property}>
									<CopyButton value={value} />
									{key}
								</div>
								<button className={styles.expandButton} onClick={() => setExpanded(!expanded)} title={expanded ? "Collapse" : "Expand"}>
									{expanded ? <FaChevronRight /> : <FaChevronDown />}
								</button>
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
															<strong>
																{" "}
																{value.length == 1 && (
																	<div className={styles.subPropertyDataKey}>
																		<CopyButton value={String(subValue)} />
																	</div>
																)}
																{subKey}
															</strong>{" "}
															{typeof subValue == "object" && !Array.isArray(subValue) ? JSON.stringify(subValue) : String(subValue)}
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
								<div className={styles.propertyData}>{!value ? "" : Array.isArray(value) && typeof value[0] === "object" ? JSON.stringify(value, null, 2) : String(value)}</div>
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

function TrackMenu({ data, close }) {
	let toastProperties = {
		position: "top-left",
		autoClose: 5000,
		hideProgressBar: false,
		closeOnClick: false,
		pauseOnHover: true,
		draggable: true,
		progress: undefined,
		transition: Flip,
	};

	function handleCopy(text, all) {
		if (text.length > 0) {
			navigator.clipboard.writeText(text);
			toast.info(`Copied ${all ? "All ISRCs" : "ISRCs"} to Clipboard`, toastProperties);
		}
	}
	return (
		<>
			{" "}
			<div className={styles.header}>
				{" "}
				<MdOutlineAlbum /> Tracks for {data.spotifyName}
			</div>
			<div className={styles.content}>
				{Object.entries(data.mbTrackISRCs).map(([key, value]) => {
					return (
						<div key={key} className={styles.propertyRow}>
							<div className={styles.property}>
								<button
									className={`${styles.copyButton} ${value.isrcs.length > 0 ? "" : styles.disabled}`}
									onClick={() => handleCopy(Array.isArray(value.isrcs) && typeof value[0] === "object" ? JSON.stringify(value, null, 2) : String(value.isrcs))}
									title={value.isrcs.length > 0 ? "Copy to Clipboard" : "No data available"}
								>
									<FaCopy />
								</button>
								{value.isrcs.length <= 1 ? (
									<a
										className={`${styles.lookupButton} ${value.isrcs.length > 0 ? "" : styles.disabled}`}
										href={value.isrcs.length ? `/find?query=${encodeURIComponent(value.isrcs[0])}` : undefined}
										target="_blank"
										rel="noopener noreferrer"
										title={value.isrcs.length > 0 ? "Lookup ISRC" : "No data available"}
										style={{ pointerEvents: value.isrcs.length > 0 ? "auto" : "none" }}
									>
										<FaMagnifyingGlass />
									</a>
								) : (
									<Menu as="div" className={styles.isrcDropdownWrapper}>
										<MenuButton className={styles.lookupButton} title="Lookup ISRC">
											<FaMagnifyingGlass />
										</MenuButton>
										<MenuItems className={styles.dropdownMenu} anchor="bottom end">
											{value.isrcs.map((isrc, idx) => (
												<MenuItem key={isrc}>
													<a className={styles.menuItem} href={`/find?query=${encodeURIComponent(isrc)}`} target="_blank" rel="noopener noreferrer">
														{isrc}
													</a>
												</MenuItem>
											))}
										</MenuItems>
									</Menu>
								)}
								<div className={styles.trackNumber}>{(Number(key) + 1).toString().padStart(2, "0")}</div> {value.name}
							</div>
							<div className={styles.propertyData}>{Array.isArray(value) && typeof value[0] === "object" ? JSON.stringify(value, null, 2) : String(value.isrcs)}</div>
						</div>
					);
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
	return (
		<>
			<Popup trigger={button} position="right center" modal nested>
				{(close) => (
					<div className={styles.modal}>
						<button className={styles.close} onClick={close}>
							<FaXmark />
						</button>
						{type == "configure" && <ConfigureMenu close={close} />}
						{type == "filter" && <FilterMenu close={close} data={data} apply={apply} />}
						{type == "export" && <ExportMenu close={close} data={data} />}
						{type == "track" && <TrackMenu close={close} data={data} />}
					</div>
				)}
			</Popup>
		</>
	);
}
