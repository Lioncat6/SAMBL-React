import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { toast, Flip } from "react-toastify";
import ItemList from "../../components/ItemList";
import Head from "next/head";
import SearchBox from "../../components/SearchBox";
import { FaWindowRestore } from "react-icons/fa6";

async function serverFind(query, type) {
	return new Promise((resolve) => {
		fetch(`/api/find?query=${query}&type=${type}`)
			.then((response) => {
				if (response.ok) {
					return response.json();
				} else {
					return null;
				}
			})
			.then((data) => {
				resolve(data);
			})
			.catch((error) => {
				console.error("Error fetching data:", error);
				resolve([]);
			});
	});
}

async function getISRCFromURL(url) {
	return new Promise((resolve) => {
		fetch(`/api/getTrackISRCs?url=${encodeURIComponent(url)}`)
			.then(async (response) => {
				if (response.ok) {
					return response.json();
				} else {
					throw new Error((await response.json()).error || response.statusText);
				}
			})
			.then((data) => {
				resolve(data);
			})
			.catch((error) => {
				console.error("Error fetching data:", error);
				resolve([]);
			});
	});
}

async function getUPCFromURL(url) {
	return new Promise((resolve) => {
		fetch(`/api/getAlbumUPCs?url=${encodeURIComponent(url)}`)
			.then(async (response) => {
				if (response.ok) {
					return response.json();
				} else {
					throw new Error((await response.json()).error || response.statusText);
				}
			})
			.then((data) => {
				resolve(data);
			})
			.catch((error) => {
				console.error("Error fetching data:", error);
				resolve([]);
			});
	});
}

export default function Find() {
	const [results, setResults] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();
	const { query: urlQuery } = router.query;
	const lastSearchedQuery = useRef(null);
	const lastSearchTime = useRef(0);

	let toastProperties = {
		position: "top-left",
		autoClose: 5000,
		hideProgressBar: false,
		closeOnClick: false,
		pauseOnHover: true,
		draggable: true,
		progress: undefined,

		transition: Flip,
	};
	function dispError(message, type = "warn") {
		if (type === "error") {
			toast.error(message, toastProperties);
		} else {
			toast.warn(message, toastProperties);
		}

		setIsLoading(false);
	}
	function dispPromise(promise, message) {
		return toast
			.promise(
				promise,
				{
					pending: message,
					error: "Data not found!",
				},
				toastProperties
			)
			.finally(() => {
				setIsLoading(false);
			});
	}

	function handleResults(results) {
		let data = results.data || [];
		let issues = results.issues || [];

		if (data.length > 0) {
			setResults(data);
		} else {
			dispError("No results found!");
		}

		if (issues.length > 0) {
			issues.forEach((issue) => {
				dispError(`Error with provider ${issue.provider}: ${issue.error}`, "error");
			});
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
					const soundcloudTrackPattern = /^(https?|http):\/\/(www\.)?soundcloud\.com\/[A-Za-z0-9_\-]+\/[A-Za-z0-9_\-]+$/i;
					const soundcloudSetPattern = /^(https?|http):\/\/(www\.)?soundcloud\.com\/[A-Za-z0-9_\-]+\/sets\/[A-Za-z0-9_\-]+$/i;
					if (isrcPattern.test(query)) {
						const matchedQuery = query.match(isrcPattern)[0];
						handleResults(await dispPromise(serverFind(matchedQuery, "ISRC"), "Finding by ISRC..."));
					} else if (urlPattern.test(query)) {
						if (query.includes("/track") || query.includes("/recording") || soundcloudTrackPattern.test(query)) {
							let response = await dispPromise(getISRCFromURL(query), "Looking up ISRC...");
							if (response.isrcs?.length > 0) {
								router.push(`find?query=${response.isrcs[0]}`);
							} else {
								dispError("No ISRC found for this URL");
							}
						} else if (query.includes("/album") || query.includes("/release/") || query.includes("/releases/") || query.includes("/set/") || soundcloudSetPattern.test(query)) {
							let response = await dispPromise(getUPCFromURL(query), "Looking up Barcode...");
							if (response.upcs?.length > 0) {
								router.push(`find?query=${response.upcs[0]}`);
							} else {
								dispError("No Barcode found for this URL");
							}
						} else if (query.includes("/artist")) {
							dispError("This finding method isn't supported yet. Try using a barcode or ISRC!");
						} else {
							dispError("This URL is currently not supported. Please enter a valid provider track or album URL.");
						}
					} else if (upcPattern.test(query)) {
						const matchedQuery = query.match(upcPattern)[0];
						handleResults(await dispPromise(serverFind(matchedQuery, "UPC"), "Finding by Barcode..."));
					} else if (mbidPattern.test(query) || spfPattern.test(query)) {
						dispError("Please enter a full URL for the MBID or Spotify ID!");
					} else {
						dispError("Invalid input format. Please enter a valid ISRC, MBID, Barcode, or Spotify link.");
					}
				} catch (error) {
					console.error("Error occurred while searching:", error);
					dispError("An error occurred while searching.", "error");
				} finally {
					setIsLoading(false);
				}
			}
		} else {
			dispError("Please enter a query");
		}
	}

	useEffect(() => {
		const handleRouteChange = (url) => {
			if (url.startsWith("/find")) {
				const findBox = document.getElementById("findBox");
				if (findBox) {
					findBox.value = router.query.query || "";
				}
				handleSearch();
			}
		};

		// Initial run
		if (router.query.query) {
			const findBox = document.getElementById("findBox");
			if (findBox) {
				findBox.value = router.query.query || "";
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
