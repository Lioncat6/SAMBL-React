import { useState, Fragment, JSX } from "react";
import styles from "../../styles/popups.module.css";
import { FaXmark, FaFilter, FaCaretDown } from "react-icons/fa6";
import { MdDoNotDisturbOnTotalSilence } from "react-icons/md";
import { TbSortAscending, TbSortDescending } from "react-icons/tb";
import { Transition, Listbox, ListboxButton, ListboxOption, ListboxOptions, Label, Button } from "@headlessui/react";
import { FilterData, listFilterOption, SAMBLSettings } from "../../types/component-types";
import filters from "../../lib/filters";
import Popup from "../Popup";
import { SAMBLSettingsContext, useSettings } from "../SettingsContext";

function SelectedItem({ item, onRemove, exclusive }: { item: listFilterOption, onRemove: (() => void) | false, exclusive?: boolean }) {
	return <div className={`${styles.selectedItem}  ${exclusive && styles.exclusive}`}><span className={styles.selectedItemName}>{item.name}</span>{onRemove && <div className={styles.selectedItemButton} onClick={onRemove}><FaXmark /></div>}</div>;
}

function FilterMenu({ close, data, apply }: { close?: () => void, data: FilterData, apply: (data: any) => void }) {
	const { settings, updateSettings } = useSettings() as SAMBLSettingsContext;
	const [filter, setFilter] = useState(data);
	const [selectedFilterOptions, setSelectedFilterOptions] = useState(filters.getFilters(filter.filters) || filters.getDefaultFilters);
	const [selectedSortOption, setSelectedSortOption] = useState(filters.getSorters(filter.sort) || filters.getDefaultSort());
	const [isAscending, setAscending] = useState(filter.ascending);

	function applyFilters() {
		const newFilter = {
			filters: selectedFilterOptions.map((option) => option.key),
			sort: selectedSortOption.key,
			ascending: isAscending
		};
		setFilter(newFilter);
		let newSettings: Partial<SAMBLSettings> = {

		}
		if (settings.saveFilter){
			if (!newSettings.currentFilter) newSettings.currentFilter = {};
			newSettings.currentFilter.filters = newFilter.filters;
		}
		if (settings.saveSort) {
			if (!newSettings.currentFilter) newSettings.currentFilter = {};
			newSettings.currentFilter.sort = newFilter.sort;
			newSettings.currentFilter.ascending = newFilter.ascending;
		}
		updateSettings(newSettings);
		apply(newFilter);
		if (close) close();
	}

	return (
		<>
			{" "}
			<div className={styles.header}>
				{" "}
				<FaFilter /> Filter Items{" "}
			</div>
			<div className={styles.content}>
				<div className={styles.configureMenu}>
					<Listbox value={selectedFilterOptions} onChange={setSelectedFilterOptions} multiple>
						{({ open }) => (
							<>
								<Label className={styles.selectLabel}>Filter</Label>
								<ListboxButton className={styles.selectBox}>
									<FaCaretDown className={`${styles.carrot} ${open && styles.open}`} />
									{selectedFilterOptions.map((item) => (
										<SelectedItem
											key={item.id}
											item={item}
											exclusive={item.exclusive}
											onRemove={() => setSelectedFilterOptions(selectedFilterOptions.filter((option) => option.id !== item.id))}
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
										{filters.getFilters().map((option) => (
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
					<Listbox value={selectedSortOption} onChange={setSelectedSortOption}>
						{({ open }) => (
							<>
								<Label className={styles.selectLabel}>Sort Items</Label>
								<div className={styles.sortOptionsContainer}>
									<ListboxButton className={styles.selectBox}>
										<FaCaretDown className={`${styles.carrot} ${open && styles.open}`} />
										<span className={styles.selectedSortName}>{selectedSortOption.name}</span>
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
											{filters.getSorters().map((option) => (
												<ListboxOption key={option.id} value={option} as={Fragment}>
													{({ focus, selected }) => (
														<div className={`${styles.selectOption} ${focus ? styles.focused : ""} ${selected ? styles.selected : ""}  ${option.exclusive && styles.exclusive}`}>
															<div className={styles.optionTextContainer}><span className={styles.optionText}>{option.name} {option.exclusive && <span className={styles.exclusiveIcon} title="Shows items that only match this filter"><MdDoNotDisturbOnTotalSilence /></span>}</span></div>
														</div>
													)}
												</ListboxOption>
											))}
										</ListboxOptions>
									</Transition>

									<Button title={isAscending ? "Ascending" : "Descending"} className={styles.sortDirectionButton} onClick={() => setAscending(!isAscending)}>
										<div className={styles.sortDirectionIcon}><TbSortAscending className={`${styles.ascendingIcon} ${isAscending ? styles.ascending : styles.descending}`} /><TbSortDescending className={`${styles.descendingIcon} ${isAscending ? styles.descending : styles.ascending}`} /></div>
									</Button>
								</div>
							</>
						)}
					</Listbox>
				</div>
			</div>
			<div className={styles.actions}>
				<button
					className={styles.button}
					onClick={applyFilters}
				>
					Apply
				</button>
			</div>
		</>
	);
}

export default function FilterMenuPopup({ data, button, apply }: { data: FilterData, button?: JSX.Element, apply: (data: FilterData) => void }) {
    return (
        <Popup button={button}>
            <FilterMenu data={data} apply={apply} />
        </Popup>
    );
}