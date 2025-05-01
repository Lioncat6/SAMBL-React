import Link from "next/link";
import styles from "../styles/header.module.css";
import dynamic from "next/dynamic";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";

import { FaMagnifyingGlass, FaGear } from "react-icons/fa6";
import { FaTools, FaUser } from "react-icons/fa";
import { TbTableExport } from "react-icons/tb";


import { useExportData } from "./Export";

const Popup = dynamic(() => import("./Popup"), { ssr: false });

export default function Header() {
	const exportData = useExportData();

	return (
		<>
			<header className={styles.header}>
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
								<FaTools /> Tools
							</div>
						</MenuButton>
						<MenuItems className={styles.dropdownMenu} transition anchor="bottom end">
							<MenuItem>
								<div className={styles.menuItem} onClick={exportData}>
									<TbTableExport /> Export Data
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
							<FaUser /> Artists
						</div>
					</button>
					<Popup
						button={
							<button className={styles.configButton}>
								<div className={styles.buttonText}>
									<FaGear /> Configure
								</div>
							</button>
						}
						type="configure"
					></Popup>
				</div>
			</header>
		</>
	);
}
