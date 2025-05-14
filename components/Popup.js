import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import { useEffect, useState } from "react";
import styles from "../styles/popups.module.css";
import { useSettings } from "./SettingsContext";
import { FaXmark, FaGear, FaFilter, FaCopy } from "react-icons/fa6";
import { TbTableExport } from "react-icons/tb";
import { useExport } from "./ExportState"
import { toast, Flip } from "react-toastify"

function ConfigureMenu({ close }) {
	const { settings, updateSettings } = useSettings();
	const [showHarmony, setShowHarmony] = useState(settings.showHarmony);
	const [showATisket, setShowATisket] = useState(settings.showATisket);
	const [listVirtualization, setListVirtualization] = useState(settings.listVirtualization);
	const saveConfig = () => {
		const newSettings = { showHarmony, showATisket, listVirtualization };
		updateSettings(newSettings);
		close();
	};

	return (
		<>
			{" "}
			<div className={styles.header}>
				{" "}
				<FaGear /> Configure SAMBL{" "}
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
					<br />
					<div className="checkbox-wrapper">
						<input type="checkbox" id="listVirtualization" checked={listVirtualization} onChange={(e) => setListVirtualization(e.target.checked)} className="substituted" />
						<label htmlFor="listVirtualization" title="Enable list virtualization for artists over a certain amount of albums to speed up filtering. Disable for userscript compatibility." className={styles.info}>Enable List virtualization</label>
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
	}

	function handleCopy(text, all) {
		navigator.clipboard.writeText(text)
		toast.info(`Copied ${all ? "All Properties" : "Property"} to Clipboard`, toastProperties)
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
					return (
						<div key={key} className={styles.propertyRow}>
							<div className={styles.property}>
								<button
									className={styles.copyButton}
									onClick={() => handleCopy(Array.isArray(value) && typeof value[0] === "object" ? JSON.stringify(value, null, 2) : String(value))}
									title="Copy to Clipboard"
								>
									<FaCopy />
								</button>{" "}
								{key}
							</div>
							<div className={styles.propertyData}>{Array.isArray(value) && typeof value[0] === "object" ? JSON.stringify(value, null, 2) : String(value)}</div>
						</div>
					);
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
					</div>
				)}
			</Popup>
		</>
	);
}
