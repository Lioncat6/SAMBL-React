import { useState, JSX } from "react";
import styles from "../../styles/popups.module.css";
import { FaCopy, FaChevronDown, FaChevronRight } from "react-icons/fa6";
import { TbTableExport } from "react-icons/tb";
import text from "../../utils/text";
import Popup from "../Popup";

function CopyButton({ value }) {

	return (
		<button
			className={`${styles.copyButton} ${value?.toString().length > 0 ? "" : styles.disabled}`}
			onClick={() => text.copy(Array.isArray(value) && typeof value[0] === "object" ? JSON.stringify(value, null, 2) : String(value))}
			title={value?.toString().length > 0 ? "Copy to Clipboard" : "No data available to copy"}
			disabled={value?.toString().length > 0 ? false : true}
		>
			<FaCopy />
		</button>
	);
}

function ExportMenu({ data, close }: { data: JSON, close?: () => void }) {

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
						text.copy(JSON.stringify(data, null, 2), true);
					}}
				>
					<FaCopy /> Copy All
				</button>
			</div>
		</>
	);
}

export default function ExportMenuPopup({ data, button }: { data: JSON, button?: JSX.Element }) {
    return (
        <Popup button={button}>
            <ExportMenu data={data} />
        </Popup>
    );
}