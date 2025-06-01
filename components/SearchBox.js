import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast, Flip } from "react-toastify";
import { FaMagnifyingGlass } from "react-icons/fa6";

import styles from "../styles/SearchBox.module.css";

function SearchBox() {
	const [loadingState, setLoadingState] = useState(false);

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

			transition: Flip,
		};
		if (type === "error") {
			toast.error(message, toastProperties);
		} else {
			toast.warn(message, toastProperties);
		}

		setLoadingState(false);
	}

	async function handleSearch() {
		const query = document.getElementById("searchbox").value.trim();
		setLoadingState(true);
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
	}, []);

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
			<textarea id="searchbox" className={styles.searchBox} rows={1} placeholder="Search for artist or enter id/url..." defaultValue={""} />
			<button type="button" className={styles.searchButton} id="searchEnter" onClick={handleSearch}>
				{loadingState ? (
					<div class="lds-ellipsis">
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
        const query = document.getElementById("findBox").value.trim();
        setLoadingState(true);
        if (query !== "") {
            router.push(`/find?query=${encodeURIComponent(query)}`);
        } else {
            setLoadingState(false);
        }
    }

    useEffect(() => {
        const findBox = document.getElementById("findBox");
        if (findBox) {
            findBox.focus();
        }
        function handleKeyDown(e) {
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
            <textarea id="findBox" className={styles.findBox} rows={1} placeholder="Find by ISRC, MBID, Barcode..." defaultValue={""} />
            <button type="button" className={styles.findButton} id="findEnter" onClick={handleSearch}>
                <><FaMagnifyingGlass /> Find</>
            </button>
        </>
    );
}

export default function Box({ type }) {
	return <>{type == "find" ? <FindBox /> : <SearchBox />}</>;
}
