import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { ToastContainer, toast, Flip } from 'react-toastify';

export default function Home() {
	const [errorMessage, setErrorMessage] = useState(""); // State for error message
	const router = useRouter();

	function dispError(message, type = "warn") {
		let toastProperties = {
			position: "top-left",
			autoClose: 5000,
			hideProgressBar: false,
			closeOnClick: false,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
			theme: "dark",
			transition: Flip,
		}
		if (type === "error") {
			toast.error(message, toastProperties);
		} else {
			toast.warn(message, toastProperties);
		}

		// setErrorMessage(message);
		document.getElementById("searchEnter").innerHTML = "Search";
	}

	async function handleSearch() {
		const query = document.getElementById("searchbox").value.trim();
		document.getElementById("searchEnter").innerHTML = '<div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div>';
		if (query !== "") {
			const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
			const spfPattern = /^[A-Za-z0-9]{22}$/;

			if (query.includes("https://open.spotify.com/artist/")) {
				const match = query.match(/\/artist\/([^/?]+)/);
				if (match) {
					const spfId = match[1];
					await checkArtist(spfId);
				} else {
					dispError("Invalid Spotify artist link!");
				}
			} else if (spfPattern.test(query)) {
				const spfId = query;
				await checkArtist(spfId);
			} else if (uuidPattern.test(query)) {
				dispError("MB Lookup isn't currently supported; Please enter a Spotify artist link instead!");
			} else if (query.includes("https://open.spotify.com/")) {
				dispError("This type of link isn't currently supported; Please enter a Spotify artist link instead!");
			} else {
				if (query.includes("https")) {
					dispError("This type of link isn't currently supported!");
				} else {
					router.push(`/search?query=${encodeURIComponent(query)}`);
				}
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

			<textarea id="searchbox" rows={1} placeholder="Search for artist or enter id/url..." defaultValue={""} />
			<button type="button" id="searchEnter" onClick={handleSearch}>
				Search
			</button>
			{errorMessage && <div id="err">{errorMessage}</div>} {/* Render error message */}
			<div id="loadingMsg" />
			<ToastContainer
				position="top-right"
				autoClose={3000}
				hideProgressBar={false}
				newestOnTop={false}
				closeOnClick={false}
				rtl={false}
				pauseOnFocusLoss
				draggable
				pauseOnHover
				theme="dark"
				transition={Flip}
			/>
		</>
	);
}
