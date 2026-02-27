import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { toast, Flip } from "react-toastify";
import ItemList from "../../components/ItemList";
import Head from "next/head";
import SearchBox from "../../components/SearchBox";
import { FaWindowRestore } from "react-icons/fa6";
import toasts from "../../utils/toasts";
import { FindData, ISRCData, UPCData, URLLookupData } from "../../types/api-types";
import normalizeVars from "../../utils/normalizeVars";
import { AlbumObject, TrackObject } from "../../types/provider-types";
import parsers from "../../lib/parsers/parsers";

async function serverFind(query, type) {
	try {
		const response = await fetch(`/api/find?query=${query}&type=${type}`)
		if (response.ok) {
			return await response.json() as FindData;
		} else {
			throw new Error((await response.json()).error || response.statusText);
		}
	} catch (error) {
		throw new Error(error)
	}

}

async function getISRCFromURL(url) {
	try {
		const response = await fetch(`/api/getTrackISRCs?url=${encodeURIComponent(url)}`)
		if (response.ok) {
			return await response.json() as ISRCData;
		} else {
			throw new Error((await response.json()).error || response.statusText);
		}
	} catch (error) {
		throw new Error(error)
	}
}

async function getUPCFromURL(url) {
	try {
		const response = await fetch(`/api/getAlbumUPCs?url=${encodeURIComponent(url)}`)
		if (response.ok) {
			return await response.json() as UPCData;
		} else {
			throw new Error((await response.json()).error || response.statusText);
		}
	} catch (error) {
		throw new Error(error)
	}
}

async function lookupUrl(url) {
	try {
		const response = await fetch(`/api/lookupURL?url=${encodeURIComponent(url)}`)
		if (response.ok) {
			return await response.json() as URLLookupData;
		} else {
			throw new Error((await response.json()).error || response.statusText);
		}
	} catch (error) {
		throw new Error(error)
	}
}

export default function Find() {
	const [results, setResults] = useState([] as (AlbumObject | TrackObject)[]);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();
	const { query: urlQuery } = normalizeVars(router.query);
	const lastSearchedQuery = useRef(null as string | null);
	const lastSearchTime = useRef(0);

	function handleResults(results: FindData) {
		let data = results.data || [];
		let issues = results.issues || [];

		if (data.length > 0) {
			setResults(data);
		} else {
			toasts.warn("No results found!");
		}

		if (issues.length > 0) {
			issues.forEach((issue) => {
				toasts.error(`Error with provider ${issue.provider}: ${issue.error}`);
			});
		}
	}

	function handleLookup(results: URLLookupData) {
		if (results.albums.length > 0 || results.tracks.length > 0){
			setResults([...results.albums, ...results.tracks])
		} else {
			toasts.warn("No results found!")
		}
	}

	async function handleSearch() {
		const query = urlQuery;
		const queryTime = Date.now();
		if (query !== "") {
			if (
				query?.trim() !== "" &&
				query !== undefined &&
				(
					query !== lastSearchedQuery.current ||
					queryTime - lastSearchTime.current >= 500
				)
			) {
				lastSearchedQuery.current = query;
				lastSearchTime.current = queryTime;
				setIsLoading(true);
				try {
					const mbidPattern = /.*[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}.*/i;
					const spfPattern = /.*[A-Za-z0-9]{22}$/;
					const isrcPattern = /^[A-Z]{2}-?[A-Z0-9]{3}-?[0-9]{2}-?[0-9]{5}$/;
					const upcPattern = /^\d{12,14}$/;
					const urlPattern = /^(https?|http):\/\/[^\s/$.?#].[^\s]*$/i;
					if (isrcPattern.test(query)) {
						const matchedQuery = query.match(isrcPattern)?.[0];
						handleResults(await toasts.dispPromise(serverFind(matchedQuery, "ISRC"), "Finding by ISRC...", "Error finding by ISRC!"));
					} else if (urlPattern.test(query)) {
						const data = parsers.getUrlInfo(query);
						if (data?.type == "track") {
							let response = await toasts.dispPromise(getISRCFromURL(query), "Looking up ISRC...", "Error looking up ISRC!");
							if (response.isrcs?.length > 0) {
								router.push(`find?query=${response.isrcs[0]}`);
							} else {
								toasts.warn("No ISRC found for this URL");
								handleLookup(await toasts.dispPromise(lookupUrl(query), "Looking up URL...", "Error looking up URL!"));
							}
						} else if (data?.type == "album") {
							let response = await toasts.dispPromise(getUPCFromURL(query), "Looking up Barcode...", "Error looking up Barcode!");
							if (response.upcs?.length > 0) {
								router.push(`find?query=${response.upcs[0]}`);
							} else {
								toasts.warn("No Barcode found for this URL");
								handleLookup(await toasts.dispPromise(lookupUrl(query), "Looking up URL...", "Error looking up URL!"));
							}
						} else if (query.includes("/artist")) {
							toasts.warn("This finding method isn't supported yet. Try using a barcode or ISRC!");
						} else {
							handleLookup(await toasts.dispPromise(lookupUrl(query), "Looking up URL...", "Error looking up URL!"));
						}
					} else if (upcPattern.test(query)) {
						const matchedQuery = query.match(upcPattern)?.[0];
						handleResults(await toasts.dispPromise(serverFind(matchedQuery, "UPC"), "Finding by Barcode...", "Error finding by Barcode!"));
					} else if (mbidPattern.test(query) || spfPattern.test(query)) {
						toasts.warn("Please enter a full URL for the MBID or Spotify ID!");
					} else {
						toasts.warn("Invalid input format. Please enter a valid ISRC, MBID, Barcode, or Spotify link.");
					}
				} catch (error) {
					toasts.error("An error occurred while searching.", error);
				} finally {
					setIsLoading(false);
				}
			}
		} else {
			toast.warn("Please enter a query");
		}
	}

	useEffect(() => {
		const handleRouteChange = (url) => {
			if (url.startsWith("/find")) {
				const findBox = document.getElementById("findBox") as HTMLInputElement | null;
				if (findBox) {
					findBox.value = String(router.query.query) || "";
				}
				handleSearch();
			}
		};

		// Initial run
		if (router.query.query) {
			const findBox = document.getElementById("findBox") as HTMLInputElement | null;
			if (findBox) {
				findBox.value = String(router.query.query) || "";
			}
			handleSearch();
		}

		router.events.on("routeChangeComplete", handleRouteChange);

		return () => {
			router.events.off("routeChangeComplete", handleRouteChange);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [router.query.query]);

	return (
		<>
			<Head>
				<title>{"SAMBL • Find"}</title>
				<meta name="description" content={`SAMBL - Find by ISRC, MBID, Barcode...`} />
			</Head>
			<SearchBox type="find" />
			<div id="contentContainer">
				<div id="loadingMsg" />
				{results.length > 0 && <ItemList type={"mixed"} items={results} />}
			</div>
		</>
	);
}
