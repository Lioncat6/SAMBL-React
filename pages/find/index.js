import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { ToastContainer, toast, Flip } from 'react-toastify';
import { FaMagnifyingGlass } from "react-icons/fa6";
import ItemList from "../../components/ItemList";

async function serverFind() {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve("");
		}, 5000);
	});
}

export default function Find() {
	const [results, setResults] = useState([]);

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

		document.getElementById("searchEnter").innerHTML = "Find";
	}

	function dispPromise(promise, message) {
		return toast.promise(promise, { pending: message, error: "Data not found!" }, toastProperties);
	}

	async function handleSearch() {
		const query = document.getElementById("searchbox").value.trim();
		document.getElementById("searchEnter").innerHTML = '<div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div>';
		if (query !== "") {
			const mbidPattern = /.*[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}.*/i;
			const spfPattern = /.*[A-Za-z0-9]{22}$/;
			const isrcPattern = /^[A-Z]{2}-?[A-Z0-9]{3}-?[0-9]{2}-?[0-9]{5}$/;
			const upcPattern = /^\d{12,14}$/;
			const urlPattern = /^(https?|http):\/\/[^\s/$.?#].[^\s]*$/i;


			if (mbidPattern.test(query)) {
				setResults(dispPromise(serverFind(query), "Finding by MBID..."));
			} else if (spfPattern.test(query)) {
				dispPromise(serverFind(query), "Finding by Spotify ID...");
			} else if (isrcPattern.test(query)) {
				dispPromise(serverFind(query), "Finding by ISRC...");
			} else if (urlPattern.test(query)) {
				dispPromise(serverFind(query), "Finding by URL...");
			} else if (upcPattern.test(query)) {
				dispPromise(serverFind(query), "Finding by Barcode...");
			} else {
				dispError("Invalid input format. Please enter a valid ISRC, MBID, Barcode, or Spotify link.");
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

		// Cleanup
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, []);
	return (
		<>
			
			<textarea id="searchbox" rows={1} placeholder="Find by ISRC, MBID, Barcode..." defaultValue={""} />
			<button type="button" className="searchButton" id="searchEnter" onClick={handleSearch}>
				<FaMagnifyingGlass /> Find
			</button>
			<div id="contentContainer"> 
			<div id="loadingMsg" />
			{(results.length > 0) && <ItemList type={"find"} items={results} />}

			</div>
		</>
	);
}
