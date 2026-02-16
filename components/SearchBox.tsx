import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { toast, Flip, ToastOptions } from "react-toastify";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { SAMBLSettingsContext, useSettings } from "./SettingsContext";
import styles from "../styles/SearchBox.module.css";
import { SearchBoxType } from "../types/component-types";
import toasts from "../utils/toasts";
import { ArtistLookupData, SAMBLApiError } from "../types/api-types";
import { PiBoatDuotone } from "react-icons/pi";
function SearchBox() {
	const [loadingState, setLoadingState] = useState(false);
	const [inputValue, setInputValue] = useState("");
	const router = useRouter();
	const { settings, updateSettings, loading } = useSettings() as SAMBLSettingsContext;

	useEffect(() => {
		// Populate box if URL has a query param
		if (router && router.query && router.query.query) {
			setInputValue(Array.isArray(router.query.query) ? router.query.query[0] : router.query.query);
		}
	}, [router.query]);

	async function handleSearch() {
		const query = inputValue.trim();
		setLoadingState(true);
		if (query !== "") {
			const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
			const spfPattern = /^[A-Za-z0-9]{22}$/;
			const urlPattern = /^(https?|http):\/\/[^\s/$.?#].[^\s]*$/i;

			if (urlPattern.test(query)) {
				checkArtist(query);
			} else if (spfPattern.test(query) || uuidPattern.test(query)) {
				toasts.warn("This type of lookup is currently unsupported. Please enter a provider link instead!");
			} else {
				router.push(`/search?query=${encodeURIComponent(query)}&provider=${settings.currentProvider}`);
			}
		} else {
			toasts.warn("Please enter a query");
		}
	}

	async function checkArtist(url) {
		const response = await fetch(`/api/lookupArtist?url=${encodeURIComponent(url)}`);
		if (response.ok) {
			const { mbid, provider, provider_id } = await response.json() as ArtistLookupData;
			if (mbid) {
				router.push(`/artist?provider_id=${provider_id}&provider=${provider}&artist_mbid=${mbid}`);
			} else {
				router.push(`/newartist?provider_id=${provider_id}&provider=${provider}`);
			}
		} else {
			let body = await response.json() as SAMBLApiError;
			toasts.error(body.error || "An error occured while looking up this URL!");
		}
	}

	useEffect(() => {
		// Handle enter key
		const searchBox = document.getElementById("searchbox");
		if (searchBox) {
			searchBox.focus();
		}
		function handleKeyDown(e) {
			if (e.keyCode === 13 && document.activeElement === searchBox) {
				e.preventDefault();
				handleSearch();
			}
		}
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [inputValue]);

	useEffect(() => {
		// Handle resetting loading state
		const handleRouteChange = () => setLoadingState(false);
		router.events.on("routeChangeComplete", handleRouteChange);
		return () => {
			router.events.off("routeChangeComplete", handleRouteChange);
		};
	}, [router.events]);

	return (
		<>
			<textarea
				id="searchbox"
				className={styles.searchBox}
				rows={1}
				placeholder="Search for artist or enter provider url..."
				value={inputValue}
				onChange={e => setInputValue(e.target.value)}
			/>
			<button type="button" className={styles.searchButton} id="searchEnter" onClick={handleSearch}>
				{loadingState ? (
					<div className="lds-ellipsis">
						<div></div>
						<div></div>
						<div></div>
						<div></div>
					</div>
				) : (
					"Search"
				)}
			</button>
		</>
	);
}

function FindBox() {
	const [loadingState, setLoadingState] = useState(false);
	const router = useRouter();

	async function handleSearch() {
		const query = (document.getElementById("findBox") as HTMLTextAreaElement)?.value.trim() || "";
		setLoadingState(true);
		if (query !== "") {
			router.push(`/find?query=${encodeURIComponent(query)}`);
		} else {
			setLoadingState(false);
		}
	}

	useEffect(() => {
		// Handle enter key
		const findBox = document.getElementById("findBox");
		if (findBox) {
			findBox.focus();
		}
		function handleKeyDown(e: KeyboardEvent) {
			if (e.keyCode === 13 && document.activeElement === findBox) {
				e.preventDefault();
				handleSearch();
			}
		}
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	return (
		<>
			<textarea
				id="findBox"
				className={styles.findBox}
				rows={1}
				placeholder="Find by ISRC, MBID, Barcode..."
				defaultValue={""}
			/>
			<button type="button" className={styles.findButton} onClick={handleSearch}>
				<><FaMagnifyingGlass /> Find</>
			</button>
		</>
	);
}

//TODO: refactor to remove duplication

export default function Box({ type = "search" }: { type?: SearchBoxType}) {
	return <>{type == "find" ? <FindBox /> : <SearchBox />}</>;
}
