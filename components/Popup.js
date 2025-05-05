import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import { useEffect, useState } from "react";
import styles from "../styles/popups.module.css";
import { useSettings } from "./SettingsContext";
import { FaXmark, FaGear, FaFilter, FaCopy } from "react-icons/fa6";
import { TbTableExport } from "react-icons/tb";
import { useExportData } from "./Export";

function ConfigureMenu({ close }) {
	const { settings, updateSettings } = useSettings();
	const [showHarmony, setShowHarmony] = useState(settings.showHarmony);
	const [showATisket, setShowATisket] = useState(settings.showATisket);

	const saveConfig = () => {
		const newSettings = { showHarmony, showATisket };
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

function ExportMenu({ close }) {
	const exportData = useExportData();
	console.log(exportData())

	return (
		<>
			{" "}
			<div className={styles.header}>
				{" "}
				<TbTableExport /> Export Data{" "}
			</div>
			<div className={styles.content}>
				<div className={styles.configureMenu}>

				</div>
			</div>
			<div className={styles.actions}>
				<button
					className={styles.button}
					onClick={() => {

					}}
				>
					<FaCopy />	Copy
				</button>
			</div>
		</>
	)
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
					{type == "export" && <ExportMenu close={close} />}
				</div>
			)}
		</Popup>
		</>
	);
}
