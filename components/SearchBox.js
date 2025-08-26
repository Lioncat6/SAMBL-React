import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast, Flip } from "react-toastify";
import { FaMagnifyingGlass } from "react-icons/fa6";

import styles from "../styles/SearchBox.module.css";
function SearchBox() {
	const [loadingState, setLoadingState] = useState(false);
	const [inputValue, setInputValue] = useState("");
	const router = useRouter();

	useEffect(() => {
		// Populate box if URL has a query param
		if (router && router.query && router.query.query) {
			setInputValue(router.query.query);
		}
	}, [router.query]);

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
		const query = inputValue.trim();
		setLoadingState(true);
		if (query !== "") {
			const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
			const spfPattern = /^[A-Za-z0-9]{22}$/;
			const urlPattern = /^(https?|http):\/\/[^\s/$.?#].[^\s]*$/i;

			if (urlPattern.test(query)) {
				checkArtist(query);
			} else if (spfPattern.test(query) || uuidPattern.test(query)) {
				dispError("This type of lookup is currently unsupported. Please enter a provider link instead!");
			} else {
				router.push(`/search?query=${encodeURIComponent(query)}`);
			}
		} else {
			dispError("Please enter a query");
		}
	}

	async function checkArtist(url) {
		const response = await fetch(`/api/lookupArtist?url=${encodeURIComponent(url)}`);
		if (response.ok) {
			const { mbid, provider, provider_id } = await response.json();
			if (mbid) {
				router.push(`/artist?provider_id=${provider_id}&provider=${provider}&artist_mbid=${mbid}`);
			} else {
				router.push(`/newartist?provider_id=${provider_id}&provider=${provider}`);
			}
		} else {
			let body = await response.json()
			dispError(body.error || "An error occured while looking up this URL!", "error");
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
