import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import { useEffect, useState } from "react";
import styles from "../styles/popups.module.css";
import { useSettings } from "./SettingsContext";
import { FaXmark, FaGear, FaFilter, FaCopy } from "react-icons/fa6";
import { TbTableExport } from "react-icons/tb";
import { useExport } from "./ExportState"


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

// function ExportMenu({ close }) {
// 	const { selectedData } = useExport();
// 	const [selectedProperties, setSelectedProperties] = useState([]);

// 	const exportableProperties = Array.from(
// 		new Set(
// 			Object.values(selectedData).flatMap((entry) => Object.keys(entry))
// 		)
// 	);

// 	function toggleProperty(field) {
// 		setSelectedProperties((prevSelected) => {
// 			if (prevSelected.includes(field)) {
// 				// Remove the field if it's already selected
// 				return prevSelected.filter((selectedField) => selectedField !== field);
// 			} else {
// 				// Add the field if it's not selected
// 				return [...prevSelected, field];
// 			}
// 		});
// 	}

// 	const handleCopy = () => {
// 		const filteredData = Object.fromEntries(
// 			Object.entries(selectedData).map(([key, value]) => [
// 				key,
// 				Object.fromEntries(
// 					Object.entries(value).filter(([field]) =>
// 						selectedProperties.includes(field)
// 					)
// 				),
// 			])
// 		);
// 		navigator.clipboard.writeText(JSON.stringify(filteredData, null, 2));
// 		close();
// 	};

// 	return (
// 		<>
// 			<div className={styles.header}>
// 				<TbTableExport /> Export Data{" "}
// 				<div className={styles.subHeader}>
// 					{`(${Object.keys(selectedData).length} selected)`}
// 				</div>
// 			</div>
// 			<div className={styles.content}>
// 				<div className={styles.configureMenu}>
// 					{exportableProperties.map((field) => (
// 						<div className="checkbox-wrapper" key={field}>
// 							<input
// 								type="checkbox"
// 								className="substituted"
// 								id={`field-${field}`}
// 								checked={selectedProperties.includes(field)}
// 								onChange={() => toggleProperty(field)}
// 							/>
// 							<label htmlFor={`field-${field}`}>{field}</label>
// 						</div>
// 					))}
// 				</div>
// 			</div>
// 			<div className={styles.actions}>
// 				<button className={styles.button} onClick={handleCopy}>
// 					<FaCopy /> Copy
// 				</button>
// 			</div>
// 		</>
// 	);
// }


function ExportMenu({ data, close }) {


	return (
		<>
			{" "}
			<div className={styles.header}>
				{" "}
				<TbTableExport /> Export Item{" "}
			</div>
			<div className={styles.content}>
				{data.map((key, data) => {
					<div key={key}>
						<div className={styles.property}>{key.toUpperCase()}</div>
						<div className={styles.propertyData}>{data}</div>
					</div>
				})}
			</div>
			<div className={styles.actions}>
				<button
					className={styles.button}
					onClick={() => {
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
						{type == "export" && <ExportMenu close={close} data={data}/>}
					</div>
				)}
			</Popup>
		</>
	);
}
