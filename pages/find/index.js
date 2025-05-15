import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast, Flip } from 'react-toastify';
import { FaMagnifyingGlass } from "react-icons/fa6";
import ItemList from "../../components/ItemList";
import Head from "next/head";

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

export default function Find() {
	const [results, setResults] = useState([]);
	const [isLoading, setIsLoading] = useState(false); // State to manage loading

	const router = useRouter();
	let toastProperties = {
		position: "top-left",
		autoClose: 5000,
		hideProgressBar: false,
		closeOnClick: false,
		pauseOnHover: true,
		draggable: true,
		progress: undefined,

		transition: Flip,
	}
	function dispError(message, type = "warn") {

		if (type === "error") {
			toast.error(message, toastProperties);
		} else {
			toast.warn(message, toastProperties);
		}

		setIsLoading(false); 

	}	
	function dispPromise(promise, message) {
		return toast.promise(promise, {
			pending: message,
			error: "Data not found!"
		}, toastProperties).finally(() => {
			setIsLoading(false); 
		});
	}

	function handleResults(results){
		if (results.length > 0) {
			setResults(results);
		} else {
			dispError("No results found!");
		}
	}

	async function handleSearch() {
		const query = document.getElementById("findBox").value.trim();
		if (query !== "") {
			setIsLoading(true); // Set loading state to true
			try {
				const mbidPattern = /.*[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}.*/i;
				const spfPattern = /.*[A-Za-z0-9]{22}$/;
				const isrcPattern = /^[A-Z]{2}-?[A-Z0-9]{3}-?[0-9]{2}-?[0-9]{5}$/;
				const upcPattern = /^\d{12,14}$/;
				const urlPattern = /^(https?|http):\/\/[^\s/$.?#].[^\s]*$/i;



				if (mbidPattern.test(query)) {
					dispError("This finding method isn't supported yet. Try using a barcode or ISRC!");
					// const matchedQuery = query.match(mbidPattern)[0];
					// handleResults(await dispPromise(serverFind(matchedQuery, "MBID"), "Finding by MBID..."));
				} else if (spfPattern.test(query)) {
					dispError("This finding method isn't supported yet. Try using a barcode or ISRC!");
					// const matchedQuery = query.match(spfPattern)[0];
					// handleResults(await dispPromise(serverFind(matchedQuery, "SPID"), "Finding by Spotify ID..."));
				} else if (isrcPattern.test(query)) {
					const matchedQuery = query.match(isrcPattern)[0];
					handleResults(await dispPromise(serverFind(matchedQuery, "ISRC"), "Finding by ISRC..."));
				} else if (urlPattern.test(query)) {
					dispError("This finding method isn't supported yet. Try using a barcode or ISRC!");
					// const matchedQuery = query.match(urlPattern)[0];
					// handleResults(await dispPromise(serverFind(matchedQuery, "URL"), "Finding by URL..."));
				} else if (upcPattern.test(query)) {
					const matchedQuery = query.match(upcPattern)[0]; 
					handleResults(await dispPromise(serverFind(matchedQuery, "UPC"), "Finding by Barcode..."));
				}
				else {
					dispError("Invalid input format. Please enter a valid ISRC, MBID, Barcode, or Spotify link.");
				}
			} catch (error) {
				dispError("An error occurred while searching.", "error");
			} finally {
				setIsLoading(false); // Set loading state to false
			}
		} else {
			dispError("Please enter a query");
		}
	}

	async function checkArtist(spfId) {
		const response = await fetch(`/api/lookupArtist?spotifyId=${spfId}`);
		if (response.ok) {
			const mbid = await response.json();
			if (mbid) {
				router.push(`/artist?spid=${spfId}&artist_mbid=${mbid}`);
			} else {
				router.push(`/newartist?spid=${spfId}`);
			}
		} else {
			dispError("Spotify artist not found!", "error");
		}
	}

	useEffect(() => {
		function handleKeyDown(e) {
			if (e.keyCode === 13) {
				// Enter key
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
			<Head>
                <title>{"SAMBL • Find"}</title>
                <meta name="description" content={`SAMBL - Find by ISRC, MBID, Barcode...`} />
            </Head>
			<textarea id="findBox" rows={1} placeholder="Find by ISRC, MBID, Barcode..." defaultValue={""} />
			<button type="button" className="findButton" id="searchEnter" onClick={handleSearch}>
				{isLoading ? (
					<div className="lds-ellipsis">
						<div></div>
						<div></div>
						<div></div>
						<div></div>
					</div>
				) : (
					<>
						<FaMagnifyingGlass /> Find
					</>
				)}
			</button>
			<div id="contentContainer">
				<div id="loadingMsg" />
				{(results.length > 0) && <ItemList type={"mixed"} items={results} />}

			</div>
		</>
	);
}
