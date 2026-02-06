import Link from "next/link";
import styles from "../styles/header.module.css";
import stylesb from "../styles/header.module.scss";
import dynamic from "next/dynamic";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";

import { FaMagnifyingGlass, FaGear } from "react-icons/fa6";
import { FaTools, FaUser } from "react-icons/fa";
import { TbTableExport, TbPackageExport } from "react-icons/tb";

import ProviderPill from "./ProviderPill";

import { useExportData } from "./Export";

import Popup from "./Popup";
import ConfigureMenuPopup from "./Popups/ConfigureMenu";
import Image from "next/image";

// const Popup = dynamic(() => import("./Popup"), { ssr: false });

export default function Header() {


	return (
		<>
			<header className={styles.header_container}>
				<ProviderPill />
				<Title />
				<Buttons />
			</header>
		</>
	);
}

function Title() {
	return <>
		<div className={styles.title_container}>
			<Link href="/">
				{/* <img src="assets/images/favicon.svg" alt="SAMBL Logo" className={styles.logo} /> */}
				<Image src="assets/images/favicon.svg" alt="SAMBL Logo" width={256} height={256} className={styles.logo} />
			</Link>
			<div className={styles.textwrapper}>
				<h1 className={styles.title}>SAMBL</h1>
				<div className={stylesb.subtitle}><b>S</b>treaming <b>A</b>rtist <b>M</b>usic<b>B</b>rainz <b>L</b>ookup</div>
			</div>
		</div>
	</>;
}

function Buttons() {
	const { exportItems, exportAllItems } = useExportData();

	return <>
		<div className={styles.button_container}>
			<Menu as="div" className={styles.dropdownWrapper}>
				<MenuButton className={styles.toolsButton}>
					<div className={styles.buttonText}>
						<FaTools /><div className={stylesb.collapse}> Tools</div>
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
					<FaUser /><div className={stylesb.collapse}> Artists</div>
				</div>
			</button>
			<ConfigureMenuPopup
				button={
					<button className={styles.configButton}>
						<div className={styles.buttonText}>
							<FaGear /><div className={stylesb.collapse}> Configure</div>
						</div>
					</button>
				}
			/>
		</div>
	</>;
}