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
import parsers from "../lib/parsers/parsers";
import { ActionButton } from "./buttons";
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
				setLoadingState(false);
			} else {
				router.push(`/search?query=${encodeURIComponent(query)}&provider=${settings.currentProvider}`);
			}
		} else {
			toasts.warn("Please enter a query");
			setLoadingState(false);
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
			<ActionButton type="search" onClick={handleSearch} isLoading={loadingState} />
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
			<ActionButton type="find" onClick={handleSearch} />
		</>
	);
}

function LookupBox() {
	const [loadingState, setLoadingState] = useState(false);
	const [inputValue, setInputValue] = useState("");
	const router = useRouter();

	useEffect(() => {
		// Populate box if URL has a query param
		if (router && router.query && router.query.url) {
			setInputValue(Array.isArray(router.query.url) ? router.query.url[0] : router.query.url);
		}
	}, [router.query]);

	async function handleSearch() {
		const query = inputValue.trim();
		setLoadingState(true);
		if (query !== "") {
			let URLInfo = parsers.getUrlInfo(query);
			if (URLInfo && URLInfo.type === "album") {
				let parser = parsers.getParser(URLInfo.provider);
				let albumUrl = parser.createUrl('album', String(URLInfo.id));
				router.push(`/seed?url=${encodeURIComponent(albumUrl.url)}`);
			} else {
				toasts.warn("Please enter a valid album URL");
				setLoadingState(false);
			}
		} else {
			toasts.warn("Please enter a query");
			setLoadingState(false);
		}
	}

	useEffect(() => {
		// Handle enter key
		const lookupBox = document.getElementById("lookupBox");
		if (lookupBox) {
			lookupBox.focus();
		}
		function handleKeyDown(e) {
			if (e.keyCode === 13 && document.activeElement === lookupBox) {
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
				id="lookupBox"
				className={styles.searchBox}
				rows={1}
				placeholder="Enter a supported release URL..."
				value={inputValue}
				onChange={e => setInputValue(e.target.value)}
			/>
			<ActionButton type="lookup" onClick={handleSearch} isLoading={loadingState} />
		</>
	);
}

//TODO: refactor to remove duplication

export default function Box({ type = "search" }: { type?: SearchBoxType}) {
	return <>{type == "find" ? <FindBox /> : type == "lookup" ? <LookupBox /> : <SearchBox />}</>;
}
