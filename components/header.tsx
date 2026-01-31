import Link from "next/link";
import styles from "../styles/header.module.css";
import dynamic from "next/dynamic";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";

import { FaMagnifyingGlass, FaGear } from "react-icons/fa6";
import { FaTools, FaUser } from "react-icons/fa";
import { TbTableExport, TbPackageExport } from "react-icons/tb";

import ProviderPill from "./ProviderPill";

import { useExportData } from "./Export";

import Popup from "./Popup"
import ConfigureMenuPopup from "./Popups/ConfigureMenu";

// const Popup = dynamic(() => import("./Popup"), { ssr: false });

export default function Header() {
	const { exportItems, exportAllItems } = useExportData();

	return (
		<>
			<header className={styles.header}>
				<ProviderPill />
				<Link className={styles.samblWrapper} href="/">
					<div className={styles.imagewrapper}>
						<img src="assets/images/favicon.svg" alt="SAMBL Logo" className={styles.logo} />
					</div>
				</Link>
				<div className={styles.textwrapper}>
					<h1>SAMBL</h1>
					<div className={styles.subdesc}>Streaming Artist MusicBrainz Lookup</div>
				</div>
				<div className={styles.buttonWrapper}>
					<Menu as="div" className={styles.dropdownWrapper}>
						<MenuButton className={styles.toolsButton}>
							<div className={styles.buttonText}>
								<FaTools /><div className={styles.collapse}> Tools</div>
							</div>
						</MenuButton>
						<MenuItems className={styles.dropdownMenu} transition anchor="bottom end">
							<MenuItem>
								<div className={styles.menuItem} onClick={exportItems}>
									<TbPackageExport /> Export Items
								</div>
							</MenuItem>
							<MenuItem>
								<div className={styles.menuItem} onClick={exportAllItems}>
									<TbTableExport /> Export All Items
								</div>
							</MenuItem>
							<MenuItem>
								<Link className={styles.activeItem} href="/find">
									<FaMagnifyingGlass /> Find
								</Link>
							</MenuItem>
						</MenuItems>
					</Menu>
					<button className={styles.savedArtists}>
						<div className={styles.buttonText}>
							<FaUser /><div className={styles.collapse}> Artists</div>
						</div>
					</button>
					<ConfigureMenuPopup
						button={
							<button className={styles.configButton}>
								<div className={styles.buttonText}>
									<FaGear /><div className={styles.collapse}> Configure</div>
								</div>
							</button>
						}
					/>
				</div>
			</header>
		</>
	);
}
